-- CreateTable
CREATE TABLE "WebhookReconciliationAttempt" (
    "id" TEXT NOT NULL,
    "webhookEventId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "nextAttemptAt" TIMESTAMP(3),
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookReconciliationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookMetrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "totalReceived" INTEGER NOT NULL DEFAULT 0,
    "totalSucceeded" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "totalReconciled" INTEGER NOT NULL DEFAULT 0,
    "avgProcessingTimeMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookReconciliationAttempt_provider_eventId_attemptNumber_key" ON "WebhookReconciliationAttempt"("provider", "eventId", "attemptNumber");

-- CreateIndex
CREATE INDEX "WebhookReconciliationAttempt_webhookEventId_idx" ON "WebhookReconciliationAttempt"("webhookEventId");

-- CreateIndex
CREATE INDEX "WebhookReconciliationAttempt_status_idx" ON "WebhookReconciliationAttempt"("status");

-- CreateIndex
CREATE INDEX "WebhookReconciliationAttempt_nextAttemptAt_idx" ON "WebhookReconciliationAttempt"("nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookMetrics_date_provider_eventType_key" ON "WebhookMetrics"("date", "provider", "eventType");

-- CreateIndex
CREATE INDEX "WebhookMetrics_date_idx" ON "WebhookMetrics"("date");

-- CreateIndex
CREATE INDEX "WebhookMetrics_provider_idx" ON "WebhookMetrics"("provider");
