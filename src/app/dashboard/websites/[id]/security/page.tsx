import React, { Suspense } from "react";
import { SecurityAuditClient } from "@/components/websites/security-audit-client";
import { SecurityLiveAudit } from "@/components/websites/security-live-audit";
import { SecurityHeadersSkeleton } from "@/components/layout/page-loaders";
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
  return generateAuditPageMetadata(id, "Security");
}

export default async function SecurityPage({ params }: Props) {
  const { id } = await params;
  const { website } = await getAuditPageWebsite(id);
  const latestScan = await getLatestCompletedScanWithIssues(id, "SECURITY");
  const issues = mapScanIssuesToAuditIssues(latestScan?.issues ?? []);

  return (
    <SecurityAuditClient
      websiteId={website.id}
      websiteName={website.name}
      websiteUrl={website.url}
      score={latestScan?.securityScore ?? null}
      issues={issues}
      lastScanned={latestScan?.completedAt?.toISOString() ?? null}
    >
      <Suspense fallback={<SecurityHeadersSkeleton />}>
        <SecurityLiveAudit url={website.url} />
      </Suspense>
    </SecurityAuditClient>
  );
}
