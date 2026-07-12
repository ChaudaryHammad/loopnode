import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/entitlements";
import { notFound, redirect } from "next/navigation";
import {
  WebsiteMonitoringClient,
  type CheckRow,
  type IncidentRow,
  type MonitorDetail,
} from "@/components/monitoring/website-monitoring-client";

interface Props {
  params: Promise<{ id: string }>;
}

function mapCheck(c: {
  id: string;
  result: string;
  httpStatus: number | null;
  latencyMs: number | null;
  errorMessage: string | null;
  checkedAt: Date;
}): CheckRow {
  return {
    id: c.id,
    result: c.result,
    httpStatus: c.httpStatus,
    latencyMs: c.latencyMs,
    errorMessage: c.errorMessage,
    checkedAt: c.checkedAt.toISOString(),
  };
}

export default async function WebsiteMonitoringPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const [website, entitlements, user] = await Promise.all([
    prisma.website.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
      include: {
        monitor: {
          include: {
            checks: {
              orderBy: { checkedAt: "desc" },
              take: 60,
            },
            incidents: {
              orderBy: { startedAt: "desc" },
              take: 20,
            },
          },
        },
      },
    }),
    getEntitlements(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    }),
  ]);

  if (!website) notFound();

  const monitorId = website.monitor?.id ?? null;

  const [totalCheckCount, recentSuccessRows, recentFailureRows] = monitorId
    ? await Promise.all([
        prisma.uptimeCheck.count({ where: { monitorId } }),
        prisma.uptimeCheck.findMany({
          where: {
            monitorId,
            result: { in: ["UP", "DEGRADED"] },
          },
          orderBy: { checkedAt: "desc" },
          take: 5,
        }),
        prisma.uptimeCheck.findMany({
          where: {
            monitorId,
            result: { in: ["DOWN", "ERROR"] },
          },
          orderBy: { checkedAt: "desc" },
          take: 5,
        }),
      ])
    : [0, [], []];

  const monitor: MonitorDetail | null = website.monitor
    ? {
        id: website.monitor.id,
        enabled: website.monitor.enabled,
        paused: website.monitor.paused,
        url: website.monitor.url,
        method: website.monitor.method,
        expectedStatusMin: website.monitor.expectedStatusMin,
        expectedStatusMax: website.monitor.expectedStatusMax,
        intervalSeconds: website.monitor.intervalSeconds,
        timeoutMs: website.monitor.timeoutMs,
        followRedirects: website.monitor.followRedirects,
        keyword: website.monitor.keyword,
        keywordMode: website.monitor.keywordMode,
        alertEmail: website.monitor.alertEmail,
        alertOnRecovery: website.monitor.alertOnRecovery,
        failureThreshold: website.monitor.failureThreshold,
        slowThresholdMs: website.monitor.slowThresholdMs,
        checkSsl: website.monitor.checkSsl,
        sslWarnDays: website.monitor.sslWarnDays,
        lastStatus: website.monitor.lastStatus,
        lastLatencyMs: website.monitor.lastLatencyMs,
        lastHttpStatus: website.monitor.lastHttpStatus,
        lastError: website.monitor.lastError,
        lastCheckedAt: website.monitor.lastCheckedAt?.toISOString() ?? null,
        nextCheckAt: website.monitor.nextCheckAt?.toISOString() ?? null,
        uptimePercent24h: website.monitor.uptimePercent24h,
        uptimePercent7d: website.monitor.uptimePercent7d,
        uptimePercent30d: website.monitor.uptimePercent30d,
        avgLatency24h: website.monitor.avgLatency24h,
        sslDaysRemaining: website.monitor.sslDaysRemaining,
        sslExpiresAt: website.monitor.sslExpiresAt?.toISOString() ?? null,
        consecutiveFailures: website.monitor.consecutiveFailures,
      }
    : null;

  const checks: CheckRow[] = (website.monitor?.checks ?? []).map(mapCheck);
  const recentSuccesses: CheckRow[] = recentSuccessRows.map(mapCheck);
  const recentFailures: CheckRow[] = recentFailureRows.map(mapCheck);

  const incidents: IncidentRow[] = (website.monitor?.incidents ?? []).map((i) => ({
    id: i.id,
    kind: i.kind,
    startedAt: i.startedAt.toISOString(),
    resolvedAt: i.resolvedAt?.toISOString() ?? null,
    failCount: i.failCount,
    lastError: i.lastError,
    lastHttpStatus: i.lastHttpStatus,
  }));

  return (
    <WebsiteMonitoringClient
      website={{ id: website.id, name: website.name, url: website.url }}
      monitor={monitor}
      checks={checks}
      recentSuccesses={recentSuccesses}
      recentFailures={recentFailures}
      totalCheckCount={totalCheckCount}
      incidents={incidents}
      minIntervalSeconds={entitlements.minUptimeIntervalSeconds}
      canUseMonitoring={entitlements.canUseMonitoring}
      alertEmailTo={user?.email ?? session.user.email ?? null}
    />
  );
}
