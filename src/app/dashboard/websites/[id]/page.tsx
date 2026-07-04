import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { WebsiteOverviewClient } from "@/components/websites/website-overview-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const website = await prisma.website.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: website?.name ? `${website.name} — Overview` : "Website Overview" };
}

export default async function WebsiteOverviewPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const website = await prisma.website.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    include: {
      scans: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          issues: {
            select: { id: true, severity: true, category: true },
          },
        },
      },
      brokenLinkScans: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!website) notFound();

  const latestScan = website.scans[0] ?? null;

  // Serialize
  const serializedWebsite = {
    id: website.id,
    name: website.name,
    url: website.url,
    scanFrequency: website.scanFrequency,
    scanTimezone: website.scanTimezone,
    nextScanAt: website.nextScanAt,
    createdAt: website.createdAt,
  };

  const serializedScans = website.scans.map((s) => ({
    id: s.id,
    status: s.status,
    phase: s.phase,
    statusMessage: s.statusMessage,
    progressPercent: s.progressPercent,
    startedAt: s.startedAt,
    overallScore: s.overallScore,
    performanceScore: s.performanceScore,
    accessibilityScore: s.accessibilityScore,
    seoScore: s.seoScore,
    securityScore: s.securityScore,
    fcp: s.fcp,
    lcp: s.lcp,
    cls: s.cls,
    inp: s.inp,
    tbt: s.tbt,
    completedAt: s.completedAt,
    createdAt: s.createdAt,
    issueCount: s.issues.length,
    criticalCount: s.issues.filter((i) => i.severity === "CRITICAL").length,
  }));

  const latestBrokenLinkScan = website.brokenLinkScans[0] ?? null;

  const serializedBrokenLinkScan = latestBrokenLinkScan
    ? {
        id: latestBrokenLinkScan.id,
        status: latestBrokenLinkScan.status,
        mode: latestBrokenLinkScan.mode,
        brokenCount: latestBrokenLinkScan.brokenCount,
        linksChecked: latestBrokenLinkScan.linksChecked,
        linksFound: latestBrokenLinkScan.linksFound,
        pagesCrawled: latestBrokenLinkScan.pagesCrawled,
        progressPercent: latestBrokenLinkScan.progressPercent,
        statusMessage: latestBrokenLinkScan.statusMessage,
        completedAt: latestBrokenLinkScan.completedAt,
        createdAt: latestBrokenLinkScan.createdAt,
      }
    : null;

  return (
    <WebsiteOverviewClient
      website={serializedWebsite}
      scans={serializedScans}
      latestBrokenLinkScan={serializedBrokenLinkScan}
    />
  );
}
