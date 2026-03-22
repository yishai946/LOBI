import prisma from "../lib/prisma";
import { WebhookEventStatus } from "../../generated/prisma/enums";
import { getPaymentProvider } from "./paymentProviders";

const DEFAULT_MAX_RETRY_ATTEMPTS = 5;
const DEFAULT_INITIAL_BACKOFF_MINUTES = 5;
const DEFAULT_BACKOFF_MULTIPLIER = 2;
const DEFAULT_STUCK_EVENT_THRESHOLD_HOURS = 24;

interface ReconciliationMetrics {
  totalProcessed: number;
  totalRetried: number;
  totalSucceeded: number;
  totalFailed: number;
}

/**
 * Calculates the next retry attempt time with exponential backoff
 */
export const calculateNextRetryTime = (
  attemptNumber: number,
  initialBackoffMinutes: number = DEFAULT_INITIAL_BACKOFF_MINUTES,
  multiplier: number = DEFAULT_BACKOFF_MULTIPLIER,
): Date => {
  const exponentialBackoffMinutes =
    initialBackoffMinutes * Math.pow(multiplier, attemptNumber - 1);
  return new Date(Date.now() + exponentialBackoffMinutes * 60 * 1000);
};

/**
 * Records a webhook reconciliation attempt
 */
export const recordReconciliationAttempt = async (
  webhookEventId: string,
  provider: string,
  eventId: string,
  attemptNumber: number,
  status: string,
  errorMessage?: string,
) => {
  const nextAttemptAt =
    status === "FAILED" ? calculateNextRetryTime(attemptNumber) : null;

  await prisma.webhookReconciliationAttempt.create({
    data: {
      webhookEventId,
      provider,
      eventId,
      attemptNumber,
      status,
      errorMessage,
      nextAttemptAt,
    },
  });
};

/**
 * Finds webhook events that need reconciliation (stuck or failed)
 */
export const findWebhooksForReconciliation = async () => {
  const now = new Date();
  const stuckThresholdHours =
    Number(process.env.WEBHOOK_STUCK_EVENT_THRESHOLD_HOURS) ||
    DEFAULT_STUCK_EVENT_THRESHOLD_HOURS;
  const stuckThresholdMs = stuckThresholdHours * 60 * 60 * 1000;

  return await prisma.paymentWebhookEvent.findMany({
    where: {
      OR: [
        // Failed events
        { status: WebhookEventStatus.FAILED },
        // Stuck events (PROCESSING for too long)
        {
          status: WebhookEventStatus.PROCESSING,
          receivedAt: {
            lt: new Date(now.getTime() - stuckThresholdMs),
          },
        },
      ],
    },
    orderBy: { lastSeenAt: "asc" },
    take: 100, // Batch process to avoid overwhelming the system
  });
};

/**
 * Retries a webhook event processing
 */
export const retryWebhookEvent = async (
  webhookEventId: string,
  provider: string,
  eventId: string,
): Promise<void> => {
  const maxRetries =
    Number(process.env.PAYMENT_WEBHOOK_MAX_RETRIES) ||
    DEFAULT_MAX_RETRY_ATTEMPTS;

  // Count existing retry attempts
  const attemptCount = await prisma.webhookReconciliationAttempt.count({
    where: {
      provider,
      eventId,
    },
  });

  if (attemptCount >= maxRetries) {
    // Mark as permanently failed
    await prisma.paymentWebhookEvent.update({
      where: { id: webhookEventId },
      data: {
        status: WebhookEventStatus.FAILED,
        errorMessage: `Max retries (${maxRetries}) exceeded`,
      },
    });

    await recordReconciliationAttempt(
      webhookEventId,
      provider,
      eventId,
      attemptCount + 1,
      "FAILED_MAX_RETRIES",
      `Max retries (${maxRetries}) exceeded`,
    );

    return;
  }

  // Attempt to reprocess
  const paymentProvider = getPaymentProvider();

  try {
    // Mark as being reprocessed
    await prisma.paymentWebhookEvent.update({
      where: { id: webhookEventId },
      data: {
        status: WebhookEventStatus.PROCESSING,
        lastSeenAt: new Date(),
        errorMessage: null,
      },
    });

    await recordReconciliationAttempt(
      webhookEventId,
      provider,
      eventId,
      attemptCount + 1,
      "PENDING",
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await recordReconciliationAttempt(
      webhookEventId,
      provider,
      eventId,
      attemptCount + 1,
      "FAILED",
      errorMessage,
    );

    throw error;
  }
};

/**
 * Records webhook processing metrics
 */
export const recordWebhookMetric = async (
  provider: string,
  eventType: string,
  status: "received" | "succeeded" | "failed" | "reconciled",
  processingTimeMs?: number,
) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.webhookMetrics.findUnique({
    where: {
      date_provider_eventType: {
        date: today,
        provider,
        eventType,
      },
    },
  });

  const updates: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (status === "received") {
    updates.totalReceived = (existing?.totalReceived || 0) + 1;
  } else if (status === "succeeded") {
    updates.totalSucceeded = (existing?.totalSucceeded || 0) + 1;
  } else if (status === "failed") {
    updates.totalFailed = (existing?.totalFailed || 0) + 1;
  } else if (status === "reconciled") {
    updates.totalReconciled = (existing?.totalReconciled || 0) + 1;
  }

  // Update average processing time if provided
  if (processingTimeMs !== undefined && existing) {
    const totalProcessed =
      (updates.totalReceived || existing.totalReceived) +
      (updates.totalSucceeded || existing.totalSucceeded) +
      (updates.totalFailed || existing.totalFailed);

    if (totalProcessed > 0) {
      const prevTotal =
        existing.totalReceived + existing.totalSucceeded + existing.totalFailed;
      const newAvg =
        (existing.avgProcessingTimeMs * prevTotal + processingTimeMs) /
        totalProcessed;
      updates.avgProcessingTimeMs = Math.round(newAvg);
    }
  }

  if (existing) {
    await prisma.webhookMetrics.update({
      where: {
        date_provider_eventType: {
          date: today,
          provider,
          eventType,
        },
      },
      data: updates,
    });
  } else {
    // For new metrics, ensure all required fields are provided
    const baseData = {
      date: today,
      provider,
      eventType,
      updatedAt: new Date(),
      totalReceived: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      totalReconciled: 0,
      avgProcessingTimeMs: 0,
    };

    if (status === "received") {
      baseData.totalReceived = 1;
    } else if (status === "succeeded") {
      baseData.totalSucceeded = 1;
      if (processingTimeMs !== undefined) {
        baseData.avgProcessingTimeMs = processingTimeMs;
      }
    } else if (status === "failed") {
      baseData.totalFailed = 1;
    } else if (status === "reconciled") {
      baseData.totalReconciled = 1;
    }

    await prisma.webhookMetrics.create({
      data: baseData,
    });
  }
};

/**
 * Reconciles all failed and stuck webhooks
 */
export const reconcileWebhooks = async (): Promise<ReconciliationMetrics> => {
  const metrics: ReconciliationMetrics = {
    totalProcessed: 0,
    totalRetried: 0,
    totalSucceeded: 0,
    totalFailed: 0,
  };

  const webhooksToReconcile = await findWebhooksForReconciliation();

  for (const webhook of webhooksToReconcile) {
    try {
      metrics.totalProcessed++;

      // Check if we should retry this webhook
      const attemptCount = await prisma.webhookReconciliationAttempt.count({
        where: {
          provider: webhook.provider,
          eventId: webhook.eventId,
        },
      });

      const maxRetries =
        Number(process.env.PAYMENT_WEBHOOK_MAX_RETRIES) ||
        DEFAULT_MAX_RETRY_ATTEMPTS;

      if (attemptCount >= maxRetries) {
        // Already exceeded max retries
        metrics.totalFailed++;
        await recordWebhookMetric(
          webhook.provider,
          webhook.eventType,
          "failed",
        );
      } else {
        // Retry the webhook
        await retryWebhookEvent(webhook.id, webhook.provider, webhook.eventId);
        metrics.totalRetried++;
        await recordWebhookMetric(
          webhook.provider,
          webhook.eventType,
          "reconciled",
        );
      }
    } catch (error) {
      console.error(
        `Error reconciling webhook ${webhook.id}:`,
        error instanceof Error ? error.message : "Unknown error",
      );
      metrics.totalFailed++;
    }
  }

  return metrics;
};

/**
 * Gets webhook metrics for a date range
 */
export const getWebhookMetrics = async (
  startDate: Date,
  endDate: Date,
  provider?: string,
) => {
  const where: Record<string, any> = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (provider) {
    where.provider = provider;
  }

  return await prisma.webhookMetrics.findMany({
    where,
    orderBy: [{ date: "desc" }, { provider: "asc" }, { eventType: "asc" }],
  });
};

/**
 * Gets reconciliation attempt history
 */
export const getReconciliationAttempts = async (webhookEventId: string) => {
  return await prisma.webhookReconciliationAttempt.findMany({
    where: { webhookEventId },
    orderBy: { attemptNumber: "asc" },
  });
};
