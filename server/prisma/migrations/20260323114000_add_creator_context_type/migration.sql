-- CreateEnum
CREATE TYPE "CreatorContextType" AS ENUM ('MANAGER', 'RESIDENT', 'ADMIN');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN "createdByContextType" "CreatorContextType";
ALTER TABLE "Message" ADD COLUMN "createdByContextType" "CreatorContextType";

-- Backfill clear resident-only creators
UPDATE "Issue" i
SET "createdByContextType" = 'RESIDENT'
WHERE EXISTS (
  SELECT 1
  FROM "Resident" r
  JOIN "Apartment" a ON a."id" = r."apartmentId"
  WHERE r."userId" = i."createdById"
    AND a."buildingId" = i."buildingId"
)
AND NOT EXISTS (
  SELECT 1
  FROM "Manager" m
  WHERE m."userId" = i."createdById"
    AND m."buildingId" = i."buildingId"
);

-- Backfill clear manager-only creators
UPDATE "Issue" i
SET "createdByContextType" = 'MANAGER'
WHERE EXISTS (
  SELECT 1
  FROM "Manager" m
  WHERE m."userId" = i."createdById"
    AND m."buildingId" = i."buildingId"
)
AND NOT EXISTS (
  SELECT 1
  FROM "Resident" r
  JOIN "Apartment" a ON a."id" = r."apartmentId"
  WHERE r."userId" = i."createdById"
    AND a."buildingId" = i."buildingId"
);

-- Backfill clear resident-only creators for messages
UPDATE "Message" msg
SET "createdByContextType" = 'RESIDENT'
WHERE EXISTS (
  SELECT 1
  FROM "Resident" r
  JOIN "Apartment" a ON a."id" = r."apartmentId"
  WHERE r."userId" = msg."createdById"
    AND a."buildingId" = msg."buildingId"
)
AND NOT EXISTS (
  SELECT 1
  FROM "Manager" m
  WHERE m."userId" = msg."createdById"
    AND m."buildingId" = msg."buildingId"
);

-- Backfill clear manager-only creators for messages
UPDATE "Message" msg
SET "createdByContextType" = 'MANAGER'
WHERE EXISTS (
  SELECT 1
  FROM "Manager" m
  WHERE m."userId" = msg."createdById"
    AND m."buildingId" = msg."buildingId"
)
AND NOT EXISTS (
  SELECT 1
  FROM "Resident" r
  JOIN "Apartment" a ON a."id" = r."apartmentId"
  WHERE r."userId" = msg."createdById"
    AND a."buildingId" = msg."buildingId"
);