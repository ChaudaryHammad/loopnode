-- AlterTable
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "device" TEXT DEFAULT 'desktop';
