"use client";

import React, { useMemo, useState } from "react";
import { type BrokenLinkScanMode } from "@prisma/client";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Globe,
  Home,
  Link2,
  Loader2,
  Play,
  Search,
  ShieldAlert,
  Square,
  Waypoints,
} from "lucide-react";
import { type GroupedBrokenLink } from "@/broken-links/group-results";
import { type LinkResourceType, LINK_RESOURCE_OPTIONS } from "@/lib/scanner/link-resource-types";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";
import { SeverityIcon, severityBadgeClass } from "@/components/websites/audit-shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type Severity = "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
export type SeverityFilter = Severity | "ALL";

interface SerializedScanLike {
  id: string;
  status: string;
  mode: BrokenLinkScanMode;
  resourceTypes: LinkResourceType[];
  phase: string | null;
  statusMessage: string | null;
  pagesDiscovered: number;
  pagesCrawled: number;
  linksFound: number;
  linksChecked: number;
  brokenCount: number;
  progressPercent: number;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface GroupedResultsPanelProps {
  groups: GroupedBrokenLink[];
  filteredGroups: GroupedBrokenLink[];
  occurrenceCount: number;
  linksChecked: number;
  severityFilter: SeverityFilter;
  severityCounts: Record<Severity, number>;
  resultSearch: string;
  onSearchChange: (value: string) => void;
  onSeverityChange: (value: SeverityFilter) => void;
  /** True while findings are still loading after a completed scan. */
  resultsLoading?: boolean;
  /** Denormalized scan count — used to avoid a false "all healthy" empty state. */
  expectedBrokenCount?: number;
}

interface SetupPanelProps {
  scanComplete: boolean;
  scanMode: BrokenLinkScanMode;
  selectedTypes: LinkResourceType[];
  isScanning: boolean;
  hasSitemapEstimate: boolean;
  sitemapApproxUrls: number | null;
  onModeChange: (mode: BrokenLinkScanMode) => void;
  onToggleResourceType: (type: LinkResourceType) => void;
  onSelectAll: () => void;
  onSelectPagesOnly: () => void;
  onStart: () => void;
  onClose: () => void;
  isStarting: boolean;
}

interface ProgressPanelProps {
  activeScan: SerializedScanLike;
  elapsedMs: number;
  linksTotal: number;
  checkRate: number | null;
  hasSitemapEstimate: boolean;
  sitemapApproxUrls: number | null;
  crawlCoverage: string | null;
  isHalting: boolean;
  onStop: () => void;
}

const SEVERITIES: Severity[] = ["CRITICAL", "MAJOR", "MINOR", "INFO"];

const BROKEN_LINK_STEPS = [
  { id: "crawl", label: "Crawl", description: "Discover pages in scope" },
  { id: "collect", label: "Collect", description: "Extract links and assets" },
  { id: "verify", label: "Verify", description: "Check responses and retries" },
  { id: "report", label: "Report", description: "Group results by unreachable URL" },
] as const;

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function phaseLabel(phase: string | null): string {
  const labels: Record<string, string> = {
    initializing: "Preparing",
    crawling: "Crawling pages",
    collecting: "Collecting links",
    checking: "Checking responses",
    completed: "Complete",
    failed: "Failed",
    cancelled: "Stopped",
  };
  return labels[phase ?? ""] ?? "Working";
}

function resolveStep(phase: string | null): (typeof BROKEN_LINK_STEPS)[number]["id"] {
  switch (phase) {
    case "initializing":
    case "crawling":
      return "crawl";
    case "collecting":
      return "collect";
    case "checking":
      return "verify";
    case "completed":
    case "failed":
    case "cancelled":
      return "report";
    default:
      return "crawl";
  }
}

function stepStatus(
  stepId: (typeof BROKEN_LINK_STEPS)[number]["id"],
  activeStep: (typeof BROKEN_LINK_STEPS)[number]["id"],
  percent: number
): "done" | "active" | "upcoming" {
  const order = BROKEN_LINK_STEPS.map((step) => step.id);
  const activeIndex = order.indexOf(activeStep);
  const index = order.indexOf(stepId);
  if (percent >= 100 || activeStep === "report" && index < activeIndex) {
    if (index < activeIndex || percent >= 100) return "done";
  }
  if (index < activeIndex) return "done";
  if (index === activeIndex) return "active";
  return "upcoming";
}

function resourceScopeDescription(mode: BrokenLinkScanMode): string {
  return mode === "INTERNAL"
    ? "Checks same-domain pages, assets, and internal destinations."
    : "Checks outbound destinations linked from your site.";
}

function progressScopeSummary(scan: SerializedScanLike): string {
  return scan.mode === "INTERNAL"
    ? "Scanning same-domain pages and selected asset types."
    : "Scanning outbound links found on your website.";
}

function CopyIconButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (
    event?: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
  ) => {
    event?.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            aria-label={`Copy ${label}`}
            className="shrink-0"
          />
        }
      >
        {copied ? <Check className="text-emerald-400" /> : <Copy />}
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied" : `Copy ${label}`}</TooltipContent>
    </Tooltip>
  );
}

function MetricCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  highlight?: "good" | "bad";
}) {
  return (
    <Card className="border-border/25 bg-card/70 shadow-none py-0">
      <CardContent className="px-4 py-3.5">
        <p className="text-[11px] text-muted-foreground mb-1.5 truncate">{label}</p>
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums leading-none tracking-tight",
            highlight === "good" && "text-emerald-400",
            highlight === "bad" && "text-rose-400",
            !highlight && "text-foreground"
          )}
        >
          {value}
        </p>
        {hint ? <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function SectionEmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-border/30">
      <CardContent className="flex flex-col items-center justify-center py-14 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-border/30 bg-secondary/25">
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="mt-1 max-w-md">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function BrokenLinkResultCard({ group }: { group: GroupedBrokenLink }) {
  const [open, setOpen] = useState(false);
  const primary = group.occurrences[0];
  const statusLabel = group.statusCode !== null ? `HTTP ${group.statusCode}` : "Unreachable";

  return (
    <Card className="border-border/30 py-0 gap-0 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
        className="w-full px-5 py-4 text-left transition-colors hover:bg-secondary/10"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            <SeverityIcon severity={group.severity as Severity} />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start gap-2">
              <p className="min-w-0 flex-1 break-all text-sm font-semibold leading-snug text-foreground">
                {group.href}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "tabular-nums font-mono text-[11px]",
                    group.statusCode === null || group.statusCode >= 400
                      ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                      : "border-border/30 bg-secondary/40 text-muted-foreground"
                  )}
                >
                  {statusLabel}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-[10px]", severityBadgeClass(group.severity as Severity))}
                >
                  {group.severity.charAt(0) + group.severity.slice(1).toLowerCase()}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                Unique unreachable URL grouped across{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {group.occurrences.length}
                </span>{" "}
                source page{group.occurrences.length === 1 ? "" : "s"}
              </span>
              {primary ? (
                <span className="truncate">
                  First seen on{" "}
                  <span className="font-medium text-foreground">{primary.sourcePageUrl}</span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 pl-2">
            <CopyIconButton text={group.href} label="URL" />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(event) => {
                event.stopPropagation();
                setOpen((value) => !value);
              }}
              aria-label={open ? "Collapse source pages" : "Expand source pages"}
            >
              {open ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </div>
      </div>

      {open ? (
        <CardContent className="border-t border-border/20 pt-4 pb-4">
          <div className="space-y-4">
            {group.errorMessage ? (
              <Alert className="border-amber-500/20 bg-amber-500/8 text-amber-100">
                <AlertDescription>{group.errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="rounded-xl border border-border/25 bg-secondary/10 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                What this row means
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This result groups every occurrence of the same unreachable destination into one row so
                you can fix one URL and review all affected source pages together.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Source pages
              </p>
              <ul className="space-y-2">
                {group.occurrences.map((occurrence) => (
                  <li
                    key={`${group.href}-${occurrence.sourcePageUrl}-${occurrence.selector ?? ""}`}
                    className="rounded-xl border border-border/25 px-3.5 py-3"
                  >
                    <a
                      href={occurrence.sourcePageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block break-all text-sm text-foreground hover:text-primary"
                    >
                      {occurrence.sourcePageUrl}
                    </a>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p className="font-mono break-all">
                        &lt;{occurrence.elementTag ?? "a"}&gt;
                        {occurrence.attribute ? ` [${occurrence.attribute}]` : ""}
                      </p>
                      {occurrence.selector ? (
                        <p className="font-mono break-all">{occurrence.selector}</p>
                      ) : null}
                      {occurrence.elementText ? (
                        <p className="break-all">&quot;{occurrence.elementText}&quot;</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function BrokenLinksPageShell({
  websiteId: _websiteId,
  websiteName: _websiteName,
  websiteUrl,
  lastScanned,
  scanComplete,
  activeMode,
  selectedTypeCount,
  actions,
}: {
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  lastScanned: string | null;
  scanComplete: boolean;
  activeMode: BrokenLinkScanMode;
  selectedTypeCount: number;
  actions?: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-border/30 bg-gradient-to-br from-card via-card to-secondary/10">
      <CardContent className="flex flex-col gap-5 p-6 md:p-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
              <Link2 className="size-5" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-xl md:text-2xl">Coverage</CardTitle>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Globe className="size-3.5" />
                {websiteUrl.replace(/^https?:\/\//, "")}
              </a>
              <CardDescription className="max-w-2xl">
                Find unreachable pages, missing assets, and outbound URL failures, then
                review every affected source page in one place.
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className="border-border/30 bg-card/50 text-foreground">
                  {activeMode === "INTERNAL" ? <Home className="size-3.5" /> : <ExternalLink className="size-3.5" />}
                  {activeMode === "INTERNAL" ? "Internal scan" : "External scan"}
                </Badge>
                <Badge variant="outline" className="border-border/30 bg-card/50 text-muted-foreground">
                  <Waypoints className="size-3.5" />
                  {selectedTypeCount} resource type{selectedTypeCount === 1 ? "" : "s"} selected
                </Badge>
                {lastScanned ? (
                  <Badge variant="outline" className="border-border/30 bg-card/50 text-muted-foreground">
                    Last checked {formatDateTime(lastScanned)}
                  </Badge>
                ) : null}
                {!scanComplete ? (
                  <Badge variant="outline" className="border-border/30 bg-card/50 text-muted-foreground">
                    No completed scan yet
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </CardContent>
    </Card>
  );
}

export function BrokenLinksMetricsGrid({
  brokenCount,
  occurrenceCount,
  linksChecked,
  pagesCrawled,
  crawlCoverage,
}: {
  brokenCount: number;
  occurrenceCount: number;
  linksChecked: number;
  pagesCrawled: number;
  crawlCoverage: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricCard
        label="Unreachable URLs"
        value={formatNumber(brokenCount)}
        highlight={brokenCount > 0 ? "bad" : "good"}
        hint="Grouped by destination"
      />
      <MetricCard
        label="Page occurrences"
        value={formatNumber(occurrenceCount)}
        hint={occurrenceCount > brokenCount ? "Same URL may appear on multiple pages" : "One occurrence per source page"}
      />
      <MetricCard label="Links checked" value={formatNumber(linksChecked)} />
      <MetricCard
        label="Pages crawled"
        value={formatNumber(pagesCrawled)}
        hint={crawlCoverage ?? "Full in-scope crawl"}
      />
    </div>
  );
}

export function BrokenLinksStatusAlerts({
  activeScan,
  hasResults,
}: {
  activeScan: SerializedScanLike | null;
  hasResults: boolean;
}) {
  return (
    <div className="space-y-3">
      {activeScan?.phase === "cancelled" ? (
        <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-100">
          <AlertDescription>
            Scan stopped early. Results below are partial and only include what was discovered
            before the scan was halted.
          </AlertDescription>
        </Alert>
      ) : null}

      {activeScan?.status === "FAILED" && activeScan.phase !== "cancelled" ? (
        <Alert
          className={cn(
            hasResults
              ? "border-amber-500/20 bg-amber-500/10 text-amber-100"
              : "border-destructive/30 bg-destructive/10 text-foreground"
          )}
        >
          <AlertDescription>
            {activeScan.errorMessage ?? "Scan failed. Try again."}
            {hasResults ? " Showing partial results captured before the failure." : ""}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

export function BrokenLinksProgressPanel({
  activeScan,
  elapsedMs,
  linksTotal,
  checkRate,
  hasSitemapEstimate,
  sitemapApproxUrls,
  crawlCoverage,
  isHalting,
  onStop,
}: ProgressPanelProps) {
  const activeStep = resolveStep(activeScan.phase);

  return (
    <Card className="rounded-2xl border-border/30 py-0">
      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-primary/20 bg-primary/10 text-primary"
              >
                <Loader2 className="size-3.5 animate-spin" />
                Live scan
              </Badge>
              <span className="text-xs tabular-nums text-muted-foreground">
                Elapsed {formatElapsed(elapsedMs)}
              </span>
            </div>
            <p className="text-base font-medium leading-snug text-foreground md:text-lg">
              {activeScan.statusMessage ?? "Running coverage scan…"}
            </p>
            <p className="text-xs text-muted-foreground">
              {phaseLabel(activeScan.phase)} · {progressScopeSummary(activeScan)}
              {hasSitemapEstimate && sitemapApproxUrls ? ` · Sitemap suggests ~${formatNumber(sitemapApproxUrls)} URLs` : ""}
            </p>
          </div>

          <div className="min-w-[5.5rem] shrink-0 rounded-xl border border-border/30 bg-secondary/15 px-4 py-3 text-right">
            <p className="text-3xl font-semibold leading-none tabular-nums text-foreground">
              {Math.round(activeScan.progressPercent)}
              <span className="text-lg text-muted-foreground">%</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">complete</p>
          </div>
        </div>

        <Progress value={Math.min(100, activeScan.progressPercent)} className="h-2.5" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard
            label="Pages crawled"
            value={formatNumber(activeScan.pagesCrawled)}
            hint={crawlCoverage ?? "Within current scan scope"}
          />
          <MetricCard label="Pages discovered" value={formatNumber(activeScan.pagesDiscovered)} />
          <MetricCard
            label="Links checked"
            value={`${formatNumber(activeScan.linksChecked)}/${formatNumber(linksTotal || activeScan.linksChecked)}`}
            hint="Verified responses so far"
          />
          <MetricCard label="Links found" value={formatNumber(activeScan.linksFound)} />
          <MetricCard
            label="Unreachable"
            value={formatNumber(activeScan.brokenCount)}
            highlight={activeScan.brokenCount > 0 ? "bad" : "good"}
          />
          <MetricCard
            label="Pace"
            value={checkRate != null ? `${checkRate}/s` : "—"}
            hint="Average checks per second"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {progressScopeSummary(activeScan)} This may be partial if the run is stopped or the
            server times out.
          </p>
          <Button variant="outline" size="sm" onClick={onStop} disabled={isHalting || activeScan.id === "pending"}>
            {isHalting ? <Loader2 className="animate-spin" /> : <Square className="fill-current" />}
            Stop scan
          </Button>
        </div>

        <ol className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {BROKEN_LINK_STEPS.map((step) => {
            const status = stepStatus(step.id, activeStep, activeScan.progressPercent);
            return (
              <li
                key={step.id}
                className={cn(
                  "rounded-xl border px-3 py-2.5 transition-colors",
                  status === "active" && "border-primary/35 bg-primary/8",
                  status === "done" && "border-border/40 bg-secondary/20",
                  status === "upcoming" && "border-border/25 bg-transparent opacity-70"
                )}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border text-[10px]",
                      status === "done" && "border-primary/40 bg-primary/15 text-primary",
                      status === "active" && "border-primary/50 bg-primary/20 text-primary",
                      status === "upcoming" && "border-border/40 text-muted-foreground"
                    )}
                  >
                    {status === "done" ? (
                      <Check className="size-3" strokeWidth={3} />
                    ) : status === "active" ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-muted-foreground/50" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      status === "active" ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                <p className="pl-7 text-[11px] leading-snug text-muted-foreground">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

export function BrokenLinksSetupPanel({
  scanComplete,
  scanMode,
  selectedTypes,
  isScanning,
  hasSitemapEstimate,
  sitemapApproxUrls,
  onModeChange,
  onToggleResourceType,
  onSelectAll,
  onSelectPagesOnly,
  onStart,
  onClose,
  isStarting,
}: SetupPanelProps) {
  const modeDetails = useMemo(
    () => ({
      INTERNAL: {
        title: "Internal coverage",
        description:
          "Crawls your website and checks same-domain pages plus any selected assets.",
        icon: <Home className="size-4" />,
      },
      EXTERNAL: {
        title: "Outbound coverage",
        description:
          "Checks external destinations linked from your pages without crawling third-party sites.",
        icon: <ExternalLink className="size-4" />,
      },
    }),
    []
  );

  return (
    <Card
      id="broken-links-setup-panel"
      tabIndex={-1}
      className="rounded-2xl border-border/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <CardHeader className="border-b border-border/20 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {scanComplete ? "Run another scan" : "Start a coverage scan"}
            </CardTitle>
            <CardDescription>
              Choose what to scan, confirm the scope, and run a fresh crawl against your latest
              pages.
            </CardDescription>
          </div>
          {scanComplete ? (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card className="border-border/25 bg-secondary/10 shadow-none">
            <CardContent className="space-y-3 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Globe className="size-4 text-primary" />
                Scan scope
              </div>
              <p className="text-sm text-muted-foreground">
                {resourceScopeDescription(scanMode)}
              </p>
              {hasSitemapEstimate && sitemapApproxUrls ? (
                <p className="text-xs text-muted-foreground">
                  Sitemap suggests about{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {formatNumber(sitemapApproxUrls)}
                  </span>{" "}
                  URLs. This is guidance only; the scan still follows live links.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No sitemap is required. Coverage is based on the crawl path discovered from your
                  live pages.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/25 bg-secondary/10 shadow-none">
            <CardContent className="space-y-3 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldAlert className="size-4 text-primary" />
                Accuracy notes
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>Unreachable destinations are grouped by URL so repeat occurrences stay aligned.</li>
                <li>Network failures and timeouts can appear as unreachable links.</li>
                <li>Stopped or failed runs may still show partial results.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Scan mode
          </p>
          <Tabs value={scanMode} onValueChange={(value) => onModeChange(value as BrokenLinkScanMode)}>
            <TabsList className="w-full justify-start" variant="default">
              <TabsTrigger value="INTERNAL" disabled={isScanning}>
                <Home className="size-3.5" />
                Internal
              </TabsTrigger>
              <TabsTrigger value="EXTERNAL" disabled={isScanning}>
                <ExternalLink className="size-3.5" />
                External
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Card className="border-border/25 bg-card/50 shadow-none">
            <CardContent className="flex items-start gap-3 px-4 py-4">
              <div className="mt-0.5 text-primary">{modeDetails[scanMode].icon}</div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{modeDetails[scanMode].title}</p>
                <p className="text-sm text-muted-foreground">{modeDetails[scanMode].description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Included resource types
            </p>
            <div className="flex gap-3 text-xs">
              <button
                type="button"
                className="text-primary hover:underline disabled:opacity-50"
                disabled={isScanning}
                onClick={onSelectAll}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                disabled={isScanning}
                onClick={onSelectPagesOnly}
              >
                Pages only
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {LINK_RESOURCE_OPTIONS.map((option) => {
              const active = selectedTypes.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  title={option.hint}
                  aria-pressed={active}
                  disabled={isScanning}
                  onClick={() => onToggleResourceType(option.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                    active
                      ? "border-primary/40 bg-primary text-primary-foreground"
                      : "border-border/40 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Ready to scan</p>
            <p className="text-xs text-muted-foreground">
              Results will list each unique unreachable URL together with every source page where it was
              found.
            </p>
          </div>
          <Button
            size="default"
            className="w-full gap-2 sm:w-auto min-w-[160px]"
            onClick={onStart}
            disabled={isScanning || selectedTypes.length === 0}
          >
            {isStarting ? <Loader2 className="animate-spin" /> : <Play className="size-4 fill-current" />}
            {isStarting ? "Starting…" : "Start scan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function BrokenLinksResultsPanel({
  groups,
  filteredGroups,
  occurrenceCount,
  linksChecked,
  severityFilter,
  severityCounts,
  resultSearch,
  onSearchChange,
  onSeverityChange,
  resultsLoading = false,
  expectedBrokenCount = 0,
}: GroupedResultsPanelProps) {
  const hasResults = groups.length > 0;
  const awaitingFindings =
    !hasResults && (resultsLoading || expectedBrokenCount > 0);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          {hasResults
            ? "Unreachable URLs found"
            : awaitingFindings
              ? "Loading unreachable URLs…"
              : "No unreachable URLs found"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {hasResults
            ? `${filteredGroups.length} shown${
                filteredGroups.length !== groups.length ? ` of ${groups.length}` : ""
              } grouped unreachable URL${groups.length === 1 ? "" : "s"} across ${formatNumber(
                occurrenceCount
              )} page occurrence${occurrenceCount === 1 ? "" : "s"}`
            : awaitingFindings
              ? expectedBrokenCount > 0
                ? `Found ${formatNumber(expectedBrokenCount)} unreachable URL${
                    expectedBrokenCount === 1 ? "" : "s"
                  }. Loading details…`
                : "Pulling findings from this scan…"
              : `Checked ${formatNumber(linksChecked)} URLs and every verified response came back healthy.`}
        </p>
      </div>

      {hasResults ? (
        <>
          <Card className="border-border/30">
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={resultSearch}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search URL, source page, or status code…"
                    className="h-10 bg-card pl-9"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={severityFilter === "ALL" ? "secondary" : "outline"}
                    size="sm"
                    className="h-10"
                    onClick={() => onSeverityChange("ALL")}
                  >
                    All ({groups.length})
                  </Button>
                  {SEVERITIES.map((severity) => {
                    const count = severityCounts[severity];
                    if (count === 0) return null;
                    return (
                      <Button
                        key={severity}
                        variant={severityFilter === severity ? "secondary" : "outline"}
                        size="sm"
                        className={cn(
                          "h-10",
                          severityFilter === severity && severityBadgeClass(severity)
                        )}
                        onClick={() =>
                          onSeverityChange(severityFilter === severity ? "ALL" : severity)
                        }
                      >
                        <SeverityIcon severity={severity} />
                        {severity.charAt(0) + severity.slice(1).toLowerCase()} ({count})
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-border/25 bg-secondary/10 px-4 py-3 text-xs text-muted-foreground">
                Each row below groups one unreachable destination URL. Expand a row to see every source
                page where that destination was found.
              </div>
            </CardContent>
          </Card>

          {filteredGroups.length === 0 ? (
            <SectionEmptyState
              icon={<Search className="size-5 text-muted-foreground" />}
              title="No links match the current filters"
              description="Try clearing the severity filter or broadening your search to see more results."
            />
          ) : (
            <TooltipProvider>
              <div className="space-y-3">
                {filteredGroups.map((group) => (
                  <BrokenLinkResultCard key={group.href} group={group} />
                ))}
              </div>
            </TooltipProvider>
          )}
        </>
      ) : awaitingFindings ? (
        <SectionEmptyState
          icon={<Loader2 className="size-5 animate-spin text-muted-foreground" />}
          title="Loading findings"
          description="Scan totals are ready — fetching the unreachable URL details now."
        />
      ) : (
        <SectionEmptyState
          icon={<Check className="size-5 text-emerald-400" />}
          title="No unreachable URLs"
          description="Everything we verified responded successfully in this scan."
        />
      )}
    </div>
  );
}

export function BrokenLinksActionButtons({
  showNewCheck,
  onNewCheck,
  canExportPdf,
  showReportUpgrade = false,
  pdfLoadingAction,
  onViewPdf,
  onDownloadPdf,
}: {
  showNewCheck: boolean;
  onNewCheck: () => void;
  canExportPdf: boolean;
  showReportUpgrade?: boolean;
  pdfLoadingAction: "view" | "download" | null;
  onViewPdf: () => void;
  onDownloadPdf: () => void;
}) {
  return (
    <TooltipProvider>
      {showNewCheck ? (
        <Button variant="outline" size="sm" onClick={onNewCheck}>
          Run another check
        </Button>
      ) : null}
      {canExportPdf ? (
        <>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewPdf}
                  disabled={pdfLoadingAction !== null}
                />
              }
            >
              {pdfLoadingAction === "view" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Eye className="size-3.5" />
              )}
              Open report
            </TooltipTrigger>
            <TooltipContent>Open the generated PDF report in a new tab.</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="sm"
                  onClick={onDownloadPdf}
                  disabled={pdfLoadingAction !== null}
                />
              }
            >
              {pdfLoadingAction === "download" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Download PDF
            </TooltipTrigger>
            <TooltipContent>Download the same report as a PDF file.</TooltipContent>
          </Tooltip>
        </>
      ) : showReportUpgrade ? (
        <ButtonLink href="/dashboard/settings/billing/upgrade" size="sm" variant="outline">
          Upgrade for PDF reports
        </ButtonLink>
      ) : null}
    </TooltipProvider>
  );
}
