-- AlterTable
ALTER TABLE "scans" ADD COLUMN "triggerRunId" TEXT;

-- AlterTable
ALTER TABLE "broken_link_scans" ADD COLUMN "triggerRunId" TEXT;
