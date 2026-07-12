import { prisma } from "@/lib/prisma";
import type { MonitorStatus, UptimeCheckResult } from "@prisma/client";
import { probeUrl } from "@/lib/uptime/probe";
import { fetchSslInfo } from "@/lib/uptime/ssl";
import { recomputeMonitorStats, isSuccessfulResult } from "@/lib/uptime/stats";
import {
  notifySslExpiring,
  notifyUptimeDown,
  notifyUptimeRecovered,
  notifyUptimeSlow,
} from "@/lib/uptime/alerts";
import { UPTIME_SSL_RECHECK_HOURS } from "@/lib/uptime/constants";

function nextCheckAt(intervalSeconds: number, from = new Date()): Date {
  return new Date(from.getTime() + intervalSeconds * 1000);
}

export async function runMonitorCheck(monitorId: string): Promise<{
  result: UptimeCheckResult;
  latencyMs: number;
}> {
  const monitor = await prisma.websiteMonitor.findUnique({
    where: { id: monitorId },
    include: {
      website: { select: { id: true, name: true, userId: true, deletedAt: true } },
    },
  });

  if (!monitor || monitor.website.deletedAt) {
    return { result: "ERROR", latencyMs: 0 };
  }

  if (!monitor.enabled || monitor.paused) {
    await prisma.websiteMonitor.update({
      where: { id: monitor.id },
      data: {
        lastStatus: "PAUSED",
        // Never leave a due timestamp while paused/disabled — Trigger would
        // otherwise pick this up the moment the monitor is resumed incorrectly.
        nextCheckAt: null,
      },
    });
    return { result: "ERROR", latencyMs: 0 };
  }

  const probe = await probeUrl({
    url: monitor.url,
    method: monitor.method,
    timeoutMs: monitor.timeoutMs,
    followRedirects: monitor.followRedirects,
    expectedStatusMin: monitor.expectedStatusMin,
    expectedStatusMax: monitor.expectedStatusMax,
    keyword: monitor.keyword,
    keywordMode: monitor.keywordMode,
  });

  let result: UptimeCheckResult = probe.ok ? "UP" : "DOWN";
  let degraded = false;

  if (
    probe.ok &&
    monitor.slowThresholdMs != null &&
    probe.latencyMs > monitor.slowThresholdMs
  ) {
    result = "DEGRADED";
    degraded = true;
  }

  // SSL: refresh at most once per day when enabled
  let sslDaysRemaining: number | null = monitor.sslDaysRemaining;
  let sslExpiresAt = monitor.sslExpiresAt;
  let sslAlertSentAt = monitor.sslAlertSentAt;
  const shouldCheckSsl =
    monitor.checkSsl &&
    monitor.url.startsWith("https:") &&
    (!monitor.lastSslCheckedAt ||
      Date.now() - monitor.lastSslCheckedAt.getTime() >
        UPTIME_SSL_RECHECK_HOURS * 60 * 60 * 1000);

  if (shouldCheckSsl) {
    const ssl = await fetchSslInfo(monitor.url);
    if (ssl.daysRemaining != null) {
      sslDaysRemaining = ssl.daysRemaining;
      sslExpiresAt = ssl.expiresAt;
      if (
        ssl.daysRemaining <= monitor.sslWarnDays &&
        (!sslAlertSentAt ||
          Date.now() - sslAlertSentAt.getTime() > 7 * 24 * 60 * 60 * 1000)
      ) {
        if (monitor.alertEmail) {
          await notifySslExpiring({
            userId: monitor.website.userId,
            websiteId: monitor.website.id,
            websiteName: monitor.website.name,
            url: monitor.url,
            daysRemaining: ssl.daysRemaining,
            expiresAt: ssl.expiresAt ?? new Date(),
          });
        }
        sslAlertSentAt = new Date();
      }
    }
  }

  const checkedAt = new Date();
  await prisma.uptimeCheck.create({
    data: {
      monitorId: monitor.id,
      result,
      httpStatus: probe.httpStatus,
      latencyMs: probe.latencyMs,
      errorMessage: probe.errorMessage,
      finalUrl: probe.finalUrl,
      keywordMatched: probe.keywordMatched,
      sslDaysRemaining,
      checkedAt,
    },
  });

  const success = isSuccessfulResult(result);
  const consecutiveFailures = success ? 0 : monitor.consecutiveFailures + 1;
  const consecutiveSuccesses = success ? monitor.consecutiveSuccesses + 1 : 0;

  let lastStatus: MonitorStatus = success ? (degraded ? "DEGRADED" : "UP") : "DOWN";

  // Incident open/close
  const openIncident = await prisma.uptimeIncident.findFirst({
    where: { monitorId: monitor.id, resolvedAt: null, kind: "DOWN" },
    orderBy: { startedAt: "desc" },
  });

  if (!success && consecutiveFailures >= monitor.failureThreshold) {
    if (!openIncident) {
      await prisma.uptimeIncident.create({
        data: {
          monitorId: monitor.id,
          kind: "DOWN",
          failCount: consecutiveFailures,
          lastError: probe.errorMessage,
          lastHttpStatus: probe.httpStatus,
          startedAt: checkedAt,
        },
      });
      if (monitor.alertEmail) {
        await notifyUptimeDown({
          userId: monitor.website.userId,
          websiteId: monitor.website.id,
          websiteName: monitor.website.name,
          url: monitor.url,
          error: probe.errorMessage ?? "Check failed",
          httpStatus: probe.httpStatus,
          checkedAt,
        });
      }
    } else {
      await prisma.uptimeIncident.update({
        where: { id: openIncident.id },
        data: {
          failCount: consecutiveFailures,
          lastError: probe.errorMessage,
          lastHttpStatus: probe.httpStatus,
        },
      });
    }
  }

  if (success && openIncident) {
    const resolvedAt = checkedAt;
    await prisma.uptimeIncident.update({
      where: { id: openIncident.id },
      data: { resolvedAt },
    });
    if (monitor.alertEmail && monitor.alertOnRecovery) {
      await notifyUptimeRecovered({
        userId: monitor.website.userId,
        websiteId: monitor.website.id,
        websiteName: monitor.website.name,
        url: monitor.url,
        startedAt: openIncident.startedAt,
        resolvedAt,
        latencyMs: probe.latencyMs,
      });
    }
  }

  // Slow alert when transitioning into degraded
  if (
    degraded &&
    monitor.alertEmail &&
    monitor.slowThresholdMs != null &&
    monitor.lastStatus !== "DEGRADED"
  ) {
    await notifyUptimeSlow({
      userId: monitor.website.userId,
      websiteId: monitor.website.id,
      websiteName: monitor.website.name,
      url: monitor.url,
      latencyMs: probe.latencyMs,
      thresholdMs: monitor.slowThresholdMs,
    });
  }

  await prisma.websiteMonitor.update({
    where: { id: monitor.id },
    data: {
      lastCheckedAt: checkedAt,
      nextCheckAt: nextCheckAt(monitor.intervalSeconds, checkedAt),
      lastStatus,
      lastLatencyMs: probe.latencyMs,
      lastHttpStatus: probe.httpStatus,
      lastError: probe.errorMessage,
      consecutiveFailures,
      consecutiveSuccesses,
      sslDaysRemaining,
      sslExpiresAt,
      sslAlertSentAt,
      lastSslCheckedAt: shouldCheckSsl ? checkedAt : monitor.lastSslCheckedAt,
    },
  });

  await recomputeMonitorStats(monitor.id);

  return { result, latencyMs: probe.latencyMs };
}

export async function processDueUptimeChecks(limit = 40): Promise<{
  processed: number;
  errors: number;
}> {
  const now = new Date();
  const due = await prisma.websiteMonitor.findMany({
    where: {
      enabled: true,
      paused: false,
      OR: [{ nextCheckAt: null }, { nextCheckAt: { lte: now } }],
      website: { deletedAt: null },
    },
    orderBy: { nextCheckAt: "asc" },
    take: limit,
    select: { id: true },
  });

  let processed = 0;
  let errors = 0;

  for (const row of due) {
    try {
      await runMonitorCheck(row.id);
      processed += 1;
    } catch (err) {
      errors += 1;
      console.error(`[uptime] check failed for monitor ${row.id}`, err);
      // Push next attempt out so a poison monitor doesn't block the batch forever
      try {
        await prisma.websiteMonitor.update({
          where: { id: row.id },
          data: { nextCheckAt: nextCheckAt(60), lastError: err instanceof Error ? err.message : "Check crashed" },
        });
      } catch {
        /* ignore */
      }
    }
  }

  return { processed, errors };
}

export async function pruneOldUptimeChecks(retentionDays = 90): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await prisma.uptimeCheck.deleteMany({
    where: { checkedAt: { lt: cutoff } },
  });
  return result.count;
}
