/*
  Warnings:

  - You are about to drop the column `adminComment` on the `Issue` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Issue` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Issue` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Issue` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Issue` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Issue` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `month` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `receiptUrl` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeSessionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Resident` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `apartmentId` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_apartmentId_fkey";

-- DropIndex
DROP INDEX "Payment_apartmentId_idx";

-- DropIndex
DROP INDEX "Payment_apartmentId_month_key";

-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "adminComment",
DROP COLUMN "category",
DROP COLUMN "imageUrl",
DROP COLUMN "location",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "apartmentId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "apartmentId",
DROP COLUMN "month",
DROP COLUMN "receiptUrl",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'ILS',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeSessionId" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Resident" ADD COLUMN     "id" TEXT;

-- DropEnum
DROP TYPE "IssueStatus";

-- CreateTable
CREATE TABLE "PaymentAssignment" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueImage" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAssignment_stripeSessionId_key" ON "PaymentAssignment"("stripeSessionId");

-- CreateIndex
CREATE INDEX "PaymentAssignment_paymentId_idx" ON "PaymentAssignment"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAssignment_apartmentId_idx" ON "PaymentAssignment"("apartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAssignment_paymentId_apartmentId_key" ON "PaymentAssignment"("paymentId", "apartmentId");

-- CreateIndex
CREATE INDEX "IssueImage_issueId_idx" ON "IssueImage"("issueId");

-- CreateIndex
CREATE INDEX "Issue_apartmentId_idx" ON "Issue"("apartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_id_key" ON "Resident"("id");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAssignment" ADD CONSTRAINT "PaymentAssignment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAssignment" ADD CONSTRAINT "PaymentAssignment_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAssignment" ADD CONSTRAINT "PaymentAssignment_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueImage" ADD CONSTRAINT "IssueImage_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
