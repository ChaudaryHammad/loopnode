-- CreateEnum
CREATE TYPE "MonitorHttpMethod" AS ENUM ('HEAD', 'GET');

-- CreateEnum
CREATE TYPE "MonitorStatus" AS ENUM ('UP', 'DOWN', 'DEGRADED', 'UNKNOWN', 'PAUSED');

-- CreateEnum
CREATE TYPE "UptimeCheckResult" AS ENUM ('UP', 'DOWN', 'DEGRADED', 'ERROR');

-- CreateEnum
CREATE TYPE "KeywordMatchMode" AS ENUM ('NONE', 'CONTAINS', 'NOT_CONTAINS');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'UPTIME_DOWN';
ALTER TYPE "NotificationType" ADD VALUE 'UPTIME_RECOVERED';
ALTER TYPE "NotificationType" ADD VALUE 'UPTIME_SSL_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'UPTIME_SLOW';

-- CreateTable
CREATE TABLE "website_monitors" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT NOT NULL,
    "method" "MonitorHttpMethod" NOT NULL DEFAULT 'HEAD',
    "expectedStatusMin" INTEGER NOT NULL DEFAULT 200,
    "expectedStatusMax" INTEGER NOT NULL DEFAULT 399,
    "intervalSeconds" INTEGER NOT NULL DEFAULT 300,
    "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
    "followRedirects" BOOLEAN NOT NULL DEFAULT true,
    "keyword" TEXT,
    "keywordMode" "KeywordMatchMode" NOT NULL DEFAULT 'NONE',
    "alertEmail" BOOLEAN NOT NULL DEFAULT true,
    "alertOnRecovery" BOOLEAN NOT NULL DEFAULT true,
    "failureThreshold" INTEGER NOT NULL DEFAULT 2,
    "slowThresholdMs" INTEGER,
    "checkSsl" BOOLEAN NOT NULL DEFAULT true,
    "sslWarnDays" INTEGER NOT NULL DEFAULT 14,
    "nextCheckAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "lastStatus" "MonitorStatus" NOT NULL DEFAULT 'UNKNOWN',
    "lastLatencyMs" INTEGER,
    "lastHttpStatus" INTEGER,
    "lastError" TEXT,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "consecutiveSuccesses" INTEGER NOT NULL DEFAULT 0,
    "uptimePercent24h" DOUBLE PRECISION,
    "uptimePercent7d" DOUBLE PRECISION,
    "uptimePercent30d" DOUBLE PRECISION,
    "avgLatency24h" DOUBLE PRECISION,
    "sslExpiresAt" TIMESTAMP(3),
    "sslDaysRemaining" INTEGER,
    "lastSslCheckedAt" TIMESTAMP(3),
    "sslAlertSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_monitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uptime_checks" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "result" "UptimeCheckResult" NOT NULL,
    "httpStatus" INTEGER,
    "latencyMs" INTEGER,
    "errorMessage" TEXT,
    "finalUrl" TEXT,
    "keywordMatched" BOOLEAN,
    "sslDaysRemaining" INTEGER,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uptime_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uptime_incidents" (
    "id" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "failCount" INTEGER NOT NULL DEFAULT 1,
    "lastError" TEXT,
    "lastHttpStatus" INTEGER,
    "acknowledgedAt" TIMESTAMP(3),
    "kind" TEXT NOT NULL DEFAULT 'DOWN',

    CONSTRAINT "uptime_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "website_monitors_websiteId_key" ON "website_monitors"("websiteId");

-- CreateIndex
CREATE INDEX "website_monitors_enabled_paused_nextCheckAt_idx" ON "website_monitors"("enabled", "paused", "nextCheckAt");

-- CreateIndex
CREATE INDEX "website_monitors_lastStatus_idx" ON "website_monitors"("lastStatus");

-- CreateIndex
CREATE INDEX "uptime_checks_monitorId_checkedAt_idx" ON "uptime_checks"("monitorId", "checkedAt");

-- CreateIndex
CREATE INDEX "uptime_checks_checkedAt_idx" ON "uptime_checks"("checkedAt");

-- CreateIndex
CREATE INDEX "uptime_checks_result_idx" ON "uptime_checks"("result");

-- CreateIndex
CREATE INDEX "uptime_incidents_monitorId_resolvedAt_idx" ON "uptime_incidents"("monitorId", "resolvedAt");

-- CreateIndex
CREATE INDEX "uptime_incidents_startedAt_idx" ON "uptime_incidents"("startedAt");

-- AddForeignKey
ALTER TABLE "website_monitors" ADD CONSTRAINT "website_monitors_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "websites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uptime_checks" ADD CONSTRAINT "uptime_checks_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "website_monitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uptime_incidents" ADD CONSTRAINT "uptime_incidents_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "website_monitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
