/*
  Warnings:

  - You are about to drop the column `apartmentId` on the `Issue` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_apartmentId_fkey";

-- DropIndex
DROP INDEX "Issue_apartmentId_idx";

-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "apartmentId";
