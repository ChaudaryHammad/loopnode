"use client";

import React from "react";
import { Shield } from "lucide-react";
import { AuditPageShell, AuditFindingsSection, type AuditIssue } from "./audit-shared";

interface SecurityAuditClientProps {
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  score: number | null;
  issues: AuditIssue[];
  lastScanned: string | null;
  children?: React.ReactNode;
}

export function SecurityAuditClient({
  websiteId,
  websiteName,
  websiteUrl,
  score,
  issues,
  lastScanned,
  children,
}: SecurityAuditClientProps) {
  return (
    <AuditPageShell
      websiteId={websiteId}
      websiteName={websiteName}
      websiteUrl={websiteUrl}
      categoryLabel="Security"
      score={score}
      icon={<Shield className="w-5 h-5" />}
      accentClass="text-rose-400 bg-rose-500/10 border-rose-500/20"
      lastScanned={lastScanned}
    >
      {children}
      <AuditFindingsSection issues={issues} />
    </AuditPageShell>
  );
}
