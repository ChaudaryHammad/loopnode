-- AlterTable
ALTER TABLE "reports" ADD COLUMN "preparedFor" TEXT;
ALTER TABLE "reports" ADD COLUMN "brandName" TEXT;
ALTER TABLE "reports" ADD COLUMN "shareToken" TEXT;
ALTER TABLE "reports" ADD COLUMN "shareEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reports" ADD COLUMN "scanCompletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "reports_shareToken_key" ON "reports"("shareToken");
CREATE INDEX "reports_shareToken_idx" ON "reports"("shareToken");
