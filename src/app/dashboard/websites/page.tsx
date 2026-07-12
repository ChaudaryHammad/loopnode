import React from "react";
import { auth } from "@/lib/auth";
import { getEntitlements } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { resolveWebsiteScanDisplay } from "@/lib/website-scan-display";
import { redirect } from "next/navigation";
import WebsitesClient from "./WebsitesClient";

export const metadata = {
  title: "Connected Websites",
};

export default async function WebsitesPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const [websites, entitlements] = await Promise.all([
    prisma.website.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
    },
    include: {
      scans: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          overallScore: true,
          performanceScore: true,
          accessibilityScore: true,
          seoScore: true,
          securityScore: true,
          phase: true,
          statusMessage: true,
          progressPercent: true,
          startedAt: true,
          createdAt: true,
        },
      },
      monitor: {
        select: {
          enabled: true,
          paused: true,
          lastStatus: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }),
    getEntitlements(session.user.id),
  ]);

  const serialized = websites.map((site) => {
    const scans = site.scans.map((scan) => ({
      id: scan.id,
      status: scan.status,
      overallScore: scan.overallScore,
      performanceScore: scan.performanceScore,
      accessibilityScore: scan.accessibilityScore,
      seoScore: scan.seoScore,
      securityScore: scan.securityScore,
      phase: scan.phase,
      statusMessage: scan.statusMessage,
      progressPercent: scan.progressPercent,
      startedAt: scan.startedAt,
      createdAt: scan.createdAt,
    }));

    const { latestScan, runningScan, displayScan } = resolveWebsiteScanDisplay(scans);

    return {
      id: site.id,
      name: site.name,
      url: site.url,
      scanFrequency: site.scanFrequency,
      scans,
      latestScan,
      runningScan,
      displayScan,
      monitorEnabled: site.monitor?.enabled ?? false,
      monitorStatus: site.monitor
        ? site.monitor.paused || !site.monitor.enabled
          ? "PAUSED"
          : site.monitor.lastStatus
        : null,
    };
  });

  return (
    <WebsitesClient
      initialWebsites={serialized}
      canScheduleScans={entitlements.canScheduleScans}
    />
  );
}
