import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  MonitoringHubClient,
  type MonitorHubRow,
} from "@/components/monitoring/monitoring-hub-client";

export default async function MonitoringHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const websites = await prisma.website.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      url: true,
      monitor: {
        select: {
          enabled: true,
          paused: true,
          lastStatus: true,
          lastLatencyMs: true,
          lastCheckedAt: true,
          intervalSeconds: true,
          uptimePercent24h: true,
          uptimePercent7d: true,
          sslDaysRemaining: true,
          incidents: {
            where: { resolvedAt: null },
            select: { id: true },
          },
        },
      },
    },
  });

  const rows: MonitorHubRow[] = websites.map((w) => ({
    websiteId: w.id,
    websiteName: w.name,
    websiteUrl: w.url,
    enabled: w.monitor?.enabled ?? false,
    paused: w.monitor?.paused ?? false,
    lastStatus: w.monitor
      ? w.monitor.paused || !w.monitor.enabled
        ? "PAUSED"
        : w.monitor.lastStatus
      : "UNKNOWN",
    lastLatencyMs: w.monitor?.lastLatencyMs ?? null,
    lastCheckedAt: w.monitor?.lastCheckedAt?.toISOString() ?? null,
    intervalSeconds: w.monitor?.intervalSeconds ?? 900,
    uptimePercent24h: w.monitor?.uptimePercent24h ?? null,
    uptimePercent7d: w.monitor?.uptimePercent7d ?? null,
    openIncidents: w.monitor?.incidents.length ?? 0,
    sslDaysRemaining: w.monitor?.sslDaysRemaining ?? null,
  }));

  const summary = {
    up: rows.filter((r) => r.enabled && !r.paused && r.lastStatus === "UP").length,
    down: rows.filter((r) => r.enabled && !r.paused && r.lastStatus === "DOWN").length,
    degraded: rows.filter((r) => r.enabled && !r.paused && r.lastStatus === "DEGRADED").length,
    paused: rows.filter((r) => r.enabled && (r.paused || r.lastStatus === "PAUSED")).length,
    unmonitored: rows.filter((r) => !r.enabled).length,
  };

  return <MonitoringHubClient rows={rows} summary={summary} />;
}
