-- CreateEnum
CREATE TYPE "BuildingTier" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "UpgradeFeature" AS ENUM ('DIGITAL_PAYMENTS');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'UPGRADE_REQUEST';

-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "tier" "BuildingTier" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "PaymentAssignment" ADD COLUMN     "proofApprovedAt" TIMESTAMP(3),
ADD COLUMN     "proofApprovedById" TEXT,
ADD COLUMN     "proofKey" TEXT,
ADD COLUMN     "proofUploadedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifyOnIssues" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnMessages" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnPayments" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "UpgradeRequest" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "featureRequested" "UpgradeFeature" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpgradeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UpgradeRequest_buildingId_featureRequested_idx" ON "UpgradeRequest"("buildingId", "featureRequested");

-- CreateIndex
CREATE INDEX "UpgradeRequest_residentId_idx" ON "UpgradeRequest"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "UpgradeRequest_buildingId_residentId_featureRequested_key" ON "UpgradeRequest"("buildingId", "residentId", "featureRequested");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PaymentAssignment_proofApprovedById_idx" ON "PaymentAssignment"("proofApprovedById");

-- AddForeignKey
ALTER TABLE "PaymentAssignment" ADD CONSTRAINT "PaymentAssignment_proofApprovedById_fkey" FOREIGN KEY ("proofApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeRequest" ADD CONSTRAINT "UpgradeRequest_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeRequest" ADD CONSTRAINT "UpgradeRequest_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
