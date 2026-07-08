import React from "react";
import { PerformanceAuditClient } from "@/components/websites/performance-audit-client";
import {
  generateAuditPageMetadata,
  getAuditPageWebsite,
  getLatestCompletedScanWithIssues,
  mapScanIssuesToAuditIssues,
} from "@/lib/audit/get-audit-page-data";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return generateAuditPageMetadata(id, "Performance");
}

export default async function PerformancePage({ params }: Props) {
  const { id } = await params;
  const { website } = await getAuditPageWebsite(id);

  const latestScan = await getLatestCompletedScanWithIssues(id, "PERFORMANCE");
  const issues = mapScanIssuesToAuditIssues(latestScan?.issues ?? []);

  const metrics = latestScan
    ? {
        fcp: latestScan.fcp,
        lcp: latestScan.lcp,
        cls: latestScan.cls,
        inp: latestScan.inp,
        tbt: latestScan.tbt,
      }
    : null;

  return (
    <PerformanceAuditClient
      websiteId={website.id}
      websiteName={website.name}
      websiteUrl={website.url}
      score={latestScan?.performanceScore ?? null}
      issues={issues}
      lastScanned={latestScan?.completedAt?.toISOString() ?? null}
      metrics={metrics}
    />
  );
}
