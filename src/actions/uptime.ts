"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/entitlements";
import { uptimeMonitorSchema } from "@/lib/validations/uptime";
import { DEFAULT_UPTIME_INTERVAL_SECONDS } from "@/lib/uptime/constants";
import { runMonitorCheck } from "@/lib/uptime/run-check";
import { KeywordMatchMode, MonitorHttpMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function requireOwnedWebsite(websiteId: string, userId: string) {
  return prisma.website.findFirst({
    where: { id: websiteId, userId, deletedAt: null },
    include: { monitor: true },
  });
}

export async function upsertMonitorAction(raw: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Unauthorized" };

  const parsed = uptimeMonitorSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid monitor settings",
    };
  }

  const data = parsed.data;
  const entitlements = await getEntitlements(session.user.id);
  if (!entitlements.canUseMonitoring) {
    return { success: false as const, error: "Monitoring is unavailable on your current plan status." };
  }
  if (data.intervalSeconds < entitlements.minUptimeIntervalSeconds) {
    return {
      success: false as const,
      error: `Your plan allows checks every ${entitlements.minUptimeIntervalSeconds / 60} minutes or slower.`,
    };
  }

  const website = await requireOwnedWebsite(data.websiteId, session.user.id);
  if (!website) return { success: false as const, error: "Website not found." };

  const now = new Date();
  const monitor = await prisma.websiteMonitor.upsert({
    where: { websiteId: website.id },
    create: {
      websiteId: website.id,
      enabled: data.enabled,
      paused: data.paused,
      url: data.url,
      method: data.method,
      expectedStatusMin: data.expectedStatusMin,
      expectedStatusMax: data.expectedStatusMax,
      intervalSeconds: data.intervalSeconds,
      timeoutMs: data.timeoutMs,
      followRedirects: data.followRedirects,
      keyword: data.keywordMode === KeywordMatchMode.NONE ? null : data.keyword ?? null,
      keywordMode: data.keywordMode,
      alertEmail: data.alertEmail,
      alertOnRecovery: data.alertOnRecovery,
      failureThreshold: data.failureThreshold,
      slowThresholdMs: data.slowThresholdMs ?? null,
      checkSsl: data.checkSsl,
      sslWarnDays: data.sslWarnDays,
      nextCheckAt: data.enabled && !data.paused ? now : null,
      lastStatus: data.paused ? "PAUSED" : data.enabled ? "UNKNOWN" : "PAUSED",
    },
    update: {
      enabled: data.enabled,
      paused: data.paused,
      url: data.url,
      method: data.method,
      expectedStatusMin: data.expectedStatusMin,
      expectedStatusMax: data.expectedStatusMax,
      intervalSeconds: data.intervalSeconds,
      timeoutMs: data.timeoutMs,
      followRedirects: data.followRedirects,
      keyword: data.keywordMode === KeywordMatchMode.NONE ? null : data.keyword ?? null,
      keywordMode: data.keywordMode,
      alertEmail: data.alertEmail,
      alertOnRecovery: data.alertOnRecovery,
      failureThreshold: data.failureThreshold,
      slowThresholdMs: data.slowThresholdMs ?? null,
      checkSsl: data.checkSsl,
      sslWarnDays: data.sslWarnDays,
      nextCheckAt:
        data.enabled && !data.paused
          ? website.monitor?.nextCheckAt && website.monitor.nextCheckAt > now
            ? website.monitor.nextCheckAt
            : now
          : null,
      lastStatus: data.paused
        ? "PAUSED"
        : data.enabled
          ? website.monitor?.lastStatus === "PAUSED"
            ? "UNKNOWN"
            : website.monitor?.lastStatus ?? "UNKNOWN"
          : "PAUSED",
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: website.monitor ? "UPTIME_MONITOR_UPDATED" : "UPTIME_MONITOR_CREATED",
      description: `${data.enabled ? "Enabled" : "Configured"} uptime monitor for "${website.name}"`,
      metadata: { websiteId: website.id, monitorId: monitor.id, intervalSeconds: data.intervalSeconds },
    },
  });

  revalidatePath("/dashboard/monitoring");
  revalidatePath(`/dashboard/websites/${website.id}`);
  revalidatePath(`/dashboard/websites/${website.id}/monitoring`);

  return { success: true as const, monitorId: monitor.id };
}

export async function pauseMonitorAction(websiteId: string, paused: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Unauthorized" };

  const website = await requireOwnedWebsite(websiteId, session.user.id);
  if (!website?.monitor) return { success: false as const, error: "Monitor not found." };

  await prisma.websiteMonitor.update({
    where: { id: website.monitor.id },
    data: {
      paused,
      lastStatus: paused ? "PAUSED" : website.monitor.enabled ? "UNKNOWN" : "PAUSED",
      nextCheckAt: paused || !website.monitor.enabled ? null : new Date(),
    },
  });

  revalidatePath("/dashboard/monitoring");
  revalidatePath(`/dashboard/websites/${websiteId}/monitoring`);
  return { success: true as const };
}

export async function disableMonitorAction(websiteId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Unauthorized" };

  const website = await requireOwnedWebsite(websiteId, session.user.id);
  if (!website?.monitor) return { success: false as const, error: "Monitor not found." };

  await prisma.websiteMonitor.update({
    where: { id: website.monitor.id },
    data: {
      enabled: false,
      paused: false,
      nextCheckAt: null,
      lastStatus: "PAUSED",
    },
  });

  revalidatePath("/dashboard/monitoring");
  revalidatePath(`/dashboard/websites/${websiteId}/monitoring`);
  return { success: true as const };
}

export async function runMonitorNowAction(websiteId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Unauthorized" };

  const entitlements = await getEntitlements(session.user.id);
  if (!entitlements.canUseMonitoring) {
    return { success: false as const, error: "Monitoring unavailable." };
  }

  const website = await requireOwnedWebsite(websiteId, session.user.id);
  if (!website) return { success: false as const, error: "Website not found." };

  let monitor = website.monitor;
  if (!monitor) {
    monitor = await prisma.websiteMonitor.create({
      data: {
        websiteId: website.id,
        enabled: true,
        url: website.url,
        method: MonitorHttpMethod.GET,
        intervalSeconds: Math.max(
          DEFAULT_UPTIME_INTERVAL_SECONDS,
          entitlements.minUptimeIntervalSeconds
        ),
        nextCheckAt: new Date(),
      },
    });
  }

  if (!monitor.enabled) {
    return {
      success: false as const,
      error: "Monitoring is disabled. Enable it in Settings to run a check.",
    };
  }

  if (monitor.paused) {
    return {
      success: false as const,
      error: "Monitoring is paused. Resume it first, then run a check.",
    };
  }

  try {
    const result = await runMonitorCheck(monitor.id);
    revalidatePath("/dashboard/monitoring");
    revalidatePath(`/dashboard/websites/${websiteId}/monitoring`);
    return { success: true as const, result: result.result, latencyMs: result.latencyMs };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Check failed",
    };
  }
}

export async function acknowledgeIncidentAction(incidentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const, error: "Unauthorized" };

  const incident = await prisma.uptimeIncident.findFirst({
    where: {
      id: incidentId,
      monitor: { website: { userId: session.user.id, deletedAt: null } },
    },
  });
  if (!incident) return { success: false as const, error: "Incident not found." };

  await prisma.uptimeIncident.update({
    where: { id: incident.id },
    data: { acknowledgedAt: new Date() },
  });

  revalidatePath("/dashboard/monitoring");
  return { success: true as const };
}
