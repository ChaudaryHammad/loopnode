import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { WebsiteOverviewClient } from "@/components/websites/website-overview-client";
import { triggerScanAction } from "@/actions/scans";

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
    createdAt: website.createdAt,
  };

  const serializedScans = website.scans.map((s) => ({
    id: s.id,
    status: s.status,
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

  const handleScan = async () => {
    "use server";
    await triggerScanAction(id);
  };

  return (
    <WebsiteOverviewClient
      website={serializedWebsite}
      scans={serializedScans}
      onScanTrigger={handleScan}
    />
  );
}
