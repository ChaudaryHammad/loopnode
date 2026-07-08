"use client";

import React, { useMemo } from "react";
import { Eye } from "lucide-react";
import { AuditPageShell, AuditSection, AuditFindingsSection, type AuditIssue } from "./audit-shared";

interface AccessibilityAuditClientProps {
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  score: number | null;
  issues: AuditIssue[];
  lastScanned: string | null;
}

export function AccessibilityAuditClient({
  websiteId,
  websiteName,
  websiteUrl,
  score,
  issues,
  lastScanned,
}: AccessibilityAuditClientProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; count: number; severity: AuditIssue["severity"] }>();
    for (const issue of issues) {
      const existing = map.get(issue.title);
      if (existing) {
        existing.count += 1;
        const order = { CRITICAL: 0, MAJOR: 1, MINOR: 2, INFO: 3 };
        if (order[issue.severity] < order[existing.severity]) {
          existing.severity = issue.severity;
        }
      } else {
        map.set(issue.title, { title: issue.title, count: 1, severity: issue.severity });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const order = { CRITICAL: 0, MAJOR: 1, MINOR: 2, INFO: 3 };
      return order[a.severity] - order[b.severity] || b.count - a.count;
    });
  }, [issues]);

  return (
    <AuditPageShell
      websiteId={websiteId}
      websiteName={websiteName}
      websiteUrl={websiteUrl}
      categoryLabel="Accessibility"
      score={score}
      icon={<Eye className="w-5 h-5" />}
      accentClass="text-violet-400 bg-violet-500/10 border-violet-500/20"
      lastScanned={lastScanned}
    >
      {grouped.length > 0 && (
        <AuditSection
          title="Rules affected"
          description="Most common accessibility rules failing on your site"
        >
          <div className="space-y-2">
            {grouped.slice(0, 8).map((rule) => (
              <div
                key={rule.title}
                className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/30 bg-secondary/5"
              >
                <p className="text-sm text-foreground font-medium truncate">{rule.title}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {rule.count} instance{rule.count !== 1 ? "s" : ""}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      rule.severity === "CRITICAL"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : rule.severity === "MAJOR"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-secondary/40 text-muted-foreground border-border/30"
                    }`}
                  >
                    {rule.severity.charAt(0) + rule.severity.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AuditSection>
      )}

      <AuditFindingsSection issues={issues} />
    </AuditPageShell>
  );
}
