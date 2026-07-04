"use client";

import React from "react";
import Link from "next/link";
import {
  Globe,
  Zap,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Eye,
  Search,
  BarChart2,
  AlertTriangle,
  ChevronRight,
  Calendar,
  CalendarClock,
  ExternalLink,
  Unlink,
  Settings,
  History,
  TrendingUp,
  RefreshCw,
  Square,
} from "lucide-react";
import { ScoreGauge } from "./score-gauge";
import { ScoreChart } from "./score-chart";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Progress } from "@/components/ui/progress";
import {
  VITAL_DEFINITIONS,
  formatVitalValue,
  getVitalRating,
  vitalRatingClasses,
  vitalRatingLabel,
} from "@/lib/web-vitals";
import { formatNextScanAt } from "@/lib/scan-schedule";
import { useAuditScan } from "@/hooks/use-audit-scan";
import { AuditProgressPanel } from "@/components/websites/audit-progress-panel";
import { cn } from "@/lib/utils";

interface SerializedScan {
  id: string;
  status: string;
  phase?: string | null;
  statusMessage?: string | null;
  progressPercent?: number;
  startedAt?: Date | string | null;
  overallScore: number | null;
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  securityScore: number | null;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
  issueCount: number;
  criticalCount: number;
}

interface SerializedWebsite {
  id: string;
  name: string;
  url: string;
  scanFrequency: string;
  scanTimezone?: string;
  nextScanAt?: Date | string | null;
  createdAt: Date | string;
}

interface SerializedBrokenLinkScan {
  id: string;
  status: string;
  mode: string;
  brokenCount: number;
  linksChecked: number;
  linksFound: number;
  pagesCrawled: number;
  progressPercent: number;
  statusMessage: string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
}

interface WebsiteOverviewClientProps {
  website: SerializedWebsite;
  scans: SerializedScan[];
  latestBrokenLinkScan: SerializedBrokenLinkScan | null;
}

const SURFACE = "rounded-2xl border border-border/40 bg-card";

const AUDIT_PAGES = [
  {
    key: "performance",
    label: "Performance",
    icon: Zap,
    href: (id: string) => `/dashboard/websites/${id}/performance`,
    scoreKey: "performanceScore" as keyof SerializedScan,
  },
  {
    key: "accessibility",
    label: "Accessibility",
    icon: Eye,
    href: (id: string) => `/dashboard/websites/${id}/accessibility`,
    scoreKey: "accessibilityScore" as keyof SerializedScan,
  },
  {
    key: "seo",
    label: "SEO",
    icon: Search,
    href: (id: string) => `/dashboard/websites/${id}/seo`,
    scoreKey: "seoScore" as keyof SerializedScan,
  },
  {
    key: "security",
    label: "Security",
    icon: Shield,
    href: (id: string) => `/dashboard/websites/${id}/security`,
    scoreKey: "securityScore" as keyof SerializedScan,
  },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    COMPLETED: {
      label: "Completed",
      className: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    RUNNING: {
      label: "Running",
      className: "bg-primary/10 border-primary/25 text-primary",
      icon: <Zap className="w-3 h-3 animate-pulse" />,
    },
    FAILED: {
      label: "Failed",
      className: "bg-rose-500/10 border-rose-500/25 text-rose-400",
      icon: <XCircle className="w-3 h-3" />,
    },
    PENDING: {
      label: "Pending",
      className: "bg-amber-500/10 border-amber-500/25 text-amber-400",
      icon: <Clock className="w-3 h-3" />,
    },
  };
  const cfg = map[status] ?? map.PENDING;
  return (
    <Badge variant="outline" className={cn("text-[11px]", cfg.className)}>
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "good" | "bad";
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-secondary/10 px-4 py-3">
      <p
        className={cn(
          "text-xl font-bold tabular-nums leading-none",
          tone === "good" && "text-emerald-400",
          tone === "bad" && "text-rose-400",
          tone === "default" && "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1.5">{label}</p>
    </div>
  );
}

function VitalPill({
  vitalKey,
  abbr,
  value,
}: {
  vitalKey: string;
  abbr: string;
  value: number | null;
}) {
  const rating = getVitalRating(vitalKey, value);
  const styles = vitalRatingClasses(rating);

  return (
    <div className={cn("rounded-xl border px-3 py-2.5 bg-secondary/10", styles.border)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">{abbr}</span>
        <Badge variant="outline" className={cn("text-[10px] h-5", styles.badge)}>
          {vitalRatingLabel(rating)}
        </Badge>
      </div>
      <p className={cn("text-lg font-bold tabular-nums mt-1", styles.text)}>
        {formatVitalValue(vitalKey, value)}
      </p>
    </div>
  );
}

export function WebsiteOverviewClient({
  website,
  scans,
  latestBrokenLinkScan,
}: WebsiteOverviewClientProps) {
  const serverRunningScan = scans.find((scan) => scan.status === "RUNNING") ?? null;
  const latestCompleted = scans.find((scan) => scan.status === "COMPLETED") ?? null;
  const displayScan = latestCompleted;

  const initialProgress = serverRunningScan
    ? {
        phase: serverRunningScan.phase ?? "queued",
        statusMessage: serverRunningScan.statusMessage ?? "Audit in progress…",
        progressPercent: serverRunningScan.progressPercent ?? 2,
        startedAt: serverRunningScan.startedAt ?? serverRunningScan.createdAt,
      }
    : null;

  const { startScan, cancelScan, isRunning, isCancelling, error, progress } = useAuditScan({
    websiteId: website.id,
    initialRunningScanId: serverRunningScan?.id ?? null,
    initialProgress,
  });

  const host = website.url.replace(/^https?:\/\//, "").split("/")[0];
  const checkerHref = `/dashboard/websites/${website.id}/broken-links`;
  const settingsHref = `/dashboard/websites/${website.id}/settings`;
  const linkScanRunning = latestBrokenLinkScan?.status === "RUNNING";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/websites"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Websites
        </Link>
        <ButtonLink href={settingsHref} variant="outline" size="sm">
          <Settings className="w-4 h-4" />
          Settings
        </ButtonLink>
      </div>

      {/* Hero */}
      <section className={cn(SURFACE, "overflow-hidden")}>
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:justify-between">
            <div className="flex gap-4 min-w-0 flex-1">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl border border-border/40 bg-secondary/20 text-primary shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {website.name}
                  </h1>
                  <StatusBadge
                    status={isRunning ? "RUNNING" : displayScan?.status ?? "PENDING"}
                  />
                </div>
                <a
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {host}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isRunning ? (
                <>
                  <Button variant="default" size="lg" disabled className="gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Auditing…
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => void cancelScan()}
                    disabled={isCancelling}
                    className="gap-2"
                  >
                    {isCancelling ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Square className="w-4 h-4 fill-current" />
                    )}
                    Stop
                  </Button>
                </>
              ) : (
                <Button size="lg" onClick={() => void startScan()} className="gap-2">
                  <Zap className="w-4 h-4" />
                  Run full audit
                </Button>
              )}
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
            {displayScan?.completedAt ? (
              <Badge variant="secondary" className="gap-1.5 font-normal">
                <Calendar className="w-3 h-3" />
                Last audit {formatDate(displayScan.completedAt)}
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-normal">
                No completed audits yet
              </Badge>
            )}
            {displayScan && displayScan.criticalCount > 0 ? (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20">
                <AlertTriangle className="w-3 h-3" />
                {displayScan.criticalCount} critical
              </Badge>
            ) : null}
            {displayScan ? (
              <Badge variant="outline" className="font-normal">
                {displayScan.issueCount} issues
              </Badge>
            ) : null}
            <Badge variant="outline" className="capitalize font-normal">
              {website.scanFrequency.toLowerCase()} schedule
            </Badge>
            {website.nextScanAt ? (
              <Badge variant="outline" className="font-normal gap-1">
                <CalendarClock className="w-3 h-3" />
                Next{" "}
                {formatNextScanAt(new Date(website.nextScanAt), website.scanTimezone ?? "UTC")}
              </Badge>
            ) : null}
          </div>
        </div>

        {isRunning ? (
          <div className="border-t border-border/30 bg-secondary/5 px-6 md:px-8 py-6">
            <AuditProgressPanel progress={progress} embedded />
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          {!isRunning && displayScan ? (
            <section className={cn(SURFACE, "p-6 md:p-8 space-y-8")}>
              <SectionHeader
                title="Health overview"
                description="Scores and Core Web Vitals from your latest completed audit"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                <div className="col-span-2 sm:col-span-1 flex justify-center">
                  <ScoreGauge score={displayScan.overallScore} label="Overall" size="lg" />
                </div>
                <ScoreGauge score={displayScan.performanceScore} label="Performance" size="md" />
                <ScoreGauge score={displayScan.accessibilityScore} label="Accessibility" size="md" />
                <ScoreGauge score={displayScan.seoScore} label="SEO" size="md" />
                <ScoreGauge score={displayScan.securityScore} label="Security" size="md" />
              </div>

              <div className="pt-6 border-t border-border/30 space-y-4">
                <SectionHeader
                  title="Core Web Vitals"
                  description="Lighthouse lab metrics under mobile throttling"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {VITAL_DEFINITIONS.filter((v) => v.isCoreWebVital).map(({ key, abbr }) => (
                    <VitalPill
                      key={key}
                      vitalKey={key}
                      abbr={abbr}
                      value={displayScan[key as keyof SerializedScan] as number | null}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {VITAL_DEFINITIONS.filter((v) => !v.isCoreWebVital).map(({ key, abbr }) => (
                    <VitalPill
                      key={key}
                      vitalKey={key}
                      abbr={abbr}
                      value={displayScan[key as keyof SerializedScan] as number | null}
                    />
                  ))}
                </div>
              </div>
            </section>
          ) : !isRunning ? (
            <section className={cn(SURFACE, "p-10 text-center")}>
              <div className="w-14 h-14 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4">
                <BarChart2 className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">No audit data yet</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Run your first audit to see health scores, Core Web Vitals, and category reports.
              </p>
            </section>
          ) : displayScan ? (
            <section className={cn(SURFACE, "p-6 md:p-8")}>
              <SectionHeader
                title="Previous results"
                description="Your last completed audit — a new run is in progress above"
              />
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5 opacity-80">
                <ScoreGauge score={displayScan.overallScore} label="Overall" size="sm" />
                <ScoreGauge score={displayScan.performanceScore} label="Performance" size="sm" />
                <ScoreGauge score={displayScan.accessibilityScore} label="Accessibility" size="sm" />
                <ScoreGauge score={displayScan.seoScore} label="SEO" size="sm" />
                <ScoreGauge score={displayScan.securityScore} label="Security" size="sm" />
              </div>
            </section>
          ) : null}

          <section className={cn(SURFACE, "p-6 md:p-8")}>
            <SectionHeader
              title="Category reports"
              description="Drill into detailed findings for each audit area"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              {AUDIT_PAGES.map((page) => {
                const Icon = page.icon;
                const score =
                  page.scoreKey && displayScan
                    ? (displayScan[page.scoreKey] as number | null)
                    : null;
                return (
                  <Link
                    key={page.key}
                    href={page.href(website.id)}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-secondary/5 px-4 py-3.5 hover:bg-secondary/15 hover:border-border/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-card border border-border/30 text-muted-foreground group-hover:text-foreground transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{page.label}</p>
                        {score !== null ? (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            Score {score}/100
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">View findings</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                  </Link>
                );
              })}
            </div>
          </section>

          {scans.filter((s) => s.status === "COMPLETED").length > 1 ? (
            <section className={cn(SURFACE, "p-6 md:p-8")}>
              <SectionHeader
                title="Score trends"
                description="How your audit scores changed over recent runs"
                action={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
              />
              <div className="mt-6">
                <ScoreChart scans={scans} />
              </div>
            </section>
          ) : null}
        </div>

        <aside className="xl:col-span-4 space-y-6">
          <section className={cn(SURFACE, "p-5 md:p-6 space-y-5")}>
            <SectionHeader
              title="Broken links"
              description="Crawl internal or external links"
              action={
                <ButtonLink href={checkerHref} variant="ghost" size="sm" className="h-8 px-2">
                  Open
                  <ChevronRight className="w-4 h-4" />
                </ButtonLink>
              }
            />

            {linkScanRunning && latestBrokenLinkScan ? (
              <div className="space-y-3 rounded-xl border border-border/30 bg-secondary/10 p-4">
                <div className="flex items-center justify-between text-sm gap-3">
                  <span className="font-medium line-clamp-2">
                    {latestBrokenLinkScan.statusMessage ?? "Scan in progress…"}
                  </span>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    {Math.round(latestBrokenLinkScan.progressPercent)}%
                  </span>
                </div>
                <Progress value={latestBrokenLinkScan.progressPercent} className="h-2" />
              </div>
            ) : latestBrokenLinkScan ? (
              <div className="grid grid-cols-2 gap-3">
                <StatTile
                  label="Broken"
                  value={formatNumber(latestBrokenLinkScan.brokenCount)}
                  tone={latestBrokenLinkScan.brokenCount > 0 ? "bad" : "good"}
                />
                <StatTile
                  label="Checked"
                  value={formatNumber(latestBrokenLinkScan.linksChecked)}
                />
                <StatTile
                  label="Mode"
                  value={
                    <span className="capitalize text-base">
                      {latestBrokenLinkScan.mode.toLowerCase()}
                    </span>
                  }
                />
                <StatTile
                  label="Last run"
                  value={
                    <span className="text-sm font-semibold">
                      {latestBrokenLinkScan.completedAt
                        ? formatDate(latestBrokenLinkScan.completedAt)
                        : "—"}
                    </span>
                  }
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/40 bg-secondary/5 p-5 text-center">
                <Unlink className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-70" />
                <p className="text-xs text-muted-foreground">No link scans yet</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <Link
                href={checkerHref}
                className="flex items-center justify-center gap-2 rounded-xl border border-border/30 bg-secondary/5 px-3 py-2.5 text-sm font-medium hover:bg-secondary/15 transition-colors"
              >
                <Globe className="w-4 h-4 text-muted-foreground" />
                Internal crawl
              </Link>
              <Link
                href={checkerHref}
                className="flex items-center justify-center gap-2 rounded-xl border border-border/30 bg-secondary/5 px-3 py-2.5 text-sm font-medium hover:bg-secondary/15 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                External check
              </Link>
            </div>
          </section>

          <section className={cn(SURFACE, "p-5 md:p-6 space-y-4")}>
            <SectionHeader title="Schedule" description="Automated audit cadence" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Frequency</span>
                <span className="font-medium capitalize">{website.scanFrequency.toLowerCase()}</span>
              </div>
              {website.nextScanAt ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Next run</span>
                  <span className="font-medium text-right text-xs sm:text-sm">
                    {formatNextScanAt(new Date(website.nextScanAt), website.scanTimezone ?? "UTC")}
                  </span>
                </div>
              ) : null}
            </div>
            <ButtonLink href={settingsHref} variant="outline" size="sm" className="w-full">
              <CalendarClock className="w-4 h-4" />
              Edit schedule
            </ButtonLink>
          </section>

          {scans.length > 0 ? (
            <section className={cn(SURFACE, "overflow-hidden")}>
              <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Recent audits</h2>
              </div>
              <div className="divide-y divide-border/20">
                {scans.slice(0, 6).map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center gap-3 px-5 py-3.5 text-sm hover:bg-secondary/10 transition-colors"
                  >
                    <StatusBadge status={scan.status} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDateTime(scan.createdAt)}
                      </p>
                    </div>
                    {scan.overallScore !== null ? (
                      <span className="font-bold tabular-nums text-foreground shrink-0">
                        {scan.overallScore}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
