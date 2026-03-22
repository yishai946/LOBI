import prisma from "../src/lib/prisma";
import { resetDb } from "./db";
import {
  calculateNextRetryTime,
  recordReconciliationAttempt,
  findWebhooksForReconciliation,
  retryWebhookEvent,
  recordWebhookMetric,
  reconcileWebhooks,
  getWebhookMetrics,
  getReconciliationAttempts,
} from "../src/services/webhook-reconciliation.service";
import { WebhookEventStatus } from "../generated/prisma/enums";

describe("Webhook Reconciliation Service", () => {
  beforeAll(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("calculateNextRetryTime", () => {
    it("should calculate exponential backoff times correctly", () => {
      const now = Date.now();
      const attempt1 = calculateNextRetryTime(1, 5, 2);
      const attempt2 = calculateNextRetryTime(2, 5, 2);
      const attempt3 = calculateNextRetryTime(3, 5, 2);

      // Initial: 5 minutes
      const diff1 = attempt1.getTime() - now;
      expect(diff1).toBeGreaterThan(5 * 60 * 1000 - 1000);
      expect(diff1).toBeLessThan(5 * 60 * 1000 + 1000);

      // Second: 10 minutes
      const diff2 = attempt2.getTime() - now;
      expect(diff2).toBeGreaterThan(10 * 60 * 1000 - 1000);
      expect(diff2).toBeLessThan(10 * 60 * 1000 + 1000);

      // Third: 20 minutes
      const diff3 = attempt3.getTime() - now;
      expect(diff3).toBeGreaterThan(20 * 60 * 1000 - 1000);
      expect(diff3).toBeLessThan(20 * 60 * 1000 + 1000);
    });
  });

  describe("recordReconciliationAttempt", () => {
    it("should record a reconciliation attempt with PENDING status", async () => {
      const webhookEvent = await prisma.paymentWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: "evt_test_1",
          eventType: "checkout.session.completed",
          status: WebhookEventStatus.FAILED,
        },
      });

      await recordReconciliationAttempt(
        webhookEvent.id,
        "stripe",
        "evt_test_1",
        1,
        "PENDING",
      );

      const attempt = await prisma.webhookReconciliationAttempt.findFirst({
        where: {
          webhookEventId: webhookEvent.id,
        },
      });

      expect(attempt).toBeDefined();
      expect(attempt?.status).toBe("PENDING");
      expect(attempt?.attemptNumber).toBe(1);
    });

    it("should record a reconciliation attempt with FAILED status and error message", async () => {
      const webhookEvent = await prisma.paymentWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: "evt_test_2",
          eventType: "invoice.payment_succeeded",
          status: WebhookEventStatus.FAILED,
        },
      });

      await recordReconciliationAttempt(
        webhookEvent.id,
        "stripe",
        "evt_test_2",
        1,
        "FAILED",
        "Network timeout",
      );

      const attempt = await prisma.webhookReconciliationAttempt.findFirst({
        where: {
          webhookEventId: webhookEvent.id,
        },
      });

      expect(attempt?.status).toBe("FAILED");
      expect(attempt?.errorMessage).toBe("Network timeout");
    });
  });

  describe("findWebhooksForReconciliation", () => {
    beforeEach(async () => {
      // Clear existing webhooks
      await prisma.paymentWebhookEvent.deleteMany({});
    });

    it("should find FAILED webhook events", async () => {
      await prisma.paymentWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: "evt_test_failed_1",
          eventType: "checkout.session.completed",
          status: WebhookEventStatus.FAILED,
        },
      });

      const webhooks = await findWebhooksForReconciliation();
      expect(webhooks).toHaveLength(1);
      expect(webhooks[0].status).toBe(WebhookEventStatus.FAILED);
    });

    it("should find stuck PROCESSING webhook events (older than threshold)", async () => {
      const stuckTime = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

      await prisma.paymentWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: "evt_test_stuck_1",
          eventType: "checkout.session.completed",
          status: WebhookEventStatus.PROCESSING,
          receivedAt: stuckTime,
        },
      });

      const webhooks = await findWebhooksForReconciliation();
      expect(webhooks).toHaveLength(1);
      expect(webhooks[0].status).toBe(WebhookEventStatus.PROCESSING);
    });

    it("should not find recent PROCESSING webhook events", async () => {
      await prisma.paymentWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: "evt_test_recent_1",
          eventType: "checkout.session.completed",
          status: WebhookEventStatus.PROCESSING,
        },
      });

      const webhooks = await findWebhooksForReconciliation();
      expect(webhooks).toHaveLength(0);
    });

    it("should not find PROCESSED webhook events", async () => {
      await prisma.paymentWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: "evt_test_processed_1",
          eventType: "checkout.session.completed",
          status: WebhookEventStatus.PROCESSED,
        },
      });

      const webhooks = await findWebhooksForReconciliation();
      expect(webhooks).toHaveLength(0);
    });
  });

  describe("recordWebhookMetric", () => {
    beforeEach(async () => {
      await prisma.webhookMetrics.deleteMany({});
    });

    it("should create a new metric entry for received webhook", async () => {
      await recordWebhookMetric(
        "stripe",
        "checkout.session.completed",
        "received",
      );

      const metric = await prisma.webhookMetrics.findFirst();
      expect(metric).toBeDefined();
      expect(metric?.totalReceived).toBe(1);
      expect(metric?.totalSucceeded).toBe(0);
      expect(metric?.totalFailed).toBe(0);
    });

    it("should increment existing metric for same day/provider/eventType", async () => {
      await recordWebhookMetric(
        "stripe",
        "checkout.session.completed",
        "received",
      );
      await recordWebhookMetric(
        "stripe",
        "checkout.session.completed",
        "received",
      );
      await recordWebhookMetric(
        "stripe",
        "checkout.session.completed",
        "succeeded",
      );

      const metric = await prisma.webhookMetrics.findFirst();
      expect(metric?.totalReceived).toBe(2);
      expect(metric?.totalSucceeded).toBe(1);
    });

    it("should record processing time and calculate average", async () => {
      await recordWebhookMetric(
        "stripe",
        "invoice.payment_succeeded",
        "received",
      );
      await recordWebhookMetric(
        "stripe",
        "invoice.payment_succeeded",
        "succeeded",
        1000,
      );

      const metric = await prisma.webhookMetrics.findFirst();
      // Average of received (0ms) and succeeded (1000ms) = 500ms
      expect(metric?.avgProcessingTimeMs).toBe(500);
    });
  });

  describe("getWebhookMetrics", () => {
    beforeEach(async () => {
      await prisma.webhookMetrics.deleteMany({});
    });

    it("should retrieve metrics for a date range", async () => {
      await recordWebhookMetric(
        "stripe",
        "checkout.session.completed",
        "received",
      );
      await recordWebhookMetric(
        "stripe",
        "invoice.payment_succeeded",
        "succeeded",
      );

      const startDate = new Date();
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setUTCHours(23, 59, 59, 999);

      const metrics = await getWebhookMetrics(startDate, endDate);
      expect(metrics.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter metrics by provider", async () => {
      await recordWebhookMetric(
        "stripe",
        "checkout.session.completed",
        "received",
      );
      await recordWebhookMetric("paypal", "payment.success", "received");

      const startDate = new Date();
      startDate.setUTCHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setUTCHours(23, 59, 59, 999);

      const stripeMetrics = await getWebhookMetrics(
        startDate,
        endDate,
        "stripe",
      );
      expect(stripeMetrics.every((m) => m.provider === "stripe")).toBe(true);
    });
  });

  describe("retryWebhookEvent", () => {
    beforeEach(async () => {
      await prisma.webhookReconciliationAttempt.deleteMany({});
      await prisma.paymentWebhookEvent.deleteMany({});
    });

    it("should retry a webhook event and mark it as PROCESSING", async () => {
      const webhookEvent = await prisma.paymentWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: "evt_test_retry_1",
          eventType: "checkout.session.completed",
          status: WebhookEventStatus.FAILED,
        },
      });

      await retryWebhookEvent(webhookEvent.id, "stripe", "evt_test_retry_1");

      const updated = await prisma.paymentWebhookEvent.findUnique({
        where: { id: webhookEvent.id },
      });

      expect(updated?.status).toBe(WebhookEventStatus.PROCESSING);
      expect(updated?.lastSeenAt.getTime()).toBeGreaterThan(
        webhookEvent.lastSeenAt.getTime(),
      );
    });

    it("should mark webhook as failed when max retries exceeded", async () => {
      const webhookEvent = await prisma.paymentWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: "evt_test_max_retry_1",
          eventType: "checkout.session.completed",
          status: WebhookEventStatus.FAILED,
        },
      });

      // Create max retry attempts
      const maxRetries = 5;
      for (let i = 0; i < maxRetries; i++) {
        await prisma.webhookReconciliationAttempt.create({
          data: {
            webhookEventId: webhookEvent.id,
            provider: "stripe",
            eventId: "evt_test_max_retry_1",
            attemptNumber: i + 1,
            status: "FAILED",
            errorMessage: "Test error",
          },
        });
      }

      await retryWebhookEvent(
        webhookEvent.id,
        "stripe",
        "evt_test_max_retry_1",
      );

      const updated = await prisma.paymentWebhookEvent.findUnique({
        where: { id: webhookEvent.id },
      });

      expect(updated?.status).toBe(WebhookEventStatus.FAILED);
      expect(updated?.errorMessage).toContain("Max retries");
    });
  });

  describe("getReconciliationAttempts", () => {
    beforeEach(async () => {
      await prisma.webhookReconciliationAttempt.deleteMany({});
      await prisma.paymentWebhookEvent.deleteMany({});
    });

    it("should retrieve all reconciliation attempts for a webhook event", async () => {
      const webhookEvent = await prisma.paymentWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: "evt_test_history_1",
          eventType: "checkout.session.completed",
          status: WebhookEventStatus.FAILED,
        },
      });

      await recordReconciliationAttempt(
        webhookEvent.id,
        "stripe",
        "evt_test_history_1",
        1,
        "FAILED",
        "Error 1",
      );
      await recordReconciliationAttempt(
        webhookEvent.id,
        "stripe",
        "evt_test_history_1",
        2,
        "FAILED",
        "Error 2",
      );

      const attempts = await getReconciliationAttempts(webhookEvent.id);
      expect(attempts).toHaveLength(2);
      expect(attempts[0].attemptNumber).toBe(1);
      expect(attempts[1].attemptNumber).toBe(2);
    });
  });

  describe("reconcileWebhooks", () => {
    beforeEach(async () => {
      await prisma.webhookReconciliationAttempt.deleteMany({});
      await prisma.paymentWebhookEvent.deleteMany({});
      await prisma.webhookMetrics.deleteMany({});
    });

    it("should process failed webhooks and record metrics", async () => {
      const failedWebhook = await prisma.paymentWebhookEvent.create({
        data: {
          provider: "stripe",
          eventId: "evt_reconcile_1",
          eventType: "checkout.session.completed",
          status: WebhookEventStatus.FAILED,
        },
      });

      const metrics = await reconcileWebhooks();

      expect(metrics.totalProcessed).toBeGreaterThan(0);
      expect(metrics.totalRetried).toBeGreaterThan(0);

      // Verify webhook was updated
      const updated = await prisma.paymentWebhookEvent.findUnique({
        where: { id: failedWebhook.id },
      });
      expect(updated?.status).toBe(WebhookEventStatus.PROCESSING);
    });

    it("should handle multiple webhooks in a single reconciliation", async () => {
      // Create multiple failed webhooks
      for (let i = 0; i < 3; i++) {
        await prisma.paymentWebhookEvent.create({
          data: {
            provider: "stripe",
            eventId: `evt_reconcile_multi_${i}`,
            eventType: "invoice.payment_succeeded",
            status: WebhookEventStatus.FAILED,
          },
        });
      }

      const metrics = await reconcileWebhooks();

      expect(metrics.totalProcessed).toBe(3);
      expect(metrics.totalRetried).toBe(3);
    });
  });
});
