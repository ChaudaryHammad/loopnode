"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Info, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SeverityIcon,
  severityBadgeClass,
  type AuditIssue,
  type IssueSeverity,
} from "@/components/websites/audit-shared";
import {
  parsePerformanceIssueMetadata,
  sortPerformanceIssues,
} from "@/lib/audit/performance-issue-metadata";
import { formatNumber } from "@/lib/utils";

const SEVERITIES: Array<IssueSeverity | "ALL"> = ["ALL", "CRITICAL", "MAJOR", "MINOR", "INFO"];

function formatBytes(value: number | null) {
  if (value === null) return null;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MiB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KiB`;
  return `${Math.round(value)} B`;
}

function formatMs(value: number | null) {
  if (value === null) return null;
  if (value >= 1000) return `${(value / 1000).toFixed(1)} s`;
  return `${Math.round(value)} ms`;
}

function whyThisIsSlow(issue: AuditIssue) {
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  if (!metadata) return issue.description;

  const savings = [
    metadata.estimatedSavingsBytes ? `${formatBytes(metadata.estimatedSavingsBytes)} transferable waste` : null,
    metadata.estimatedSavingsMs ? `${formatMs(metadata.estimatedSavingsMs)} potential time savings` : null,
    metadata.displayValue ? `Current reading: ${metadata.displayValue}` : null,
  ].filter(Boolean);

  return [metadata.impact, savings.length > 0 ? savings.join(" · ") : null]
    .filter(Boolean)
    .join(" ");
}

function firstAction(issue: AuditIssue) {
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  return metadata?.primaryAction ?? issue.recommendation ?? "Inspect the underlying resources and tackle the largest offender first.";
}

function groupLabel(issue: AuditIssue) {
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  switch (metadata?.kind) {
    case "image-delivery":
      return "Images";
    case "resource-waste":
      return "Payload";
    case "render-blocking":
      return "Render path";
    case "metric":
      return "Metrics";
    case "font":
      return "Fonts";
    case "layout":
      return "Layout";
    case "cache":
      return "Caching";
    default:
      return "General";
  }
}

function PerformanceFindingCard({ issue }: { issue: AuditIssue }) {
  const [open, setOpen] = useState(false);
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  const offenders = metadata?.topOffenders ?? [];
  const summary = metadata?.summary ?? issue.title;

  return (
    <Card className="overflow-hidden border-border/30 py-0 gap-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-3 px-5 py-4 text-left cursor-pointer"
      >
        <SeverityIcon severity={issue.severity} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold leading-snug text-foreground">{summary}</p>
            <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
              {groupLabel(issue)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{whyThisIsSlow(issue)}</p>
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
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/30 bg-secondary/10 p-4">
                <p className="text-xs font-semibold text-foreground">What is wrong</p>
                <CardDescription className="mt-2 text-sm leading-relaxed">
                  {issue.description}
                </CardDescription>
              </div>

              <div className="rounded-2xl border border-border/30 bg-secondary/5 p-4">
                <p className="text-xs font-semibold text-foreground">What to do first</p>
                <CardDescription className="mt-2 text-sm leading-relaxed">
                  {firstAction(issue)}
                </CardDescription>
              </div>

              {offenders.length > 0 ? (
                <div className="rounded-2xl border border-border/30 bg-secondary/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-foreground">Top offenders</p>
                    <span className="text-[11px] text-muted-foreground">
                      {formatNumber(offenders.length)} shown
                    </span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {offenders.map((offender, index) => (
                      <div
                        key={`${offender.label}-${index}`}
                        className="rounded-xl border border-border/20 bg-background/60 p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                            {offender.url ?? offender.label}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            {offender.wastedBytes !== null && (
                              <span>{formatBytes(offender.wastedBytes)} unused</span>
                            )}
                            {offender.wastedMs !== null && (
                              <span>{formatMs(offender.wastedMs)} delay</span>
                            )}
                          </div>
                        </div>
                        {offender.url && offender.url !== offender.label ? (
                          <p className="mt-1 truncate text-[11px] text-muted-foreground">
                            {offender.label}
                          </p>
                        ) : null}
                        {offender.snippet ? (
                          <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">
                            {offender.snippet}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/30 bg-secondary/5 p-4">
                <p className="text-xs font-semibold text-foreground">Impact summary</p>
                <div className="mt-3 space-y-2">
                  {metadata?.estimatedSavingsBytes !== null && metadata?.estimatedSavingsBytes !== undefined ? (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Potential byte savings</span>
                      <span className="font-semibold text-foreground">
                        {formatBytes(metadata.estimatedSavingsBytes)}
                      </span>
                    </div>
                  ) : null}
                  {metadata?.estimatedSavingsMs !== null && metadata?.estimatedSavingsMs !== undefined ? (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Potential time savings</span>
                      <span className="font-semibold text-foreground">
                        {formatMs(metadata.estimatedSavingsMs)}
                      </span>
                    </div>
                  ) : null}
                  {metadata?.displayValue ? (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Current measurement</span>
                      <span className="font-semibold text-foreground">{metadata.displayValue}</span>
                    </div>
                  ) : null}
                  {!metadata?.estimatedSavingsBytes && !metadata?.estimatedSavingsMs && !metadata?.displayValue ? (
                    <p className="text-sm text-muted-foreground">
                      This finding does not expose measurable savings, but it still points to a performance bottleneck worth reviewing.
                    </p>
                  ) : null}
                </div>
              </div>

              {metadata?.headings.length ? (
                <div className="rounded-2xl border border-border/30 bg-secondary/5 p-4">
                  <p className="text-xs font-semibold text-foreground">Signals captured</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {metadata.headings.slice(0, 6).map((heading) => (
                      <Badge key={heading} variant="outline" className="border-border/30 text-[10px] text-muted-foreground">
                        {heading}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function PerformanceFindingsList({ issues }: { issues: AuditIssue[] }) {
  const [filter, setFilter] = useState<IssueSeverity | "ALL">("ALL");
  const ordered = useMemo(() => sortPerformanceIssues(issues), [issues]);
  const filtered = filter === "ALL" ? ordered : ordered.filter((issue) => issue.severity === filter);
  const counts = {
    CRITICAL: issues.filter((issue) => issue.severity === "CRITICAL").length,
    MAJOR: issues.filter((issue) => issue.severity === "MAJOR").length,
    MINOR: issues.filter((issue) => issue.severity === "MINOR").length,
    INFO: issues.filter((issue) => issue.severity === "INFO").length,
  };

  if (issues.length === 0) {
    return (
      <Card className="border-border/30">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          <CardTitle className="mb-1 text-base">No performance findings detected</CardTitle>
          <CardDescription className="max-w-md">
            Your latest run did not surface any stored performance opportunities in this category.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SEVERITIES.map((severity) => {
          const count =
            severity === "ALL"
              ? issues.length
              : counts[severity];
          if (severity !== "ALL" && count === 0) return null;
          const isActive = filter === severity;
          const icon =
            severity === "ALL" ? <Info className="h-3.5 w-3.5" /> : <SeverityIcon severity={severity} />;

          return (
            <Button
              key={severity}
              variant={isActive ? "secondary" : "outline"}
              size="sm"
              className={severity !== "ALL" && isActive ? severityBadgeClass(severity) : undefined}
              onClick={() => setFilter(severity)}
            >
              {icon}
              {severity === "ALL"
                ? `All (${count})`
                : `${severity.charAt(0) + severity.slice(1).toLowerCase()} (${count})`}
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <CardTitle className="mb-1 text-base">No findings match this filter</CardTitle>
            <CardDescription className="max-w-md">
              Try another severity to see more performance findings from this audit.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <PerformanceFindingCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
