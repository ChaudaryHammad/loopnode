-- AlterTable
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "lighthouseReportUrl" TEXT;
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "labEngine" TEXT;
