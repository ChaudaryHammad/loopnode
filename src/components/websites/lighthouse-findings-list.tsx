"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Info, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import {
  SeverityIcon,
  severityBadgeClass,
  type AuditIssue,
  type IssueSeverity,
} from "@/components/websites/audit-shared";
import {
  formatSavingsBytes,
  formatSavingsMs,
  parsePerformanceIssueMetadata,
  sortPerformanceIssues,
} from "@/lib/audit/performance-issue-metadata";
import type { LighthouseMetricTag } from "@/lib/scanner/types";
import { formatNumber } from "@/lib/utils";

const SEVERITIES: Array<IssueSeverity | "ALL"> = ["ALL", "CRITICAL", "MAJOR", "MINOR", "INFO"];
const METRIC_FILTERS: Array<LighthouseMetricTag | "ALL"> = [
  "ALL",
  "FCP",
  "LCP",
  "TBT",
  "CLS",
  "INP",
];

function whyThisIsSlow(issue: AuditIssue) {
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  if (!metadata) return issue.description;

  const savings = [
    metadata.estimatedSavingsBytes
      ? `${formatSavingsBytes(metadata.estimatedSavingsBytes)} transferable waste`
      : null,
    metadata.estimatedSavingsMs
      ? `${formatSavingsMs(metadata.estimatedSavingsMs)} potential time savings`
      : null,
    metadata.displayValue ? `Current reading: ${metadata.displayValue}` : null,
  ].filter(Boolean);

  return [metadata.impact, savings.length > 0 ? savings.join(" · ") : null]
    .filter(Boolean)
    .join(" ");
}

function firstAction(issue: AuditIssue) {
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  return (
    metadata?.primaryAction ??
    issue.recommendation ??
    "Inspect the underlying resources and tackle the largest offender first."
  );
}

function groupLabel(issue: AuditIssue) {
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  if (metadata?.group === "insights") return "Insight";
  if (metadata?.group === "diagnostics") return "Diagnostic";
  if (metadata?.group === "metrics") return "Metric";
  switch (metadata?.kind) {
    case "image-delivery":
      return "Images";
    case "resource-waste":
      return "Payload";
    case "render-blocking":
      return "Render path";
    case "font":
      return "Fonts";
    case "layout":
      return "Layout";
    case "cache":
      return "Caching";
    case "network":
      return "Network";
    default:
      return "General";
  }
}

function sectionForIssue(issue: AuditIssue): "insights" | "diagnostics" | "other" {
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  if (metadata?.group === "insights") return "insights";
  if (metadata?.group === "diagnostics" || metadata?.group === "metrics") return "diagnostics";
  // Heuristic: opportunities with savings → insights
  if (
    (metadata?.estimatedSavingsMs ?? 0) > 0 ||
    (metadata?.estimatedSavingsBytes ?? 0) > 0
  ) {
    return "insights";
  }
  return "diagnostics";
}

function matchesMetricFilter(issue: AuditIssue, filter: LighthouseMetricTag | "ALL") {
  if (filter === "ALL") return true;
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  if (!metadata) return false;
  return metadata.metricTags.includes(filter);
}

function OffenderTable({ issue }: { issue: AuditIssue }) {
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  const offenders = metadata?.topOffenders ?? [];
  if (offenders.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/30">
      <div className="flex items-center justify-between gap-3 border-b border-border/30 bg-secondary/10 px-4 py-3">
        <p className="text-xs font-semibold text-foreground">Resource details</p>
        <span className="text-[11px] text-muted-foreground">
          {formatNumber(offenders.length)} shown
        </span>
      </div>
      <div className="divide-y divide-border/20">
        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.5fr)_minmax(0,0.5fr)] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>URL / Element</span>
          <span className="text-right">Size</span>
          <span className="text-right">Est savings</span>
        </div>
        {offenders.map((offender, index) => (
          <div key={`${offender.label}-${index}`} className="space-y-2 px-4 py-3">
            <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,0.5fr)_minmax(0,0.5fr)] gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {offender.url ? (
                    <a
                      href={offender.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={offender.url}
                      className="break-all text-sm font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {offender.url}
                    </a>
                  ) : (
                    <p className="break-all text-sm font-medium text-foreground">
                      {offender.label}
                    </p>
                  )}
                  {offender.party ? (
                    <Badge variant="outline" className="text-[10px]">
                      {offender.party === "1st" ? "1st Party" : "3rd Party"}
                    </Badge>
                  ) : null}
                </div>
                {offender.selector ? (
                  <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                    {offender.selector}
                  </p>
                ) : null}
                {offender.snippet && offender.snippet !== offender.selector ? (
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {offender.snippet}
                  </p>
                ) : null}
                {(offender.naturalWidth || offender.displayedWidth) && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {offender.naturalWidth && offender.naturalHeight
                      ? `Actual ${offender.naturalWidth}×${offender.naturalHeight}`
                      : null}
                    {offender.naturalWidth && offender.displayedWidth ? " · " : null}
                    {offender.displayedWidth && offender.displayedHeight
                      ? `Displayed ${offender.displayedWidth}×${offender.displayedHeight}`
                      : null}
                  </p>
                )}
              </div>
              <div className="text-right text-xs text-muted-foreground tabular-nums">
                {formatSavingsBytes(offender.transferSize ?? offender.totalBytes) ?? "—"}
              </div>
              <div className="text-right text-xs font-medium text-rose-400 tabular-nums">
                {formatSavingsBytes(offender.wastedBytes) ??
                  formatSavingsMs(offender.wastedMs) ??
                  "—"}
              </div>
            </div>
            {offender.subItems.length > 0 ? (
              <div className="ml-2 space-y-1 border-l border-border/30 pl-3">
                {offender.subItems.map((sub, subIndex) => (
                  <div
                    key={`${sub.label}-${subIndex}`}
                    className="flex items-start justify-between gap-3 text-[11px] text-muted-foreground"
                  >
                    <span className="min-w-0 flex-1">{sub.label}</span>
                    <span className="shrink-0 tabular-nums text-rose-400/90">
                      {formatSavingsBytes(sub.wastedBytes) ??
                        formatSavingsMs(sub.wastedMs) ??
                        ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function FindingCard({ issue }: { issue: AuditIssue }) {
  const [open, setOpen] = useState(false);
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  const summary = metadata?.summary ?? issue.title;
  const savingsLabel = [
    formatSavingsBytes(metadata?.estimatedSavingsBytes),
    formatSavingsMs(metadata?.estimatedSavingsMs),
  ]
    .filter(Boolean)
    .join(" / ");

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
            <p className="text-sm font-semibold leading-snug text-foreground">
              {issue.title}
              {savingsLabel ? (
                <span className="ml-2 font-medium text-rose-400">
                  Est savings of {savingsLabel}
                </span>
              ) : null}
            </p>
            <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
              {groupLabel(issue)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{whyThisIsSlow(issue)}</p>
          {metadata?.metricTags?.length ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {metadata.metricTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] border-border/30 text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
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
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/30 bg-secondary/10 p-4">
                <p className="text-xs font-semibold text-foreground">What is wrong</p>
                <CardDescription className="mt-2 text-sm leading-relaxed">
                  {issue.description}
                </CardDescription>
                {summary !== issue.title && summary !== issue.description ? (
                  <CardDescription className="mt-2 text-sm leading-relaxed">
                    {summary}
                  </CardDescription>
                ) : null}
              </div>

              <div className="rounded-2xl border border-border/30 bg-secondary/5 p-4">
                <p className="text-xs font-semibold text-foreground">What to do first</p>
                <CardDescription className="mt-2 text-sm leading-relaxed">
                  {firstAction(issue)}
                </CardDescription>
                {metadata?.learnMoreUrl ? (
                  <a
                    href={metadata.learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Learn more
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>

              {metadata?.criticalPathLatencyMs != null ? (
                <div className="rounded-2xl border border-border/30 bg-secondary/5 p-4">
                  <p className="text-xs font-semibold text-foreground">
                    Maximum critical path latency
                  </p>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-rose-400">
                    {formatSavingsMs(metadata.criticalPathLatencyMs)}
                  </p>
                </div>
              ) : null}

              <OffenderTable issue={issue} />
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/30 bg-secondary/5 p-4">
                <p className="text-xs font-semibold text-foreground">Impact summary</p>
                <div className="mt-3 space-y-2">
                  {metadata?.estimatedSavingsBytes != null ? (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Potential byte savings</span>
                      <span className="font-semibold text-foreground">
                        {formatSavingsBytes(metadata.estimatedSavingsBytes)}
                      </span>
                    </div>
                  ) : null}
                  {metadata?.estimatedSavingsMs != null ? (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Potential time savings</span>
                      <span className="font-semibold text-foreground">
                        {formatSavingsMs(metadata.estimatedSavingsMs)}
                      </span>
                    </div>
                  ) : null}
                  {metadata?.displayValue ? (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Current measurement</span>
                      <span className="font-semibold text-foreground">{metadata.displayValue}</span>
                    </div>
                  ) : null}
                  {!metadata?.estimatedSavingsBytes &&
                  !metadata?.estimatedSavingsMs &&
                  !metadata?.displayValue ? (
                    <p className="text-sm text-muted-foreground">
                      This finding does not expose measurable savings, but it still points to a
                      bottleneck worth reviewing.
                    </p>
                  ) : null}
                </div>
              </div>

              {(issue.selector || issue.url) && (
                <div className="rounded-2xl border border-border/30 bg-secondary/5 p-4 font-mono text-xs text-muted-foreground space-y-1">
                  {issue.selector ? <p>Selector: {issue.selector}</p> : null}
                  {issue.url ? <p className="break-all">URL: {issue.url}</p> : null}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function SectionBlock({
  title,
  description,
  issues,
}: {
  title: string;
  description: string;
  issues: AuditIssue[];
}) {
  if (issues.length === 0) return null;
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">
        {issues.map((issue) => (
          <FindingCard key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  );
}

export function LighthouseFindingsList({
  issues,
  emptyTitle = "No findings detected",
  emptyDescription = "Your latest run did not surface stored opportunities in this category.",
  showMetricFilters = true,
}: {
  issues: AuditIssue[];
  emptyTitle?: string;
  emptyDescription?: string;
  showMetricFilters?: boolean;
}) {
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | "ALL">("ALL");
  const [metricFilter, setMetricFilter] = useState<LighthouseMetricTag | "ALL">("ALL");
  const ordered = useMemo(() => sortPerformanceIssues(issues), [issues]);

  const filtered = useMemo(() => {
    return ordered.filter((issue) => {
      if (severityFilter !== "ALL" && issue.severity !== severityFilter) return false;
      if (!matchesMetricFilter(issue, metricFilter)) return false;
      return true;
    });
  }, [ordered, severityFilter, metricFilter]);

  const insights = filtered.filter((issue) => sectionForIssue(issue) === "insights");
  const diagnostics = filtered.filter((issue) => sectionForIssue(issue) === "diagnostics");
  const other = filtered.filter((issue) => sectionForIssue(issue) === "other");

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
          <CardTitle className="mb-1 text-base">{emptyTitle}</CardTitle>
          <CardDescription className="max-w-md">{emptyDescription}</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {SEVERITIES.map((severity) => {
          const count = severity === "ALL" ? issues.length : counts[severity];
          if (severity !== "ALL" && count === 0) return null;
          const isActive = severityFilter === severity;
          const icon =
            severity === "ALL" ? <Info className="h-3.5 w-3.5" /> : <SeverityIcon severity={severity} />;

          return (
            <Button
              key={severity}
              variant={isActive ? "secondary" : "outline"}
              size="sm"
              className={severity !== "ALL" && isActive ? severityBadgeClass(severity) : undefined}
              onClick={() => setSeverityFilter(severity)}
            >
              {icon}
              {severity === "ALL"
                ? `All (${count})`
                : `${severity.charAt(0) + severity.slice(1).toLowerCase()} (${count})`}
            </Button>
          );
        })}
      </div>

      {showMetricFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Show audits relevant to:</span>
          {METRIC_FILTERS.map((metric) => {
            const isActive = metricFilter === metric;
            return (
              <Button
                key={metric}
                variant={isActive ? "secondary" : "outline"}
                size="sm"
                onClick={() => setMetricFilter(metric)}
              >
                {metric === "ALL" ? "All" : metric}
              </Button>
            );
          })}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <CardTitle className="mb-1 text-base">No findings match this filter</CardTitle>
            <CardDescription className="max-w-md">
              Try another severity or Core Web Vital filter.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <SectionBlock
            title="Insights"
            description="High-impact opportunities with estimated savings, similar to Chrome Lighthouse."
            issues={insights}
          />
          <SectionBlock
            title="Diagnostics"
            description="More information about performance. These numbers do not always affect the score directly."
            issues={diagnostics}
          />
          <SectionBlock
            title="Additional findings"
            description="Other recorded issues from this audit category."
            issues={other}
          />
        </div>
      )}
    </div>
  );
}
