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

let stripeClient: Stripe | null = null;

const getStripeClient = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new HttpError(
      "STRIPE_SECRET_KEY is not configured. Add it to your environment.",
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
    throw new HttpError("Forbidden", 403);
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
    throw new HttpError("Building not found", 404);
  }

  const unitAmount = Math.round(Number(data.amount) * 100);

  if (unitAmount < 1) {
    throw new HttpError("Amount must be greater than 0", 400);
  }

  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        title: data.title,
        description: data.description,
        amount: new Prisma.Decimal(data.amount),
        currency: DEFAULT_CURRENCY,
        buildingId: data.buildingId,
        isRecurring: data.isRecurring,
        status: PaymentStatus.PENDING,
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
      throw new HttpError("Building ID required", 400);
    }
    return buildingId;
  }

  if (!currentUser.buildingId) {
    throw new HttpError("Building context required", 400);
  }

  return currentUser.buildingId;
};

export const getPayments = async (
  currentUser: SessionPayload,
  buildingId?: string,
) => {
  if (currentUser.sessionType === SessionType.ADMIN && !buildingId) {
    return prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  const targetBuildingId = resolveBuildingId(currentUser, buildingId);

  const payments = await prisma.payment.findMany({
    where: { buildingId: targetBuildingId },
    orderBy: { createdAt: "desc" },
  });

  if (payments.length === 0) {
    return [];
  }

  const stats = await prisma.paymentAssignment.groupBy({
    by: ["paymentId", "status"],
    where: { paymentId: { in: payments.map((payment) => payment.id) } },
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

  return payments.map((payment) => ({
    ...payment,
    assignments: statsMap.get(payment.id) ?? {
      total: 0,
      paid: 0,
      pending: 0,
    },
  }));
};

export const getPaymentById = async (
  currentUser: SessionPayload,
  paymentId: string,
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new HttpError("Payment not found", 404);
  }

  if (
    currentUser.sessionType !== SessionType.ADMIN &&
    currentUser.buildingId !== payment.buildingId
  ) {
    throw new HttpError("Forbidden", 403);
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
    throw new HttpError("Payment not found", 404);
  }

  if (
    currentUser.sessionType !== SessionType.ADMIN &&
    currentUser.buildingId !== payment.buildingId
  ) {
    throw new HttpError("Forbidden", 403);
  }

  if (data.amount && data.amount <= 0) {
    throw new HttpError("Amount must be greater than 0", 400);
  }

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      title: data.title,
      description: data.description,
      amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
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
    throw new HttpError("Payment not found", 404);
  }

  if (
    currentUser.sessionType !== SessionType.ADMIN &&
    currentUser.buildingId !== payment.buildingId
  ) {
    throw new HttpError("Forbidden", 403);
  }

  return prisma.payment.delete({ where: { id: paymentId } });
};

export const getAssignmentsForPayment = async (
  currentUser: SessionPayload,
  paymentId: string,
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new HttpError("Payment not found", 404);
  }

  if (
    currentUser.sessionType !== SessionType.ADMIN &&
    currentUser.buildingId !== payment.buildingId
  ) {
    throw new HttpError("Forbidden", 403);
  }

  return prisma.paymentAssignment.findMany({
    where: { paymentId },
    include: { apartment: true },
  });
};

export const getMyPayments = async (currentUser: SessionPayload) => {
  if (!currentUser.apartmentId) {
    throw new HttpError("Apartment context required", 400);
  }

  return prisma.paymentAssignment.findMany({
    where: { apartmentId: currentUser.apartmentId },
    include: { payment: true },
    orderBy: { createdAt: "desc" },
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
    throw new HttpError("Payment assignment not found", 404);
  }

  if (assignment.status === PaymentStatus.PAID) {
    throw new HttpError("Payment already completed", 400);
  }

  if (
    currentUser.sessionType === SessionType.RESIDENT &&
    currentUser.apartmentId !== assignment.apartmentId
  ) {
    throw new HttpError("Forbidden", 403);
  }

  const requestedRecurring = data.isRecurring ?? assignment.payment.isRecurring;

  if (requestedRecurring && !assignment.payment.isRecurring) {
    throw new HttpError("Recurring payments not allowed", 400);
  }

  const unitAmount = Math.round(assignment.payment.amount.toNumber() * 100);
  if (unitAmount < 1) {
    throw new HttpError("Amount must be greater than 0", 400);
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
    cancel_url: `${baseUrl}/payments/cancel`,
  });

  if (!session.url) {
    throw new HttpError("Stripe session URL not available", 500);
  }

  await prisma.paymentAssignment.update({
    where: { id: assignment.id },
    data: { stripeSessionId: session.id },
  });

  return { checkoutUrl: session.url };
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
