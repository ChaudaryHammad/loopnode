-- AlterTable
ALTER TABLE "websites" ADD COLUMN "scanTimezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "websites" ADD COLUMN "scanTimeOfDay" TEXT NOT NULL DEFAULT '09:00';
ALTER TABLE "websites" ADD COLUMN "scanDayOfWeek" INTEGER;
ALTER TABLE "websites" ADD COLUMN "scanDayOfMonth" INTEGER;
ALTER TABLE "websites" ADD COLUMN "nextScanAt" TIMESTAMP(3);
ALTER TABLE "websites" ADD COLUMN "lastScheduledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "scans" ADD COLUMN "triggerRunId" TEXT;

-- CreateIndex
CREATE INDEX "websites_nextScanAt_idx" ON "websites"("nextScanAt");
