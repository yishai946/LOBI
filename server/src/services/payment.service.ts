import Stripe from "stripe";
import prisma from "../lib/prisma";
import { HttpError } from "../utils/HttpError";
import {
  CheckoutPaymentCommand,
  CreatePaymentCommand,
  UpdatePaymentCommand,
} from "../validators/payment.validator";
import { SessionPayload } from "../types/auth";
import { PaymentStatus } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";
import { SessionType } from "../enums/sessionType.enum";
import { PaginationOptions, SortOrder } from "../utils/pagination";

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

let stripeClient: Stripe | null = null;

const getStripeClient = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new HttpError(
      "STRIPE_SECRET_KEY לא מוגדר. הוסף אותו לסביבת העבודה שלך.",
      500,
    );
  }

  stripeClient = new Stripe(apiKey);
  return stripeClient;
};

const DEFAULT_CURRENCY = "ILS";

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

export const constructStripeEvent = (payload: Buffer, signature: string) => {
  return getStripeClient().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
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
  const session = await getStripeClient().checkout.sessions.create({
    mode: requestedRecurring ? "subscription" : "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: assignment.payment.currency.toLowerCase(),
          product_data: {
            name: assignment.payment.title,
            description: assignment.payment.description ?? undefined,
          },
          unit_amount: unitAmount,
          ...(requestedRecurring ? { recurring: { interval: "month" } } : {}),
        },
        quantity: 1,
      },
    ],
    metadata: {
      assignmentId: assignment.id,
      userId: currentUser.userId,
    },
    success_url: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/payments`,
  });

  if (!session.url) {
    throw new HttpError("כתובת URL של Stripe לא זמינה", 500);
  }

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
      price_data: {
        currency: assignment.payment.currency.toLowerCase(),
        product_data: {
          name: assignment.payment.title,
          description: assignment.payment.description ?? undefined,
        },
        unit_amount: unitAmount,
      },
      quantity: 1,
    };
  });

  const baseUrl = origin || "http://localhost:3000";
  const session = await getStripeClient().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    metadata: {
      userId: currentUser.userId,
      payAll: "true",
      assignmentIds: assignmentIdsSerialized,
    },
    success_url: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}`,
  });

  if (!session.url) {
    throw new HttpError("כתובת URL של Stripe לא זמינה", 500);
  }

  await prisma.paymentAssignment.update({
    where: { id: assignmentIds[0] },
    data: { stripeSessionId: session.id },
  });

  return {
    checkoutUrl: session.url,
    assignmentsCount: assignmentIds.length,
  };
};

export const markAssignmentPaid = async (
  stripeSessionId: string,
  paidById?: string,
) => {
  return prisma.paymentAssignment.update({
    where: { stripeSessionId },
    data: {
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      paidById: paidById || undefined,
    },
  });
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

export const getCustomReceiptBySessionId = async (stripeSessionId: string) => {
  const session =
    await getStripeClient().checkout.sessions.retrieve(stripeSessionId);
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

  const assignment = await prisma.paymentAssignment.findUnique({
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
