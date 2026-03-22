/*
  Warnings:

  - You are about to drop the column `stripeSessionId` on the `Payment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Payment_stripeSessionId_key";

-- DropIndex
DROP INDEX "PaymentAssignment_paymentId_apartmentId_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "stripeSessionId";
