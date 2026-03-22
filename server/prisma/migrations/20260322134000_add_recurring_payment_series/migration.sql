-- CreateEnum
CREATE TYPE "RecurringCadence" AS ENUM ('MONTHLY');

-- CreateEnum
CREATE TYPE "RecurringSeriesStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "RecurringEnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "recurringSeriesId" TEXT;

-- CreateTable
CREATE TABLE "RecurringPaymentSeries" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "cadence" "RecurringCadence" NOT NULL DEFAULT 'MONTHLY',
    "anchorDay" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "status" "RecurringSeriesStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringPaymentSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringPaymentEnrollment" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "residentId" TEXT,
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "status" "RecurringEnrollmentStatus" NOT NULL DEFAULT 'CANCELED',
    "autoPayEnabledAt" TIMESTAMP(3),
    "nextBillingAt" TIMESTAMP(3),
    "lastChargedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringPaymentEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_recurringSeriesId_idx" ON "Payment"("recurringSeriesId");

-- CreateIndex
CREATE INDEX "RecurringPaymentSeries_buildingId_idx" ON "RecurringPaymentSeries"("buildingId");

-- CreateIndex
CREATE INDEX "RecurringPaymentSeries_status_idx" ON "RecurringPaymentSeries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringPaymentEnrollment_seriesId_apartmentId_key" ON "RecurringPaymentEnrollment"("seriesId", "apartmentId");

-- CreateIndex
CREATE INDEX "RecurringPaymentEnrollment_apartmentId_idx" ON "RecurringPaymentEnrollment"("apartmentId");

-- CreateIndex
CREATE INDEX "RecurringPaymentEnrollment_status_idx" ON "RecurringPaymentEnrollment"("status");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recurringSeriesId_fkey" FOREIGN KEY ("recurringSeriesId") REFERENCES "RecurringPaymentSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPaymentSeries" ADD CONSTRAINT "RecurringPaymentSeries_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPaymentSeries" ADD CONSTRAINT "RecurringPaymentSeries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPaymentEnrollment" ADD CONSTRAINT "RecurringPaymentEnrollment_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "RecurringPaymentSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPaymentEnrollment" ADD CONSTRAINT "RecurringPaymentEnrollment_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPaymentEnrollment" ADD CONSTRAINT "RecurringPaymentEnrollment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
