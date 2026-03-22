import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import {
  CheckoutPaymentCommand,
  CreateRecurringSeriesCommand,
  CreatePaymentCommand,
  SetRecurringEnrollmentCommand,
  UpdateRecurringSeriesCommand,
  UpdatePaymentCommand,
} from "../validators/payment.validator";
import { SessionPayload } from "../types/auth";
import {
  PaymentStatus,
  RecurringEnrollmentStatus,
  RecurringSeriesStatus,
} from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import { SessionType } from "../enums/sessionType.enum";
import { PaginationOptions, SortOrder } from "../utils/pagination";
import { getPaymentProvider } from "./paymentProviders";

type PaymentFilter =
  | "all"
  | "pending"
  | "paid"
  | "overdue"
  | "upcoming"
  | "recentPaid";

interface PaymentQueryOptions {
  sortByDueAt?: SortOrder;
  filter?: PaymentFilter;
}

const resolveStatusFromFilter = (
  filter?: PaymentFilter,
): PaymentStatus | undefined => {
  if (!filter || filter === "all") {
    return undefined;
  }

  if (filter === "pending" || filter === "overdue" || filter === "upcoming") {
    return PaymentStatus.PENDING;
  }

  if (filter === "paid" || filter === "recentPaid") {
    return PaymentStatus.PAID;
  }

  return undefined;
};

const paymentProvider = getPaymentProvider();

export const getPaymentWebhookSignatureHeader = () =>
  paymentProvider.webhookSignatureHeader;

export const getReceiptPaymentMethodLabel = () =>
  paymentProvider.receiptPaymentMethodLabel;

const DEFAULT_CURRENCY = "ILS";

const getNextMonthlyDate = (
  anchorDay: number,
  referenceDate: Date,
  timeSource: Date,
) => {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();
  const targetMonth = month + 1;
  const daysInTargetMonth = new Date(
    Date.UTC(year, targetMonth + 1, 0),
  ).getUTCDate();
  const safeDay = Math.min(anchorDay, daysInTargetMonth);

  return new Date(
    Date.UTC(
      year,
      targetMonth,
      safeDay,
      timeSource.getUTCHours(),
      timeSource.getUTCMinutes(),
      timeSource.getUTCSeconds(),
      timeSource.getUTCMilliseconds(),
    ),
  );
};

const ensureBuildingAccess = async (
  currentUser: SessionPayload,
  buildingId: string,
) => {
  if (currentUser.sessionType === SessionType.ADMIN) return;

  if (currentUser.buildingId !== buildingId) {
    throw new HttpError("אסור", 403);
  }
};

export const createPayment = async (
  currentUser: SessionPayload,
  data: CreatePaymentCommand,
) => {
  await ensureBuildingAccess(currentUser, data.buildingId);

  const building = await prisma.building.findUnique({
    where: { id: data.buildingId },
    select: { id: true },
  });

  if (!building) {
    throw new HttpError("הבניין לא נמצא", 404);
  }

  const unitAmount = Math.round(Number(data.amount) * 100);

  if (unitAmount < 1) {
    throw new HttpError("הסכום חייב להיות גדול מ-0", 400);
  }

  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        title: data.title,
        description: data.description,
        amount: new Prisma.Decimal(data.amount),
        currency: DEFAULT_CURRENCY,
        dueAt: data.dueAt,
        buildingId: data.buildingId,
        isRecurring: data.isRecurring,
      },
    });

    const apartments = await tx.apartment.findMany({
      where: { buildingId: data.buildingId },
      select: { id: true },
    });

    if (apartments.length > 0) {
      await tx.paymentAssignment.createMany({
        data: apartments.map((apartment) => ({
          paymentId: createdPayment.id,
          apartmentId: apartment.id,
          status: PaymentStatus.PENDING,
        })),
      });
    }

    return createdPayment;
  });

  return { payment };
};

export const constructPaymentWebhookEvent = (
  payload: Buffer,
  signature: string,
) => {
  return paymentProvider.constructWebhookEvent(payload, signature);
};

const resolveBuildingId = (
  currentUser: SessionPayload,
  buildingId?: string,
) => {
  if (currentUser.sessionType === SessionType.ADMIN) {
    if (!buildingId) {
      throw new HttpError("נדרש מזהה בניין", 400);
    }
    return buildingId;
  }

  if (!currentUser.buildingId) {
    throw new HttpError("נדרש הקשר בניין", 400);
  }

  return currentUser.buildingId;
};

export const getPayments = async (
  currentUser: SessionPayload,
  buildingId?: string,
  pagination: PaginationOptions = {},
  queryOptions: PaymentQueryOptions = {},
) => {
  const { limit, skip } = pagination;
  const { sortByDueAt = "desc", filter } = queryOptions;
  const status = resolveStatusFromFilter(filter);
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

  const dueAtWhere =
    filter === "overdue"
      ? { dueAt: { lt: now } }
      : filter === "upcoming"
        ? { dueAt: { gte: now } }
        : {};

  if (currentUser.sessionType === SessionType.ADMIN && !buildingId) {
    const payments = await prisma.payment.findMany({
      where: {
        ...dueAtWhere,
      },
      orderBy: { dueAt: sortByDueAt },
      skip,
      take: limit,
    });

    if (!status) {
      return payments;
    }

    const filteredPaymentIds = await prisma.paymentAssignment.groupBy({
      by: ["paymentId"],
      where: {
        paymentId: { in: payments.map((payment) => payment.id) },
        status,
        ...(filter === "recentPaid" ? { paidAt: { gte: monthAgo } } : {}),
      },
    });

    const allowedIds = new Set(
      filteredPaymentIds.map((item) => item.paymentId),
    );
    return payments.filter((payment) => allowedIds.has(payment.id));
  }

  const targetBuildingId = resolveBuildingId(currentUser, buildingId);

  const payments = await prisma.payment.findMany({
    where: { buildingId: targetBuildingId, ...dueAtWhere },
    orderBy: { dueAt: sortByDueAt },
    skip,
    take: limit,
  });

  if (payments.length === 0) {
    return [];
  }

  const stats = await prisma.paymentAssignment.groupBy({
    by: ["paymentId", "status"],
    where: {
      paymentId: { in: payments.map((payment) => payment.id) },
      ...(status ? { status } : {}),
      ...(filter === "recentPaid" ? { paidAt: { gte: monthAgo } } : {}),
    },
    _count: { _all: true },
  });

  const statsMap = new Map<
    string,
    { total: number; paid: number; pending: number }
  >();

  for (const payment of payments) {
    statsMap.set(payment.id, { total: 0, paid: 0, pending: 0 });
  }

  for (const stat of stats) {
    const current = statsMap.get(stat.paymentId);
    if (!current) continue;

    const count = stat._count._all;
    current.total += count;

    if (stat.status === PaymentStatus.PAID) {
      current.paid += count;
    } else {
      current.pending += count;
    }
  }

  const paymentWithStats = payments.map((payment) => ({
    ...payment,
    assignments: statsMap.get(payment.id) ?? {
      total: 0,
      paid: 0,
      pending: 0,
    },
  }));

  if (!status) {
    if (!filter || filter === "all") {
      return paymentWithStats;
    }

    if (filter === "recentPaid") {
      return paymentWithStats.filter((payment) => payment.assignments.paid > 0);
    }

    const isOverdue = filter === "overdue";
    return paymentWithStats.filter((payment) => {
      const due = new Date(payment.dueAt);
      if (Number.isNaN(due.getTime())) {
        return false;
      }

      return isOverdue
        ? due.getTime() < now.getTime()
        : due.getTime() >= now.getTime();
    });
  }

  return paymentWithStats.filter((payment) => {
    if (status === PaymentStatus.PAID) {
      return payment.assignments.paid > 0;
    }
    return payment.assignments.pending > 0;
  });
};

export const getPaymentById = async (
  currentUser: SessionPayload,
  paymentId: string,
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new HttpError("התשלום לא נמצא", 404);
  }

  if (
    currentUser.sessionType !== SessionType.ADMIN &&
    currentUser.buildingId !== payment.buildingId
  ) {
    throw new HttpError("אסור", 403);
  }

  return payment;
};

export const updatePayment = async (
  currentUser: SessionPayload,
  paymentId: string,
  data: UpdatePaymentCommand,
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new HttpError("התשלום לא נמצא", 404);
  }

  if (
    currentUser.sessionType !== SessionType.ADMIN &&
    currentUser.buildingId !== payment.buildingId
  ) {
    throw new HttpError("אסור", 403);
  }

  if (data.amount && data.amount <= 0) {
    throw new HttpError("הסכום חייב להיות גדול מ-0", 400);
  }

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      title: data.title,
      description: data.description,
      amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
      dueAt: data.dueAt,
      isRecurring: data.isRecurring,
    },
  });
};

export const deletePayment = async (
  currentUser: SessionPayload,
  paymentId: string,
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new HttpError("התשלום לא נמצא", 404);
  }

  if (
    currentUser.sessionType !== SessionType.ADMIN &&
    currentUser.buildingId !== payment.buildingId
  ) {
    throw new HttpError("אסור", 403);
  }

  return prisma.payment.delete({ where: { id: paymentId } });
};

export const getAssignmentsForPayment = async (
  currentUser: SessionPayload,
  paymentId: string,
  pagination: PaginationOptions = {},
) => {
  const { limit, skip } = pagination;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new HttpError("התשלום לא נמצא", 404);
  }

  if (
    currentUser.sessionType !== SessionType.ADMIN &&
    currentUser.buildingId !== payment.buildingId
  ) {
    throw new HttpError("אסור", 403);
  }

  return prisma.paymentAssignment.findMany({
    where: { paymentId },
    include: { apartment: true },
    skip,
    take: limit,
  });
};

export const getMyPayments = async (
  currentUser: SessionPayload,
  pagination: PaginationOptions = {},
  queryOptions: PaymentQueryOptions = {},
) => {
  const { limit, skip } = pagination;
  const { sortByDueAt = "asc", filter } = queryOptions;
  const status = resolveStatusFromFilter(filter);
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

  if (!currentUser.apartmentId) {
    throw new HttpError("נדרש הקשר דירה", 400);
  }

  return prisma.paymentAssignment.findMany({
    where: {
      apartmentId: currentUser.apartmentId,
      ...(status ? { status } : {}),
      ...(filter === "overdue"
        ? {
            payment: {
              dueAt: { lt: now },
            },
          }
        : {}),
      ...(filter === "upcoming"
        ? {
            payment: {
              dueAt: { gte: now },
            },
          }
        : {}),
      ...(filter === "recentPaid"
        ? {
            paidAt: { gte: monthAgo },
          }
        : {}),
    },
    include: { payment: true },
    orderBy: [
      {
        payment: {
          dueAt: sortByDueAt,
        },
      },
      {
        createdAt: "desc",
      },
    ],
    skip,
    take: limit,
  });
};

export const getMyNextPayment = async (currentUser: SessionPayload) => {
  if (!currentUser.apartmentId) {
    throw new HttpError("נדרש הקשר דירה", 400);
  }

  return prisma.paymentAssignment.findFirst({
    where: {
      apartmentId: currentUser.apartmentId,
      status: PaymentStatus.PENDING,
    },
    include: { payment: true },
    orderBy: [
      {
        payment: {
          dueAt: "asc",
        },
      },
      {
        createdAt: "asc",
      },
    ],
  });
};

export const createCheckoutSession = async (
  currentUser: SessionPayload,
  assignmentId: string,
  data: CheckoutPaymentCommand,
  origin?: string,
) => {
  const assignment = await prisma.paymentAssignment.findUnique({
    where: { id: assignmentId },
    include: { payment: true },
  });

  if (!assignment) {
    throw new HttpError("שיוך התשלום לא נמצא", 404);
  }

  if (assignment.status === PaymentStatus.PAID) {
    throw new HttpError("התשלום כבר הושלם", 400);
  }

  if (currentUser.sessionType !== SessionType.RESIDENT) {
    throw new HttpError("אסור", 403);
  }

  if (currentUser.apartmentId !== assignment.apartmentId) {
    throw new HttpError("אסור", 403);
  }

  const requestedRecurring = data.isRecurring ?? assignment.payment.isRecurring;

  if (requestedRecurring && !assignment.payment.isRecurring) {
    throw new HttpError("תשלומים חוזרים אינם מותרים", 400);
  }

  const unitAmount = Math.round(assignment.payment.amount.toNumber() * 100);
  if (unitAmount < 1) {
    throw new HttpError("הסכום חייב להיות גדול מ-0", 400);
  }

  const baseUrl = origin || "http://localhost:3000";
  const session = await paymentProvider.createCheckoutSession({
    mode: requestedRecurring ? "subscription" : "payment",
    lineItems: [
      {
        currency: assignment.payment.currency,
        title: assignment.payment.title,
        description: assignment.payment.description ?? undefined,
        unitAmount,
        recurringMonthly: requestedRecurring,
      },
    ],
    metadata: {
      assignmentId: assignment.id,
      userId: currentUser.userId,
      recurringSeriesId: assignment.payment.recurringSeriesId || "",
      apartmentId: assignment.apartmentId,
      requestRecurring: requestedRecurring ? "true" : "false",
    },
    successUrl: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${baseUrl}/payments`,
  });

  await prisma.paymentAssignment.update({
    where: { id: assignment.id },
    data: { stripeSessionId: session.id },
  });

  return { checkoutUrl: session.url };
};

export const createPayAllCheckoutSession = async (
  currentUser: SessionPayload,
  origin?: string,
) => {
  if (currentUser.sessionType !== SessionType.RESIDENT) {
    throw new HttpError("אסור", 403);
  }

  if (!currentUser.apartmentId) {
    throw new HttpError("נדרש הקשר דירה", 400);
  }

  const pendingAssignments = await prisma.paymentAssignment.findMany({
    where: {
      apartmentId: currentUser.apartmentId,
      status: PaymentStatus.PENDING,
    },
    include: {
      payment: true,
    },
    orderBy: [
      {
        payment: {
          dueAt: "asc",
        },
      },
      {
        createdAt: "asc",
      },
    ],
  });

  if (pendingAssignments.length === 0) {
    throw new HttpError("אין תשלומים ממתינים לתשלום", 400);
  }

  const assignmentIds = pendingAssignments.map((assignment) => assignment.id);
  const assignmentIdsSerialized = assignmentIds.join(",");

  if (assignmentIdsSerialized.length > 480) {
    throw new HttpError(
      "יש יותר מדי חיובים פתוחים לתשלום מרוכז. נסה לשלם חלק מהחיובים בנפרד.",
      400,
    );
  }

  const lineItems = pendingAssignments.map((assignment) => {
    const unitAmount = Math.round(assignment.payment.amount.toNumber() * 100);
    if (unitAmount < 1) {
      throw new HttpError("הסכום חייב להיות גדול מ-0", 400);
    }

    return {
      currency: assignment.payment.currency,
      title: assignment.payment.title,
      description: assignment.payment.description ?? undefined,
      unitAmount,
    };
  });

  const baseUrl = origin || "http://localhost:3000";
  const session = await paymentProvider.createCheckoutSession({
    mode: "payment",
    lineItems,
    metadata: {
      userId: currentUser.userId,
      payAll: "true",
      assignmentIds: assignmentIdsSerialized,
    },
    successUrl: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${baseUrl}`,
  });

  try {
    await prisma.paymentAssignment.updateMany({
      where: {
        id: { in: assignmentIds },
        status: PaymentStatus.PENDING,
      },
      data: { stripeSessionId: session.id },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      await prisma.paymentAssignment.update({
        where: { id: assignmentIds[0] },
        data: { stripeSessionId: session.id },
      });
    } else {
      throw error;
    }
  }

  return {
    checkoutUrl: session.url,
    assignmentsCount: assignmentIds.length,
  };
};

export const markAssignmentPaid = async (
  stripeSessionId: string,
  paidById?: string,
) => {
  const updateResult = await prisma.paymentAssignment.updateMany({
    where: {
      stripeSessionId,
      status: PaymentStatus.PENDING,
    },
    data: {
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      paidById: paidById || undefined,
    },
  });

  if (updateResult.count > 0) {
    return updateResult;
  }

  const existing = await prisma.paymentAssignment.findFirst({
    where: { stripeSessionId },
    select: { id: true },
  });

  if (!existing) {
    throw new HttpError("התשלום לא נמצא", 404);
  }

  return updateResult;
};

export const markAssignmentsPaid = async (
  assignmentIds: string[],
  paidById?: string,
) => {
  if (assignmentIds.length === 0) {
    return { count: 0 };
  }

  return prisma.paymentAssignment.updateMany({
    where: {
      id: { in: assignmentIds },
      status: PaymentStatus.PENDING,
    },
    data: {
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      paidById: paidById || undefined,
    },
  });
};

export const activateRecurringEnrollmentFromCheckout = async (session: {
  id: string;
  metadata: Record<string, string>;
  subscriptionId?: string;
  customerId?: string;
}) => {
  const requestRecurring = session.metadata.requestRecurring === "true";
  if (!requestRecurring) {
    return null;
  }

  const assignmentId = session.metadata.assignmentId;
  if (!assignmentId) {
    return null;
  }

  const assignment = await prisma.paymentAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      payment: {
        select: {
          recurringSeriesId: true,
          dueAt: true,
        },
      },
    },
  });

  if (!assignment?.payment.recurringSeriesId) {
    return null;
  }

  const series = await prisma.recurringPaymentSeries.findUnique({
    where: { id: assignment.payment.recurringSeriesId },
  });

  if (!series || series.status === RecurringSeriesStatus.ENDED) {
    return null;
  }

  const nextBillingAt = getNextMonthlyDate(
    series.anchorDay,
    assignment.payment.dueAt,
    series.startsAt,
  );

  return prisma.recurringPaymentEnrollment.upsert({
    where: {
      seriesId_apartmentId: {
        seriesId: series.id,
        apartmentId: assignment.apartmentId,
      },
    },
    create: {
      seriesId: series.id,
      apartmentId: assignment.apartmentId,
      residentId: session.metadata.userId || null,
      status: RecurringEnrollmentStatus.ACTIVE,
      autoPayEnabledAt: new Date(),
      nextBillingAt,
      providerCustomerId: session.customerId,
      providerSubscriptionId: session.subscriptionId,
    },
    update: {
      residentId: session.metadata.userId || undefined,
      status: RecurringEnrollmentStatus.ACTIVE,
      autoPayEnabledAt: new Date(),
      nextBillingAt,
      providerCustomerId: session.customerId || undefined,
      providerSubscriptionId: session.subscriptionId || undefined,
    },
  });
};

export const handleRecurringChargeSucceeded = async (charge: {
  id: string;
  subscriptionId?: string;
  customerId?: string;
  occurredAt?: Date;
}) => {
  if (!charge.subscriptionId) {
    return null;
  }

  const enrollment = await prisma.recurringPaymentEnrollment.findFirst({
    where: {
      providerSubscriptionId: charge.subscriptionId,
      status: {
        in: [
          RecurringEnrollmentStatus.ACTIVE,
          RecurringEnrollmentStatus.PAUSED,
        ],
      },
    },
    include: {
      series: true,
    },
  });

  if (!enrollment) {
    return null;
  }

  const paidAt = charge.occurredAt || new Date();

  return prisma.$transaction(async (tx) => {
    const pendingAssignment = await tx.paymentAssignment.findFirst({
      where: {
        apartmentId: enrollment.apartmentId,
        status: PaymentStatus.PENDING,
        payment: {
          recurringSeriesId: enrollment.seriesId,
        },
      },
      include: {
        payment: true,
      },
      orderBy: [
        {
          payment: {
            dueAt: "asc",
          },
        },
        {
          createdAt: "asc",
        },
      ],
    });

    if (pendingAssignment) {
      await tx.paymentAssignment.update({
        where: { id: pendingAssignment.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt,
          paidById: enrollment.residentId || undefined,
          stripeSessionId: charge.id,
        },
      });
    }

    if (enrollment.series.status !== RecurringSeriesStatus.ACTIVE) {
      return null;
    }

    if (enrollment.series.endsAt && enrollment.series.endsAt <= paidAt) {
      await tx.recurringPaymentEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: RecurringEnrollmentStatus.CANCELED,
          lastChargedAt: paidAt,
          nextBillingAt: null,
        },
      });
      return null;
    }

    const referenceDueAt = pendingAssignment?.payment.dueAt || paidAt;
    const nextDueAt = getNextMonthlyDate(
      enrollment.series.anchorDay,
      referenceDueAt,
      enrollment.series.startsAt,
    );

    let nextCyclePayment = await tx.payment.findFirst({
      where: {
        recurringSeriesId: enrollment.seriesId,
        dueAt: nextDueAt,
      },
      select: { id: true },
    });

    if (!nextCyclePayment) {
      nextCyclePayment = await tx.payment.create({
        data: {
          title: enrollment.series.title,
          description: enrollment.series.description,
          amount: enrollment.series.amount,
          currency: enrollment.series.currency,
          dueAt: nextDueAt,
          buildingId: enrollment.series.buildingId,
          isRecurring: true,
          recurringSeriesId: enrollment.series.id,
        },
        select: { id: true },
      });

      const apartments = await tx.apartment.findMany({
        where: { buildingId: enrollment.series.buildingId },
        select: { id: true },
      });

      if (apartments.length > 0) {
        await tx.paymentAssignment.createMany({
          data: apartments.map((apartment) => ({
            paymentId: nextCyclePayment!.id,
            apartmentId: apartment.id,
            status: PaymentStatus.PENDING,
          })),
          skipDuplicates: true,
        });
      }
    }

    await tx.recurringPaymentEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: RecurringEnrollmentStatus.ACTIVE,
        lastChargedAt: paidAt,
        nextBillingAt: nextDueAt,
        providerCustomerId: charge.customerId || undefined,
      },
    });

    return { enrollmentId: enrollment.id, nextDueAt };
  });
};

export const handleRecurringChargeFailed = async (charge: {
  subscriptionId?: string;
}) => {
  if (!charge.subscriptionId) {
    return null;
  }

  return prisma.recurringPaymentEnrollment.updateMany({
    where: {
      providerSubscriptionId: charge.subscriptionId,
      status: RecurringEnrollmentStatus.ACTIVE,
    },
    data: {
      status: RecurringEnrollmentStatus.PAUSED,
      nextBillingAt: null,
    },
  });
};

export const syncRecurringEnrollmentSubscriptionState = async (subscription: {
  id: string;
  customerId?: string;
  status?: string;
}) => {
  const mappedStatus =
    subscription.status === "active" || subscription.status === "trialing"
      ? RecurringEnrollmentStatus.ACTIVE
      : subscription.status === "canceled"
        ? RecurringEnrollmentStatus.CANCELED
        : RecurringEnrollmentStatus.PAUSED;

  return prisma.recurringPaymentEnrollment.updateMany({
    where: {
      providerSubscriptionId: subscription.id,
    },
    data: {
      status: mappedStatus,
      providerCustomerId: subscription.customerId || undefined,
      nextBillingAt:
        mappedStatus === RecurringEnrollmentStatus.ACTIVE ? undefined : null,
    },
  });
};

export const getCustomReceiptBySessionId = async (stripeSessionId: string) => {
  const session = await paymentProvider.getSessionSnapshot(stripeSessionId);
  const isPayAll = session.metadata?.payAll === "true";
  const payAllAssignmentIds = (session.metadata?.assignmentIds || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (isPayAll && payAllAssignmentIds.length > 0) {
    const assignments = await prisma.paymentAssignment.findMany({
      where: {
        id: { in: payAllAssignmentIds },
      },
      include: {
        payment: {
          include: {
            building: true,
          },
        },
        apartment: true,
        paidBy: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (assignments.length === 0) {
      throw new HttpError("התשלום לא נמצא", 404);
    }

    const hasPending = assignments.some(
      (assignment) => assignment.status !== PaymentStatus.PAID,
    );
    if (hasPending) {
      throw new HttpError("הקבלה תהיה זמינה לאחר אישור התשלום", 400);
    }

    const firstAssignment = assignments[0];
    const amount = assignments.reduce(
      (sum, assignment) => sum + assignment.payment.amount.toNumber(),
      0,
    );
    const currency = firstAssignment.payment.currency || DEFAULT_CURRENCY;
    const formattedAmount = new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency,
    }).format(amount);

    const paidAtCandidates = assignments
      .map((assignment) => assignment.paidAt)
      .filter((date): date is Date => Boolean(date));
    const issueDate =
      paidAtCandidates[paidAtCandidates.length - 1] || new Date();
    const receiptNumber = `REC-${stripeSessionId.slice(0, 8).toUpperCase()}`;

    return {
      receiptNumber,
      stripeSessionId,
      issueDateIso: issueDate.toISOString(),
      formattedAmount,
      amount,
      currency,
      paymentTitle: `תשלום מרוכז (${assignments.length} חיובים)`,
      paymentDescription: assignments
        .map((assignment) => assignment.payment.title)
        .join(", "),
      paidAtIso: issueDate.toISOString(),
      buildingName: firstAssignment.payment.building.name || "בניין ללא שם",
      buildingAddress: firstAssignment.payment.building.address,
      apartmentName: firstAssignment.apartment.name,
      payerName: firstAssignment.paidBy?.name || "דייר",
      payerPhone: firstAssignment.paidBy?.phone || "",
      businessName:
        process.env.RECEIPT_BUSINESS_NAME ||
        firstAssignment.payment.building.name ||
        "ועד הבית",
      businessId: process.env.RECEIPT_BUSINESS_ID || "לא צוין",
      businessType: process.env.RECEIPT_BUSINESS_TYPE || "עוסק",
      businessAddress:
        process.env.RECEIPT_BUSINESS_ADDRESS ||
        firstAssignment.payment.building.address,
      businessPhone: process.env.RECEIPT_BUSINESS_PHONE || "",
      businessEmail: process.env.RECEIPT_BUSINESS_EMAIL || "",
    };
  }

  const assignment = await prisma.paymentAssignment.findFirst({
    where: { stripeSessionId },
    include: {
      payment: {
        include: {
          building: true,
        },
      },
      apartment: true,
      paidBy: true,
    },
  });

  if (!assignment) {
    throw new HttpError("התשלום לא נמצא", 404);
  }

  if (assignment.status !== PaymentStatus.PAID) {
    throw new HttpError("הקבלה תהיה זמינה לאחר אישור התשלום", 400);
  }

  const amount = assignment.payment.amount.toNumber();
  const currency = assignment.payment.currency || DEFAULT_CURRENCY;

  const formattedAmount = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
  }).format(amount);

  const issueDate = assignment.paidAt || new Date();
  const receiptNumber = `REC-${assignment.id.slice(0, 8).toUpperCase()}`;

  return {
    receiptNumber,
    stripeSessionId,
    issueDateIso: issueDate.toISOString(),
    formattedAmount,
    amount,
    currency,
    paymentTitle: assignment.payment.title,
    paymentDescription: assignment.payment.description,
    paidAtIso: assignment.paidAt?.toISOString() || null,
    buildingName: assignment.payment.building.name || "בניין ללא שם",
    buildingAddress: assignment.payment.building.address,
    apartmentName: assignment.apartment.name,
    payerName: assignment.paidBy?.name || "דייר",
    payerPhone: assignment.paidBy?.phone || "",
    businessName:
      process.env.RECEIPT_BUSINESS_NAME ||
      assignment.payment.building.name ||
      "ועד הבית",
    businessId: process.env.RECEIPT_BUSINESS_ID || "לא צוין",
    businessType: process.env.RECEIPT_BUSINESS_TYPE || "עוסק",
    businessAddress:
      process.env.RECEIPT_BUSINESS_ADDRESS ||
      assignment.payment.building.address,
    businessPhone: process.env.RECEIPT_BUSINESS_PHONE || "",
    businessEmail: process.env.RECEIPT_BUSINESS_EMAIL || "",
  };
};

export const createRecurringSeries = async (
  currentUser: SessionPayload,
  data: CreateRecurringSeriesCommand,
) => {
  await ensureBuildingAccess(currentUser, data.buildingId);

  const startsAt = data.startsAt || new Date();

  if (data.endsAt && data.endsAt <= startsAt) {
    throw new HttpError("תאריך סיום חייב להיות אחרי תאריך ההתחלה", 400);
  }

  const series = await prisma.$transaction(async (tx) => {
    const createdSeries = await tx.recurringPaymentSeries.create({
      data: {
        title: data.title,
        description: data.description,
        amount: new Prisma.Decimal(data.amount),
        currency: DEFAULT_CURRENCY,
        buildingId: data.buildingId,
        createdById: currentUser.userId,
        cadence: data.cadence,
        anchorDay: data.anchorDay,
        startsAt,
        endsAt: data.endsAt,
      },
    });

    if (!data.createInitialPayment) {
      return createdSeries;
    }

    const createdPayment = await tx.payment.create({
      data: {
        title: data.title,
        description: data.description,
        amount: new Prisma.Decimal(data.amount),
        currency: DEFAULT_CURRENCY,
        dueAt: startsAt,
        buildingId: data.buildingId,
        isRecurring: true,
        recurringSeriesId: createdSeries.id,
      },
    });

    const apartments = await tx.apartment.findMany({
      where: { buildingId: data.buildingId },
      select: { id: true },
    });

    if (apartments.length > 0) {
      await tx.paymentAssignment.createMany({
        data: apartments.map((apartment) => ({
          paymentId: createdPayment.id,
          apartmentId: apartment.id,
          status: PaymentStatus.PENDING,
        })),
      });
    }

    return createdSeries;
  });

  return { series };
};

export const getRecurringSeriesForManager = async (
  currentUser: SessionPayload,
  buildingId?: string,
) => {
  const targetBuildingId = resolveBuildingId(currentUser, buildingId);

  const seriesList = await prisma.recurringPaymentSeries.findMany({
    where: { buildingId: targetBuildingId },
    include: {
      _count: {
        select: {
          enrollments: true,
        },
      },
      enrollments: {
        include: {
          apartment: {
            select: {
              id: true,
              name: true,
            },
          },
          resident: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          apartment: {
            name: "asc",
          },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return seriesList;
};

export const updateRecurringSeries = async (
  currentUser: SessionPayload,
  seriesId: string,
  data: UpdateRecurringSeriesCommand,
) => {
  const series = await prisma.recurringPaymentSeries.findUnique({
    where: { id: seriesId },
  });

  if (!series) {
    throw new HttpError("סדרת חיובים לא נמצאה", 404);
  }

  await ensureBuildingAccess(currentUser, series.buildingId);

  if (data.endsAt && data.endsAt <= series.startsAt) {
    throw new HttpError("תאריך סיום חייב להיות אחרי תאריך ההתחלה", 400);
  }

  return prisma.recurringPaymentSeries.update({
    where: { id: seriesId },
    data: {
      title: data.title,
      description: data.description,
      amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
      endsAt: data.endsAt === null ? null : data.endsAt,
      status: data.status,
    },
  });
};

export const getMyRecurringSeries = async (currentUser: SessionPayload) => {
  if (currentUser.sessionType !== SessionType.RESIDENT) {
    throw new HttpError("אסור", 403);
  }

  if (!currentUser.apartmentId) {
    throw new HttpError("נדרש הקשר דירה", 400);
  }

  const apartment = await prisma.apartment.findUnique({
    where: { id: currentUser.apartmentId },
    select: { buildingId: true },
  });

  if (!apartment) {
    throw new HttpError("הדירה לא נמצאה", 404);
  }

  return prisma.recurringPaymentSeries.findMany({
    where: {
      buildingId: apartment.buildingId,
      status: {
        in: [RecurringSeriesStatus.ACTIVE, RecurringSeriesStatus.PAUSED],
      },
    },
    include: {
      enrollments: {
        where: { apartmentId: currentUser.apartmentId },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });
};

export const setMyRecurringEnrollment = async (
  currentUser: SessionPayload,
  seriesId: string,
  data: SetRecurringEnrollmentCommand,
) => {
  if (currentUser.sessionType !== SessionType.RESIDENT) {
    throw new HttpError("אסור", 403);
  }

  if (!currentUser.apartmentId) {
    throw new HttpError("נדרש הקשר דירה", 400);
  }

  const series = await prisma.recurringPaymentSeries.findUnique({
    where: { id: seriesId },
  });

  if (!series) {
    throw new HttpError("סדרת חיובים לא נמצאה", 404);
  }

  const apartment = await prisma.apartment.findUnique({
    where: { id: currentUser.apartmentId },
    select: { buildingId: true },
  });

  if (!apartment || apartment.buildingId !== series.buildingId) {
    throw new HttpError("אסור", 403);
  }

  if (series.status === RecurringSeriesStatus.ENDED) {
    throw new HttpError("לא ניתן להצטרף לסדרה שהסתיימה", 400);
  }

  const status = data.enabled
    ? RecurringEnrollmentStatus.ACTIVE
    : RecurringEnrollmentStatus.CANCELED;

  return prisma.recurringPaymentEnrollment.upsert({
    where: {
      seriesId_apartmentId: {
        seriesId,
        apartmentId: currentUser.apartmentId,
      },
    },
    create: {
      seriesId,
      apartmentId: currentUser.apartmentId,
      residentId: currentUser.userId,
      status,
      autoPayEnabledAt: data.enabled ? new Date() : null,
    },
    update: {
      residentId: currentUser.userId,
      status,
      autoPayEnabledAt: data.enabled ? new Date() : null,
      providerCustomerId: data.enabled ? undefined : null,
      providerSubscriptionId: data.enabled ? undefined : null,
      nextBillingAt: data.enabled ? undefined : null,
    },
  });
};
