/*
  Warnings:

  - You are about to drop the column `status` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "status",
ADD COLUMN     "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
