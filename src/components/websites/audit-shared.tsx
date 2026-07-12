"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Globe,
  Filter,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { ScoreGauge } from "./score-gauge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type IssueSeverity = "CRITICAL" | "MAJOR" | "MINOR" | "INFO";

export interface AuditIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  selector?: string | null;
  url?: string | null;
  recommendation?: string | null;
  metadata?: unknown;
}

export function getScoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}

export function SeverityIcon({ severity }: { severity: IssueSeverity }) {
  const map = {
    CRITICAL: <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />,
    MAJOR: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    MINOR: <Info className="w-3.5 h-3.5 text-blue-400" />,
    INFO: <Info className="w-3.5 h-3.5 text-muted-foreground" />,
  };
  return map[severity];
}

export function severityBadgeClass(severity: IssueSeverity): string {
  const map = {
    CRITICAL: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    MAJOR: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    MINOR: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    INFO: "bg-secondary/40 border-border/30 text-muted-foreground",
  };
  return map[severity];
}

function IssueCard({ issue }: { issue: AuditIssue }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-border/30 overflow-hidden py-0 gap-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer"
      >
        <SeverityIcon severity={issue.severity} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">{issue.title}</p>
          {issue.selector && (
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
              {issue.selector}
            </p>
          )}
          {issue.url && (
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
              {issue.url}
            </p>
          )}
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] ${severityBadgeClass(issue.severity)}`}>
          {issue.severity.charAt(0) + issue.severity.slice(1).toLowerCase()}
        </Badge>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <CardContent className="space-y-3 border-t border-border/20 pt-4">
          <CardDescription className="text-sm leading-relaxed">{issue.description}</CardDescription>
          {issue.recommendation && (
            <Card className="bg-primary/5 border-primary/15 shadow-none">
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-primary mb-1">Recommendation</p>
                <CardDescription className="text-xs leading-relaxed">
                  {issue.recommendation}
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </CardContent>
      )}
    </Card>
  );
}

const SEVERITIES: IssueSeverity[] = ["CRITICAL", "MAJOR", "MINOR", "INFO"];

interface AuditIssueListProps {
  issues: AuditIssue[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function AuditIssueList({
  issues,
  emptyTitle = "No issues detected",
  emptyDescription,
}: AuditIssueListProps) {
  const [filter, setFilter] = useState<IssueSeverity | "ALL">("ALL");
  const filtered = filter === "ALL" ? issues : issues.filter((i) => i.severity === filter);

  const counts = {
    CRITICAL: issues.filter((i) => i.severity === "CRITICAL").length,
    MAJOR: issues.filter((i) => i.severity === "MAJOR").length,
    MINOR: issues.filter((i) => i.severity === "MINOR").length,
    INFO: issues.filter((i) => i.severity === "INFO").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "ALL" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setFilter("ALL")}
        >
          <Filter />
          All ({issues.length})
        </Button>
        {SEVERITIES.map((sev) => {
          const count = counts[sev];
          if (count === 0) return null;
          return (
            <Button
              key={sev}
              variant={filter === sev ? "secondary" : "outline"}
              size="sm"
              className={filter === sev ? severityBadgeClass(sev) : undefined}
              onClick={() => setFilter(sev)}
            >
              <SeverityIcon severity={sev} />
              {sev.charAt(0) + sev.slice(1).toLowerCase()} ({count})
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-xl">
              ✓
            </div>
            <CardTitle className="text-base mb-1">{emptyTitle}</CardTitle>
            <CardDescription className="max-w-xs">
              {emptyDescription ??
                (issues.length === 0
                  ? "Run an audit to check this category."
                  : "No issues match the current filter.")}
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}

interface AuditPageShellProps {
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  categoryLabel: string;
  score: number | null;
  icon: React.ReactNode;
  accentClass: string;
  lastScanned: string | null;
  children: React.ReactNode;
}

export function AuditPageShell({
  websiteId,
  websiteName: _websiteName,
  websiteUrl,
  categoryLabel,
  score,
  icon,
  accentClass,
  lastScanned,
  children,
}: AuditPageShellProps) {
  useEffect(() => {
    const main = document.querySelector("main");
    if (main instanceof HTMLElement) {
      main.scrollTo({ top: 0, left: 0, behavior: "auto" });
      main.focus({ preventScroll: true });
    }
  }, []);

  const normalizedUrl = websiteUrl.replace(/^https?:\/\//, "");

  return (
    <div className="space-y-8">
      <Card className="rounded-[28px] border-border/30 bg-card/95 shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
            <div className="min-w-0 space-y-5">
              <div className="flex items-start gap-4">
                <div
                  className={`mt-0.5 flex h-14 w-14 items-center justify-center rounded-2xl border shrink-0 ${accentClass}`}
                >
                  {icon}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <CardTitle className="text-2xl font-semibold tracking-tight md:text-[2rem]">
                    {categoryLabel} audit
                  </CardTitle>
                  <CardDescription className="text-sm md:text-[15px]">
                    Focused detail view for your latest {categoryLabel.toLowerCase()} scan.
                  </CardDescription>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-border/30 bg-secondary/10 px-4 py-3 transition-colors hover:border-border/50 hover:bg-secondary/20"
                >
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-foreground">
                    {normalizedUrl}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Open live site</p>
                </a>

                <div className="rounded-2xl border border-border/30 bg-secondary/10 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Last audit
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {lastScanned ? formatDateTime(lastScanned) : "Not available yet"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lastScanned
                      ? "Based on the most recent completed scan"
                      : "Run a scan to populate this page"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/30 bg-secondary/10 px-4 py-3 sm:col-span-2 xl:col-span-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Category
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">{categoryLabel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Live evidence and recorded findings
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[24px] border border-border/30 bg-secondary/10 p-4">
              <div className="flex items-center justify-center rounded-2xl border border-border/20 bg-card/80 py-4">
                <ScoreGauge score={score} label="Audit score" size="md" />
              </div>

              <ButtonLink
                href={`/dashboard/websites/${websiteId}`}
                variant="outline"
                size="sm"
                className="w-full justify-center"
              >
                <ArrowLeft />
                Back to overview
              </ButtonLink>
            </div>
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  );
}

export function AuditSection({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-border/30">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export const AUDIT_FINDINGS_TITLE = "Audit findings";
export const AUDIT_FINDINGS_DESCRIPTION =
  "Issues recorded during your most recent audit in this category";

export function AuditFindingsSection({ issues }: { issues: AuditIssue[] }) {
  return (
    <AuditSection title={AUDIT_FINDINGS_TITLE} description={AUDIT_FINDINGS_DESCRIPTION}>
      <AuditIssueList issues={issues} />
    </AuditSection>
  );
}
