/*
  Warnings:

  - The values [RESIDENT] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `number` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `apartmentId` on the `User` table. All the data in the column will be lost.
  - Added the required column `name` to the `Apartment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'USER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_apartmentId_fkey";

-- DropIndex
DROP INDEX "User_apartmentId_idx";

-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "number",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Building" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "apartmentId",
ALTER COLUMN "role" SET DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Resident" (
    "userId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("userId","apartmentId")
);

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
