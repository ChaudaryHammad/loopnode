import React, { Suspense } from "react";
import { SeoAuditClient } from "@/components/websites/seo-audit-client";
import { SeoLiveSnapshot } from "@/components/websites/seo-live-snapshot";
import { SeoSnapshotSkeleton } from "@/components/layout/page-loaders";
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
  return generateAuditPageMetadata(id, "SEO");
}

export default async function SeoPage({ params }: Props) {
  const { id } = await params;
  const { website } = await getAuditPageWebsite(id);
  const latestScan = await getLatestCompletedScanWithIssues(id, "SEO");
  const issues = mapScanIssuesToAuditIssues(latestScan?.issues ?? []);

  return (
    <SeoAuditClient
      websiteId={website.id}
      websiteName={website.name}
      websiteUrl={website.url}
      score={latestScan?.seoScore ?? null}
      issues={issues}
      lastScanned={latestScan?.completedAt?.toISOString() ?? null}
    >
      <Suspense fallback={<SeoSnapshotSkeleton />}>
        <SeoLiveSnapshot url={website.url} />
      </Suspense>
    </SeoAuditClient>
  );
}
