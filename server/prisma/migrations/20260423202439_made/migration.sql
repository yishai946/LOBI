/*
  Warnings:

  - You are about to drop the column `name` on the `Apartment` table. All the data in the column will be lost.
  - You are about to drop the column `tier` on the `Building` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[buildingId,apartmentNumber,floorNumber]` on the table `Apartment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `apartmentNumber` to the `Apartment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floorNumber` to the `Apartment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Apartment_buildingId_name_key";

-- AlterTable
ALTER TABLE "Apartment" DROP COLUMN "name",
ADD COLUMN     "apartmentNumber" TEXT NOT NULL,
ADD COLUMN     "floorNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Building" DROP COLUMN "tier";

-- DropEnum
DROP TYPE "BuildingTier";

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_buildingId_apartmentNumber_floorNumber_key" ON "Apartment"("buildingId", "apartmentNumber", "floorNumber");
