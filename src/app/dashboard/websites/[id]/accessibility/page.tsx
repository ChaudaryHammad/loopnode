import React from "react";
import { AccessibilityAuditClient } from "@/components/websites/accessibility-audit-client";
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
  return generateAuditPageMetadata(id, "Accessibility");
}

export default async function AccessibilityPage({ params }: Props) {
  const { id } = await params;
  const { website } = await getAuditPageWebsite(id);

  const latestScan = await getLatestCompletedScanWithIssues(id, "ACCESSIBILITY");
  const issues = mapScanIssuesToAuditIssues(latestScan?.issues ?? []);

  return (
    <AccessibilityAuditClient
      websiteId={website.id}
      websiteName={website.name}
      websiteUrl={website.url}
      score={latestScan?.accessibilityScore ?? null}
      issues={issues}
      lastScanned={latestScan?.completedAt?.toISOString() ?? null}
    />
  );
}
