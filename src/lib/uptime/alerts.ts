import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send-email";
import {
  renderUptimeDownEmail,
  renderUptimeRecoveredEmail,
  renderUptimeSslExpiringEmail,
  renderUptimeSlowEmail,
} from "@/lib/email/templates/uptime-emails";
import { env } from "@/lib/env";

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

async function getUserContact(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
}

export async function notifyUptimeDown(params: {
  userId: string;
  websiteId: string;
  websiteName: string;
  url: string;
  error: string;
  httpStatus: number | null;
  checkedAt: Date;
}) {
  const user = await getUserContact(params.userId);
  if (!user?.email) return;

  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/websites/${params.websiteId}/monitoring`;
  const email = renderUptimeDownEmail({
    name: user.name ?? "",
    websiteName: params.websiteName,
    url: params.url,
    error: params.error || "Unreachable",
    httpStatus: params.httpStatus != null ? String(params.httpStatus) : "n/a",
    checkedAt: params.checkedAt.toISOString(),
    dashboardUrl,
  });

  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: "UPTIME_DOWN",
      title: `${params.websiteName} is down`,
      body: params.error || "Monitor detected an outage.",
      href: `/dashboard/websites/${params.websiteId}/monitoring`,
      metadata: { websiteId: params.websiteId, url: params.url },
    },
  });

  try {
    await sendEmail({ to: user.email, subject: email.subject, html: email.html });
  } catch (err) {
    console.error("[uptime] failed to send down email", err);
  }
}

export async function notifyUptimeRecovered(params: {
  userId: string;
  websiteId: string;
  websiteName: string;
  url: string;
  startedAt: Date;
  resolvedAt: Date;
  latencyMs: number | null;
}) {
  const user = await getUserContact(params.userId);
  if (!user?.email) return;

  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/websites/${params.websiteId}/monitoring`;
  const email = renderUptimeRecoveredEmail({
    name: user.name ?? "",
    websiteName: params.websiteName,
    url: params.url,
    downtime: formatDuration(params.resolvedAt.getTime() - params.startedAt.getTime()),
    latencyMs: params.latencyMs != null ? `${params.latencyMs} ms` : "n/a",
    dashboardUrl,
  });

  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: "UPTIME_RECOVERED",
      title: `${params.websiteName} recovered`,
      body: `Back online after ${formatDuration(params.resolvedAt.getTime() - params.startedAt.getTime())}.`,
      href: `/dashboard/websites/${params.websiteId}/monitoring`,
      metadata: { websiteId: params.websiteId },
    },
  });

  try {
    await sendEmail({ to: user.email, subject: email.subject, html: email.html });
  } catch (err) {
    console.error("[uptime] failed to send recovery email", err);
  }
}

export async function notifySslExpiring(params: {
  userId: string;
  websiteId: string;
  websiteName: string;
  url: string;
  daysRemaining: number;
  expiresAt: Date;
}) {
  const user = await getUserContact(params.userId);
  if (!user?.email) return;

  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/websites/${params.websiteId}/monitoring`;
  const email = renderUptimeSslExpiringEmail({
    name: user.name ?? "",
    websiteName: params.websiteName,
    url: params.url,
    daysRemaining: params.daysRemaining,
    expiresAt: params.expiresAt.toISOString(),
    dashboardUrl,
  });

  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: "UPTIME_SSL_EXPIRING",
      title: `SSL expires in ${params.daysRemaining}d — ${params.websiteName}`,
      body: `Certificate for ${params.url} expires on ${params.expiresAt.toISOString()}.`,
      href: `/dashboard/websites/${params.websiteId}/monitoring`,
      metadata: { websiteId: params.websiteId, daysRemaining: params.daysRemaining },
    },
  });

  try {
    await sendEmail({ to: user.email, subject: email.subject, html: email.html });
  } catch (err) {
    console.error("[uptime] failed to send SSL email", err);
  }
}

export async function notifyUptimeSlow(params: {
  userId: string;
  websiteId: string;
  websiteName: string;
  url: string;
  latencyMs: number;
  thresholdMs: number;
}) {
  const user = await getUserContact(params.userId);
  if (!user?.email) return;

  const dashboardUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/websites/${params.websiteId}/monitoring`;
  const email = renderUptimeSlowEmail({
    name: user.name ?? "",
    websiteName: params.websiteName,
    url: params.url,
    latencyMs: params.latencyMs,
    thresholdMs: params.thresholdMs,
    dashboardUrl,
  });

  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: "UPTIME_SLOW",
      title: `Slow response — ${params.websiteName}`,
      body: `${params.latencyMs}ms (threshold ${params.thresholdMs}ms)`,
      href: `/dashboard/websites/${params.websiteId}/monitoring`,
      metadata: { websiteId: params.websiteId, latencyMs: params.latencyMs },
    },
  });

  try {
    await sendEmail({ to: user.email, subject: email.subject, html: email.html });
  } catch (err) {
    console.error("[uptime] failed to send slow email", err);
  }
}
