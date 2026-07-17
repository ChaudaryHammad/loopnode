"use client";

import React from "react";
import { Search } from "lucide-react";
import { AuditPageShell, AuditSection, type AuditIssue } from "./audit-shared";
import { LighthouseFindingsList } from "./lighthouse-findings-list";

interface SeoAuditClientProps {
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  score: number | null;
  issues: AuditIssue[];
  lastScanned: string | null;
  children?: React.ReactNode;
}

export function SeoAuditClient({
  websiteId,
  websiteName,
  websiteUrl,
  score,
  issues,
  lastScanned,
  children,
}: SeoAuditClientProps) {
  return (
    <AuditPageShell
      websiteId={websiteId}
      websiteName={websiteName}
      websiteUrl={websiteUrl}
      categoryLabel="SEO"
      score={score}
      icon={<Search className="w-5 h-5" />}
      accentClass="text-amber-400 bg-amber-500/10 border-amber-500/20"
      lastScanned={lastScanned}
    >
      {children}
      <AuditSection
        title="SEO findings"
        description="Lighthouse SEO audits plus LoopNode crawler checks from your latest scan"
      >
        <LighthouseFindingsList issues={issues} showMetricFilters={false} />
      </AuditSection>
    </AuditPageShell>
  );
}
