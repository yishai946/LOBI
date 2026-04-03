import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";
import { resetDb } from "./db";
import { signToken } from "./helpers";
import { SessionType } from "../src/enums/sessionType.enum";
import { Prisma } from "../generated/prisma/client";
import crypto from "crypto";

(globalThis as any).__mockStripeUserId = "user_1";
(globalThis as any).__mockStripeSessionId = "cs_test_123";
(globalThis as any).__mockStripeEventType = "checkout.session.completed";
(globalThis as any).__mockStripeEventId = `evt_test_${crypto.randomUUID()}`;
(globalThis as any).__mockStripeConstructEventError = null;
(globalThis as any).__mockStripeSessionMetadata = null;
(globalThis as any).__mockStripeSubscriptionId = null;
(globalThis as any).__mockStripeCustomerId = null;
(globalThis as any).__mockStripeInvoiceSubscriptionId = null;
(globalThis as any).__mockStripeInvoiceCustomerId = null;

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockImplementation(() => ({
          id: (globalThis as any).__mockStripeSessionId || "cs_test_123",
          url: "https://stripe.test/checkout",
        })),
      },
    },
    webhooks: {
      constructEvent: jest.fn().mockImplementation(() => {
        const mockError = (globalThis as any).__mockStripeConstructEventError;
        if (mockError) {
          throw mockError;
        }

        return {
          id:
            (globalThis as any).__mockStripeEventId ||
            `evt_test_${crypto.randomUUID()}`,
          type:
            (globalThis as any).__mockStripeEventType ||
            "checkout.session.completed",
          data: {
            object:
              (globalThis as any).__mockStripeEventType ===
                "invoice.payment_succeeded" ||
              (globalThis as any).__mockStripeEventType ===
                "invoice.payment_failed"
                ? {
                    id: `in_${crypto.randomUUID()}`,
                    customer:
                      (globalThis as any).__mockStripeInvoiceCustomerId ||
                      (globalThis as any).__mockStripeCustomerId ||
                      "cus_test_123",
                    subscription:
                      (globalThis as any).__mockStripeInvoiceSubscriptionId ||
                      (globalThis as any).__mockStripeSubscriptionId ||
                      "sub_test_123",
                    created: Math.floor(Date.now() / 1000),
                  }
                : {
                    id:
                      (globalThis as any).__mockStripeSessionId ||
                      "cs_test_123",
                    metadata: (globalThis as any)
                      .__mockStripeSessionMetadata || {
                      userId:
                        (globalThis as any).__mockStripeUserId || "user_1",
                    },
                    customer:
                      (globalThis as any).__mockStripeCustomerId ||
                      "cus_test_123",
                    subscription:
                      (globalThis as any).__mockStripeSubscriptionId ||
                      undefined,
                  },
          },
        };
      }),
    },
  }));
});

describe("Payment routes", () => {
  beforeAll(async () => {
    await resetDb();
  });

  beforeEach(() => {
    (globalThis as any).__mockStripeUserId = "user_1";
    (globalThis as any).__mockStripeSessionId = "cs_test_123";
    (globalThis as any).__mockStripeEventType = "checkout.session.completed";
    (globalThis as any).__mockStripeEventId = `evt_test_${crypto.randomUUID()}`;
    (globalThis as any).__mockStripeConstructEventError = null;
    (globalThis as any).__mockStripeSessionMetadata = null;
    (globalThis as any).__mockStripeSubscriptionId = null;
    (globalThis as any).__mockStripeCustomerId = null;
    (globalThis as any).__mockStripeInvoiceSubscriptionId = null;
    (globalThis as any).__mockStripeInvoiceCustomerId = null;
  });

  const uniquePhone = () =>
    `05${Date.now()}${Math.floor(Math.random() * 90 + 10)}`;

  const createBasicContext = async () => {
    const building = await prisma.building.create({
      data: { name: `Building ${Date.now()}`, address: `Addr ${Date.now()}` },
    });
    const apartment = await prisma.apartment.create({
      data: { name: `Apt ${Date.now()}`, buildingId: building.id },
    });
    const managerUser = await prisma.user.create({
      data: { phone: uniquePhone(), name: "Manager" },
    });
    const residentUser = await prisma.user.create({
      data: { phone: uniquePhone(), name: "Resident" },
    });

    return { building, apartment, managerUser, residentUser };
  };

  const createPayment = async (buildingId: string) => {
    return prisma.payment.create({
      data: {
        title: "Test Payment",
        description: "Test",
        amount: new Prisma.Decimal(100),
        currency: "ILS",
        buildingId,
        isRecurring: false,
      },
    });
  };

  it("manager creates payment and assignments", async () => {
    const { managerUser, building } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "March",
        description: "Maintenance",
        amount: 120,
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        buildingId: building.id,
        isRecurring: true,
      });

    expect(res.status).toBe(201);
  });

  it("resident cannot create payment", async () => {
    const { residentUser, building, apartment } = await createBasicContext();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "March",
        description: "Maintenance",
        amount: 120,
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        buildingId: building.id,
        isRecurring: true,
      });

    expect(res.status).toBe(403);
  });

  it("validates payment payload on create", async () => {
    const { managerUser, building } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "",
        amount: -1,
        buildingId: "bad",
      });

    expect(res.status).toBe(400);
  });

  it("manager can create recurring payment series", async () => {
    const { managerUser, building } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post("/api/payments/recurring-series")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Recurring Committee Fee",
        description: "Monthly recurring fee",
        amount: 150,
        buildingId: building.id,
        cadence: "MONTHLY",
        anchorDay: 10,
        createInitialPayment: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.series?.id).toBeDefined();

    const linkedPayment = await prisma.payment.findFirst({
      where: { recurringSeriesId: res.body.series.id },
    });
    expect(linkedPayment).toBeTruthy();

    const assignmentsCount = await prisma.paymentAssignment.count({
      where: { paymentId: linkedPayment!.id },
    });
    expect(assignmentsCount).toBe(0);
  });

  it("resident enrollment creates assignment for recurring cycle", async () => {
    const { managerUser, residentUser, building, apartment } =
      await createBasicContext();
    const managerToken = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const createSeriesRes = await request(app)
      .post("/api/payments/recurring-series")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        title: "Recurring Enrollment Assignment",
        amount: 95,
        buildingId: building.id,
        cadence: "MONTHLY",
        anchorDay: 10,
        createInitialPayment: true,
      });

    const residentToken = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const enrollRes = await request(app)
      .post(
        `/api/payments/my/recurring-series/${createSeriesRes.body.series.id}/enrollment`,
      )
      .set("Authorization", `Bearer ${residentToken}`)
      .send({ enabled: true });

    expect(enrollRes.status).toBe(200);

    const assignment = await prisma.paymentAssignment.findFirst({
      where: {
        apartmentId: apartment.id,
        payment: {
          recurringSeriesId: createSeriesRes.body.series.id,
        },
      },
    });

    expect(assignment).toBeTruthy();
  });

  it("resident can enable recurring enrollment", async () => {
    const { managerUser, residentUser, building, apartment } =
      await createBasicContext();
    const managerToken = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const createSeriesRes = await request(app)
      .post("/api/payments/recurring-series")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        title: "Recurring Maintenance",
        amount: 120,
        buildingId: building.id,
        cadence: "MONTHLY",
        anchorDay: 5,
        createInitialPayment: false,
      });

    const residentToken = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const enrollRes = await request(app)
      .post(
        `/api/payments/my/recurring-series/${createSeriesRes.body.series.id}/enrollment`,
      )
      .set("Authorization", `Bearer ${residentToken}`)
      .send({ enabled: true });

    expect(enrollRes.status).toBe(200);
    expect(enrollRes.body.enrollment?.status).toBe("ACTIVE");
  });

  it("resident can create checkout session", async () => {
    const { residentUser, managerUser, building, apartment } =
      await createBasicContext();
    (globalThis as any).__mockStripeSessionId =
      `cs_test_${crypto.randomUUID()}`;
    const payment = await createPayment(building.id);
    const assignment =
      (await prisma.paymentAssignment.findFirst({
        where: { paymentId: payment.id, apartmentId: apartment.id },
      })) ??
      (await prisma.paymentAssignment.create({
        data: {
          paymentId: payment.id,
          apartmentId: apartment.id,
          status: "PENDING",
        },
      }));

    const residentToken = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .post(`/api/payments/${assignment.id}/checkout`)
      .set("Authorization", `Bearer ${residentToken}`)
      .send({ isRecurring: false });

    expect(res.status).toBe(200);
    expect(res.body.checkoutUrl).toBeDefined();
  });

  it("manager cannot create checkout session", async () => {
    const { managerUser, building, apartment } = await createBasicContext();
    const payment = await createPayment(building.id);
    const assignment = await prisma.paymentAssignment.create({
      data: {
        paymentId: payment.id,
        apartmentId: apartment.id,
        status: "PENDING",
      },
    });

    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .post(`/api/payments/${assignment.id}/checkout`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isRecurring: false });

    expect(res.status).toBe(403);
  });

  it("resident cannot checkout another apartment assignment", async () => {
    const { residentUser, building, apartment } = await createBasicContext();
    const otherApartment = await prisma.apartment.create({
      data: { name: `Apt X ${Date.now()}`, buildingId: building.id },
    });
    const payment = await createPayment(building.id);
    const assignment = await prisma.paymentAssignment.create({
      data: {
        paymentId: payment.id,
        apartmentId: otherApartment.id,
        status: "PENDING",
      },
    });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .post(`/api/payments/${assignment.id}/checkout`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isRecurring: false });

    expect(res.status).toBe(403);
  });

  it("validates checkout payload", async () => {
    const { residentUser, building, apartment } = await createBasicContext();
    const payment = await createPayment(building.id);
    const assignment = await prisma.paymentAssignment.create({
      data: {
        paymentId: payment.id,
        apartmentId: apartment.id,
        status: "PENDING",
      },
    });

    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .post(`/api/payments/${assignment.id}/checkout`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isRecurring: "no" });

    expect(res.status).toBe(400);
  });

  it("admin can list all payments", async () => {
    const { managerUser, building } = await createBasicContext();
    const admin = await prisma.user.create({
      data: { phone: uniquePhone(), name: "Admin", role: "ADMIN" },
    });
    const managerToken = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        title: "April",
        description: "Fees",
        amount: 50,
        dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        buildingId: building.id,
        isRecurring: false,
      });

    const adminToken = signToken({
      userId: admin.id,
      sessionType: SessionType.ADMIN,
    });

    const res = await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("manager can list payments for their building", async () => {
    const { managerUser, building } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    await createPayment(building.id);

    const res = await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("resident cannot list payments", async () => {
    const { residentUser, building, apartment } = await createBasicContext();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("manager can list assignments for payment", async () => {
    const { managerUser, building, apartment } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const payment = await createPayment(building.id);
    await prisma.paymentAssignment.create({
      data: {
        paymentId: payment.id,
        apartmentId: apartment.id,
        status: "PENDING",
      },
    });

    const res = await request(app)
      .get(`/api/payments/${payment.id}/assignments`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("resident cannot list payment assignments", async () => {
    const { residentUser, building, apartment } = await createBasicContext();
    const payment = await createPayment(building.id);
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get(`/api/payments/${payment.id}/assignments`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 for unknown payment assignments", async () => {
    const { managerUser, building } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/payments/${crypto.randomUUID()}/assignments`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("manager can get payment by id", async () => {
    const { managerUser, building } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const payment = await createPayment(building.id);

    const res = await request(app)
      .get(`/api/payments/${payment.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("returns 404 for unknown payment id", async () => {
    const { managerUser, building } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .get(`/api/payments/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("resident cannot get payment by id", async () => {
    const { residentUser, building, apartment } = await createBasicContext();
    const payment = await createPayment(building.id);
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get(`/api/payments/${payment.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("resident can list my payments", async () => {
    const { residentUser, building, apartment } = await createBasicContext();
    const payment = await createPayment(building.id);
    await prisma.paymentAssignment.create({
      data: {
        paymentId: payment.id,
        apartmentId: apartment.id,
        status: "PENDING",
      },
    });

    const residentToken = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get("/api/payments/my")
      .set("Authorization", `Bearer ${residentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("resident can get next unpaid payment", async () => {
    const { residentUser, building, apartment } = await createBasicContext();
    const firstPayment = await prisma.payment.create({
      data: {
        title: "Early",
        amount: new Prisma.Decimal(80),
        buildingId: building.id,
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const secondPayment = await prisma.payment.create({
      data: {
        title: "Later",
        amount: new Prisma.Decimal(90),
        buildingId: building.id,
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.paymentAssignment.create({
      data: {
        paymentId: secondPayment.id,
        apartmentId: apartment.id,
        status: "PENDING",
      },
    });
    await prisma.paymentAssignment.create({
      data: {
        paymentId: firstPayment.id,
        apartmentId: apartment.id,
        status: "PENDING",
      },
    });

    const residentToken = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .get("/api/payments/my/next")
      .set("Authorization", `Bearer ${residentToken}`);

    expect(res.status).toBe(200);
    expect(res.body?.payment?.id).toBe(firstPayment.id);
  });

  it("manager can update payment", async () => {
    const { managerUser, building } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const payment = await createPayment(building.id);

    const res = await request(app)
      .patch(`/api/payments/${payment.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated July" });

    expect(res.status).toBe(200);
  });

  it("resident cannot update payment", async () => {
    const { residentUser, building, apartment } = await createBasicContext();
    const payment = await createPayment(building.id);
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .patch(`/api/payments/${payment.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Nope" });

    expect(res.status).toBe(403);
  });

  it("returns 404 when updating unknown payment", async () => {
    const { managerUser, building } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/payments/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Missing" });

    expect(res.status).toBe(404);
  });

  it("validates payment payload on update", async () => {
    const { managerUser, building } = await createBasicContext();
    const payment = await createPayment(building.id);
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .patch(`/api/payments/${payment.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: -1 });

    expect(res.status).toBe(400);
  });

  it("manager can delete payment", async () => {
    const { managerUser, building } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const payment = await createPayment(building.id);

    const res = await request(app)
      .delete(`/api/payments/${payment.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("manager cannot delete payment with paid assignment", async () => {
    const { managerUser, building, apartment } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const payment = await createPayment(building.id);
    await prisma.paymentAssignment.create({
      data: {
        paymentId: payment.id,
        apartmentId: apartment.id,
        status: "PAID",
        paidAt: new Date(),
      },
    });

    const res = await request(app)
      .delete(`/api/payments/${payment.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("manager can delete recurring series and keep paid history only", async () => {
    const { managerUser, building, apartment } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const series = await prisma.recurringPaymentSeries.create({
      data: {
        title: "Series Delete",
        amount: new Prisma.Decimal(120),
        currency: "ILS",
        buildingId: building.id,
        createdById: managerUser.id,
        cadence: "MONTHLY",
        anchorDay: 10,
      },
    });

    const paidPayment = await prisma.payment.create({
      data: {
        title: "Paid recurring",
        amount: new Prisma.Decimal(120),
        currency: "ILS",
        dueAt: new Date(),
        buildingId: building.id,
        isRecurring: true,
        recurringSeriesId: series.id,
      },
    });

    const unpaidPayment = await prisma.payment.create({
      data: {
        title: "Unpaid recurring",
        amount: new Prisma.Decimal(120),
        currency: "ILS",
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        buildingId: building.id,
        isRecurring: true,
        recurringSeriesId: series.id,
      },
    });

    await prisma.paymentAssignment.createMany({
      data: [
        {
          paymentId: paidPayment.id,
          apartmentId: apartment.id,
          status: "PAID",
          paidAt: new Date(),
        },
        {
          paymentId: unpaidPayment.id,
          apartmentId: apartment.id,
          status: "PENDING",
        },
      ],
    });

    const res = await request(app)
      .delete(`/api/payments/recurring-series/${series.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    const deletedSeries = await prisma.recurringPaymentSeries.findUnique({
      where: { id: series.id },
    });
    expect(deletedSeries).toBeNull();

    const existingPaidPayment = await prisma.payment.findUnique({
      where: { id: paidPayment.id },
    });
    expect(existingPaidPayment).toBeTruthy();
    expect(existingPaidPayment?.recurringSeriesId).toBeNull();

    const deletedUnpaidPayment = await prisma.payment.findUnique({
      where: { id: unpaidPayment.id },
    });
    expect(deletedUnpaidPayment).toBeNull();
  });

  it("pause removes unpaid recurring and resume rebuilds", async () => {
    const { managerUser, residentUser, building, apartment } =
      await createBasicContext();
    const managerToken = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const startsAt = new Date();
    startsAt.setUTCMonth(startsAt.getUTCMonth() - 2);

    const series = await prisma.recurringPaymentSeries.create({
      data: {
        title: "Pause Resume",
        amount: new Prisma.Decimal(80),
        currency: "ILS",
        buildingId: building.id,
        createdById: managerUser.id,
        cadence: "MONTHLY",
        anchorDay: 10,
        startsAt,
        status: "ACTIVE",
      },
    });

    await prisma.recurringPaymentEnrollment.create({
      data: {
        seriesId: series.id,
        apartmentId: apartment.id,
        residentId: residentUser.id,
        status: "ACTIVE",
      },
    });

    const payment = await prisma.payment.create({
      data: {
        title: "Cycle",
        amount: new Prisma.Decimal(80),
        currency: "ILS",
        dueAt: startsAt,
        buildingId: building.id,
        isRecurring: true,
        recurringSeriesId: series.id,
      },
    });

    await prisma.paymentAssignment.create({
      data: {
        paymentId: payment.id,
        apartmentId: apartment.id,
        status: "PENDING",
      },
    });

    const pauseRes = await request(app)
      .patch(`/api/payments/recurring-series/${series.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ status: "PAUSED" });
    expect(pauseRes.status).toBe(200);

    const afterPauseCount = await prisma.payment.count({
      where: { recurringSeriesId: series.id },
    });
    expect(afterPauseCount).toBe(0);

    const resumeRes = await request(app)
      .patch(`/api/payments/recurring-series/${series.id}`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ status: "ACTIVE" });
    expect(resumeRes.status).toBe(200);

    const rebuiltAssignmentsCount = await prisma.paymentAssignment.count({
      where: {
        apartmentId: apartment.id,
        payment: { recurringSeriesId: series.id },
      },
    });
    expect(rebuiltAssignmentsCount).toBeGreaterThan(0);
  });

  it("resident cannot delete payment", async () => {
    const { residentUser, building, apartment } = await createBasicContext();
    const payment = await createPayment(building.id);
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .delete(`/api/payments/${payment.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 when deleting unknown payment", async () => {
    const { managerUser, building } = await createBasicContext();
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const res = await request(app)
      .delete(`/api/payments/${crypto.randomUUID()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("returns 404 for unknown checkout assignment", async () => {
    const { residentUser, building, apartment } = await createBasicContext();
    const token = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const res = await request(app)
      .post(`/api/payments/${crypto.randomUUID()}/checkout`)
      .set("Authorization", `Bearer ${token}`)
      .send({ isRecurring: false });

    expect(res.status).toBe(404);
  });

  it("webhook marks assignment paid", async () => {
    const { managerUser, building, apartment } = await createBasicContext();
    (globalThis as any).__mockStripeUserId = managerUser.id;
    const token = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const payment = await createPayment(building.id);
    const sessionId = `cs_test_${crypto.randomUUID()}`;
    (globalThis as any).__mockStripeSessionId = sessionId;
    const assignment = await prisma.paymentAssignment.create({
      data: {
        paymentId: payment.id,
        apartmentId: apartment.id,
        status: "PENDING",
      },
    });

    await prisma.paymentAssignment.update({
      where: { id: assignment.id },
      data: { stripeSessionId: sessionId },
    });

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "test")
      .send(Buffer.from(JSON.stringify({})));

    expect(res.status).toBe(200);
    const updated = await prisma.paymentAssignment.findUnique({
      where: { id: assignment.id },
    });
    expect(updated?.status).toBe("PAID");
  });

  it("webhook checkout completed activates recurring enrollment", async () => {
    const { managerUser, residentUser, building, apartment } =
      await createBasicContext();
    const managerToken = signToken({
      userId: managerUser.id,
      sessionType: SessionType.MANAGER,
      buildingId: building.id,
    });

    const createSeriesRes = await request(app)
      .post("/api/payments/recurring-series")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        title: "Recurring Building Fee",
        amount: 90,
        buildingId: building.id,
        cadence: "MONTHLY",
        anchorDay: 12,
        createInitialPayment: true,
      });

    const seriesId = createSeriesRes.body.series.id;

    const residentToken = signToken({
      userId: residentUser.id,
      sessionType: SessionType.RESIDENT,
      buildingId: building.id,
      apartmentId: apartment.id,
    });

    const enrollmentRes = await request(app)
      .post(`/api/payments/my/recurring-series/${seriesId}/enrollment`)
      .set("Authorization", `Bearer ${residentToken}`)
      .send({ enabled: true });

    expect(enrollmentRes.status).toBe(200);

    const payment = await prisma.payment.findFirstOrThrow({
      where: { recurringSeriesId: seriesId },
      orderBy: { createdAt: "desc" },
    });

    const assignment = await prisma.paymentAssignment.findFirstOrThrow({
      where: {
        paymentId: payment.id,
        apartmentId: apartment.id,
      },
    });

    const sessionId = `cs_test_${crypto.randomUUID()}`;
    const subscriptionId = `sub_test_${crypto.randomUUID()}`;
    const customerId = `cus_test_${crypto.randomUUID()}`;

    (globalThis as any).__mockStripeSessionId = sessionId;
    (globalThis as any).__mockStripeSubscriptionId = subscriptionId;
    (globalThis as any).__mockStripeCustomerId = customerId;
    (globalThis as any).__mockStripeSessionMetadata = {
      assignmentId: assignment.id,
      userId: residentUser.id,
      recurringSeriesId: seriesId,
      apartmentId: apartment.id,
      requestRecurring: "true",
    };

    await prisma.paymentAssignment.update({
      where: { id: assignment.id },
      data: { stripeSessionId: sessionId },
    });

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "test")
      .send(Buffer.from(JSON.stringify({})));

    expect(res.status).toBe(200);

    const enrollment = await prisma.recurringPaymentEnrollment.findUnique({
      where: {
        seriesId_apartmentId: {
          seriesId,
          apartmentId: apartment.id,
        },
      },
    });

    expect(enrollment).toBeTruthy();
    expect(enrollment?.status).toBe("ACTIVE");
    expect(enrollment?.providerSubscriptionId).toBe(subscriptionId);
    expect(enrollment?.providerCustomerId).toBe(customerId);
  });

  it("webhook rejects missing stripe signature", async () => {
    const res = await request(app)
      .post("/api/payments/webhook")
      .send(Buffer.from(JSON.stringify({})));

    expect(res.status).toBe(400);
  });

  it("webhook ignores non-completed checkout events", async () => {
    const { managerUser, building, apartment } = await createBasicContext();
    (globalThis as any).__mockStripeUserId = managerUser.id;

    const payment = await createPayment(building.id);
    const sessionId = `cs_test_${crypto.randomUUID()}`;
    (globalThis as any).__mockStripeSessionId = sessionId;
    (globalThis as any).__mockStripeEventType = "checkout.session.expired";

    const assignment = await prisma.paymentAssignment.create({
      data: {
        paymentId: payment.id,
        apartmentId: apartment.id,
        status: "PENDING",
      },
    });

    await prisma.paymentAssignment.update({
      where: { id: assignment.id },
      data: { stripeSessionId: sessionId },
    });

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "test")
      .send(Buffer.from(JSON.stringify({})));

    expect(res.status).toBe(200);
    const unchanged = await prisma.paymentAssignment.findUnique({
      where: { id: assignment.id },
    });
    expect(unchanged?.status).toBe("PENDING");
  });

  it("webhook returns 404 when checkout session id is unknown", async () => {
    (globalThis as any).__mockStripeSessionId =
      `cs_test_${crypto.randomUUID()}`;

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "test")
      .send(Buffer.from(JSON.stringify({})));

    expect(res.status).toBe(404);
  });

  it("webhook is idempotent for duplicate deliveries", async () => {
    const { managerUser, building, apartment } = await createBasicContext();
    (globalThis as any).__mockStripeUserId = managerUser.id;

    const payment = await createPayment(building.id);
    const sessionId = `cs_test_${crypto.randomUUID()}`;
    (globalThis as any).__mockStripeSessionId = sessionId;
    const assignment = await prisma.paymentAssignment.create({
      data: {
        paymentId: payment.id,
        apartmentId: apartment.id,
        status: "PENDING",
      },
    });
    await prisma.paymentAssignment.update({
      where: { id: assignment.id },
      data: { stripeSessionId: sessionId },
    });

    const first = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "test")
      .send(Buffer.from(JSON.stringify({})));
    const second = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "test")
      .send(Buffer.from(JSON.stringify({})));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const updated = await prisma.paymentAssignment.findUnique({
      where: { id: assignment.id },
    });
    expect(updated?.status).toBe("PAID");

    const events = await prisma.paymentWebhookEvent.findMany({
      where: {
        provider: "stripe",
        eventId: (globalThis as any).__mockStripeEventId,
      },
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.status).toBe("PROCESSED");
    expect(events[0]?.deliveryCount).toBe(2);
  });

  it("webhook rejects duplicate event id with different payload hash", async () => {
    const { managerUser, building, apartment } = await createBasicContext();
    (globalThis as any).__mockStripeUserId = managerUser.id;

    const payment = await createPayment(building.id);
    const sessionId = `cs_test_${crypto.randomUUID()}`;
    (globalThis as any).__mockStripeSessionId = sessionId;
    (globalThis as any).__mockStripeEventId = `evt_test_${crypto.randomUUID()}`;
    const assignment = await prisma.paymentAssignment.create({
      data: {
        paymentId: payment.id,
        apartmentId: apartment.id,
        status: "PENDING",
      },
    });

    await prisma.paymentAssignment.update({
      where: { id: assignment.id },
      data: { stripeSessionId: sessionId },
    });

    const first = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "test")
      .set("Content-Type", "application/json")
      .send('{"baseline":true}');

    const second = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "test")
      .set("Content-Type", "application/json")
      .send('{"baseline":false,"tampered":true}');

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);

    const events = await prisma.paymentWebhookEvent.findMany({
      where: {
        provider: "stripe",
        eventId: (globalThis as any).__mockStripeEventId,
      },
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.status).toBe("PROCESSED");
    expect(events[0]?.deliveryCount).toBe(1);
  });

  it("webhook handles malformed payload safely", async () => {
    (globalThis as any).__mockStripeConstructEventError = new Error(
      "Malformed payload",
    );

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("stripe-signature", "test")
      .send(Buffer.from(JSON.stringify({})));

    expect(res.status).toBe(500);
  });
});
