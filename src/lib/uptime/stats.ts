import { prisma } from "@/lib/prisma";
import type { UptimeCheckResult } from "@prisma/client";

export async function recomputeMonitorStats(monitorId: string) {
  const now = Date.now();
  const windows = [
    { key: "24h" as const, ms: 24 * 60 * 60 * 1000 },
    { key: "7d" as const, ms: 7 * 24 * 60 * 60 * 1000 },
    { key: "30d" as const, ms: 30 * 24 * 60 * 60 * 1000 },
  ];

  const oldest = new Date(now - windows[2].ms);
  const checks = await prisma.uptimeCheck.findMany({
    where: { monitorId, checkedAt: { gte: oldest } },
    select: { result: true, latencyMs: true, checkedAt: true },
    orderBy: { checkedAt: "desc" },
  });

  function pct(fromMs: number): number | null {
    const slice = checks.filter((c) => c.checkedAt.getTime() >= now - fromMs);
    if (slice.length === 0) return null;
    const up = slice.filter((c) => c.result === "UP" || c.result === "DEGRADED").length;
    return Math.round((up / slice.length) * 10000) / 100;
  }

  const last24h = checks.filter((c) => c.checkedAt.getTime() >= now - windows[0].ms);
  const latencies = last24h
    .map((c) => c.latencyMs)
    .filter((n): n is number => typeof n === "number");
  const avgLatency24h =
    latencies.length > 0
      ? Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 100) / 100
      : null;

  await prisma.websiteMonitor.update({
    where: { id: monitorId },
    data: {
      uptimePercent24h: pct(windows[0].ms),
      uptimePercent7d: pct(windows[1].ms),
      uptimePercent30d: pct(windows[2].ms),
      avgLatency24h,
    },
  });
}

export function isSuccessfulResult(result: UptimeCheckResult): boolean {
  return result === "UP" || result === "DEGRADED";
}
