-- AlterTable
ALTER TABLE "Message" ADD COLUMN "createdById" TEXT;

-- Backfill from a known user to keep existing rows valid
UPDATE "Message"
SET "createdById" = (
  SELECT "id"
  FROM "User"
  ORDER BY "createdAt" ASC
  LIMIT 1
)
WHERE "createdById" IS NULL;

-- Make column required after backfill
ALTER TABLE "Message" ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Message"
ADD CONSTRAINT "Message_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddIndex
CREATE INDEX "Message_createdById_idx" ON "Message"("createdById");