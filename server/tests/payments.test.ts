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
(globalThis as any).__mockStripeConstructEventError = null;

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
          type:
            (globalThis as any).__mockStripeEventType ||
            "checkout.session.completed",
          data: {
            object: {
              id: (globalThis as any).__mockStripeSessionId || "cs_test_123",
              metadata: {
                userId: (globalThis as any).__mockStripeUserId || "user_1",
              },
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
    (globalThis as any).__mockStripeConstructEventError = null;
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
