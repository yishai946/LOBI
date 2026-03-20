-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('open', 'inProgress', 'done');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "status" "IssueStatus" NOT NULL DEFAULT 'open';
