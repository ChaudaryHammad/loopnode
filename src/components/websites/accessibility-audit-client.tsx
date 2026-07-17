"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Eye } from "lucide-react";
import {
  AuditPageShell,
  AuditSection,
  SeverityIcon,
  severityBadgeClass,
  type AuditIssue,
} from "./audit-shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { LighthouseFindingsList } from "./lighthouse-findings-list";

interface AccessibilityAuditClientProps {
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  score: number | null;
  issues: AuditIssue[];
  lastScanned: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function axeGroup(issue: AuditIssue): string {
  if (!isRecord(issue.metadata)) return "BEST PRACTICES";
  const group = issue.metadata.group;
  return typeof group === "string" && group.trim() ? group.toUpperCase() : "BEST PRACTICES";
}

function failingElements(issue: AuditIssue) {
  if (!isRecord(issue.metadata) || !Array.isArray(issue.metadata.failingElements)) {
    return [];
  }
  return issue.metadata.failingElements.filter(isRecord);
}

function AccessibilityIssueCard({ issue }: { issue: AuditIssue }) {
  const [open, setOpen] = useState(false);
  const elements = failingElements(issue);
  const learnMore =
    isRecord(issue.metadata) && typeof issue.metadata.learnMoreUrl === "string"
      ? issue.metadata.learnMoreUrl
      : null;

  return (
    <Card className="overflow-hidden border-border/30 py-0 gap-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-5 py-4 text-left cursor-pointer"
      >
        <SeverityIcon severity={issue.severity} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold leading-snug text-foreground">{issue.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{issue.description}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] ${severityBadgeClass(issue.severity)}`}>
          {issue.severity.charAt(0) + issue.severity.slice(1).toLowerCase()}
        </Badge>
        {open ? (
          <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <CardContent className="space-y-4 border-t border-border/20 pt-4">
          {issue.recommendation ? (
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p className="text-xs font-semibold text-primary">Recommendation</p>
              <CardDescription className="mt-2 text-sm">{issue.recommendation}</CardDescription>
              {learnMore ? (
                <a
                  href={learnMore}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Learn more
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ) : null}

          {elements.length > 0 ? (
            <div className="rounded-2xl border border-border/30 overflow-hidden">
              <div className="border-b border-border/30 bg-secondary/10 px-4 py-3">
                <p className="text-xs font-semibold text-foreground">Failing elements</p>
              </div>
              <div className="divide-y divide-border/20">
                {elements.map((el, index) => (
                  <div key={index} className="px-4 py-3 space-y-1">
                    <p className="font-mono text-xs text-foreground">
                      {typeof el.selector === "string" ? el.selector : issue.selector ?? "element"}
                    </p>
                    {typeof el.html === "string" ? (
                      <p className="line-clamp-2 font-mono text-[11px] text-muted-foreground">
                        {el.html}
                      </p>
                    ) : null}
                    {typeof el.failureSummary === "string" ? (
                      <p className="text-[11px] text-muted-foreground">{el.failureSummary}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : issue.selector ? (
            <p className="font-mono text-xs text-muted-foreground">Selector: {issue.selector}</p>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
}

export function AccessibilityAuditClient({
  websiteId,
  websiteName,
  websiteUrl,
  score,
  issues,
  lastScanned,
}: AccessibilityAuditClientProps) {
  const lhStyleIssues = useMemo(
    () =>
      issues.filter((issue) => {
        if (!isRecord(issue.metadata)) return false;
        return issue.metadata.source === "lighthouse";
      }),
    [issues]
  );

  const axeIssues = useMemo(
    () =>
      issues.filter((issue) => {
        if (!isRecord(issue.metadata)) return true;
        if (issue.metadata.source === "lighthouse") return false;
        return (
          issue.metadata.source === "axe" ||
          Boolean(issue.metadata.axeId) ||
          issue.metadata.source !== "lab-failed"
        );
      }),
    [issues]
  );

  const groupedAxe = useMemo(() => {
    const map = new Map<string, AuditIssue[]>();
    for (const issue of axeIssues) {
      const group = axeGroup(issue);
      const list = map.get(group) ?? [];
      list.push(issue);
      map.set(group, list);
    }
    return Array.from(map.entries());
  }, [axeIssues]);

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
      {lhStyleIssues.length > 0 ? (
        <AuditSection
          title="Lighthouse accessibility"
          description="Lab accessibility audits with the same structure as Chrome Lighthouse"
        >
          <LighthouseFindingsList
            issues={lhStyleIssues}
            showMetricFilters={false}
            emptyTitle="No Lighthouse accessibility findings"
          />
        </AuditSection>
      ) : null}

      {groupedAxe.map(([group, groupIssues]) => (
        <AuditSection
          key={group}
          title={group}
          description="Opportunities to improve semantics and assistive technology support."
        >
          <div className="space-y-3">
            {groupIssues.map((issue) => (
              <AccessibilityIssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </AuditSection>
      ))}

      {issues.length === 0 ? (
        <AuditSection title="Audit findings" description="No accessibility issues recorded.">
          <LighthouseFindingsList issues={[]} showMetricFilters={false} />
        </AuditSection>
      ) : null}
    </AuditPageShell>
  );
}
