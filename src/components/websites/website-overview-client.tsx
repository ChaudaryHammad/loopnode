"use client";

import React, { useTransition, useState } from "react";
import Link from "next/link";
import {
  Globe, Zap, RefreshCw, ArrowLeft, CheckCircle, XCircle,
  Clock, Shield, Eye, Search, LinkIcon, BarChart2, AlertTriangle,
  ChevronRight, Calendar,
} from "lucide-react";
import { ScoreGauge } from "./score-gauge";
import { ScoreChart } from "./score-chart";

interface SerializedScan {
  id: string;
  status: string;
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
  createdAt: Date | string;
}

interface WebsiteOverviewClientProps {
  website: SerializedWebsite;
  scans: SerializedScan[];
  onScanTrigger: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    COMPLETED: {
      label: "Completed",
      className: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    RUNNING: {
      label: "Running",
      className: "bg-blue-500/10 border-blue-500/25 text-blue-400",
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
  const cfg = map[status] ?? map["PENDING"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${cfg.className}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function formatVital(val: number | null, unit: string) {
  if (val === null) return "—";
  if (unit === "ms") return `${val.toLocaleString()} ms`;
  if (unit === "s") return `${(val / 1000).toFixed(2)} s`;
  if (unit === "") return val.toFixed(3);
  return String(val);
}

function vitalColor(key: string, val: number | null): string {
  if (val === null) return "text-muted-foreground";
  const thresholds: Record<string, [number, number]> = {
    fcp: [1800, 3000],
    lcp: [2500, 4000],
    cls: [0.1, 0.25],
    inp: [200, 500],
    tbt: [200, 600],
  };
  const [good, poor] = thresholds[key] ?? [50, 80];
  if (val <= good) return "text-emerald-400";
  if (val <= poor) return "text-amber-400";
  return "text-rose-400";
}

const AUDIT_PAGES = [
  {
    key: "performance",
    label: "Performance",
    icon: <Zap className="w-4 h-4" />,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    href: (id: string) => `/dashboard/websites/${id}/performance`,
    scoreKey: "performanceScore" as keyof SerializedScan,
  },
  {
    key: "accessibility",
    label: "Accessibility",
    icon: <Eye className="w-4 h-4" />,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    href: (id: string) => `/dashboard/websites/${id}/accessibility`,
    scoreKey: "accessibilityScore" as keyof SerializedScan,
  },
  {
    key: "seo",
    label: "SEO",
    icon: <Search className="w-4 h-4" />,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    href: (id: string) => `/dashboard/websites/${id}/seo`,
    scoreKey: "seoScore" as keyof SerializedScan,
  },
  {
    key: "security",
    label: "Security",
    icon: <Shield className="w-4 h-4" />,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    href: (id: string) => `/dashboard/websites/${id}/security`,
    scoreKey: "securityScore" as keyof SerializedScan,
  },
  {
    key: "broken-links",
    label: "Broken Links",
    icon: <LinkIcon className="w-4 h-4" />,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    href: (id: string) => `/dashboard/websites/${id}/broken-links`,
    scoreKey: null,
  },
];

export function WebsiteOverviewClient({
  website,
  scans,
  onScanTrigger,
}: WebsiteOverviewClientProps) {
  const [isPending, startTransition] = useTransition();
  const latestScan = scans[0] ?? null;

  const handleScan = () => {
    startTransition(() => onScanTrigger());
  };

  const vitals: Array<{ key: string; label: string; unit: string }> = [
    { key: "fcp", label: "FCP", unit: "ms" },
    { key: "lcp", label: "LCP", unit: "ms" },
    { key: "cls", label: "CLS", unit: "" },
    { key: "inp", label: "INP", unit: "ms" },
    { key: "tbt", label: "TBT", unit: "ms" },
  ];

  return (
    <div className="space-y-8 select-none">
      {/* Breadcrumb + header */}
      <div className="border-b border-border/20 pb-6 space-y-4">
        <Link
          href="/dashboard/websites"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Connected Websites
        </Link>

        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {website.name}
              </h1>
              {latestScan && <StatusBadge status={latestScan.status} />}
            </div>
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {website.url.replace(/^https?:\/\//, "")}
            </a>
          </div>

          <button
            id="trigger-scan-btn"
            onClick={handleScan}
            disabled={isPending || latestScan?.status === "RUNNING"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Scanning…" : latestScan?.status === "RUNNING" ? "Scanning…" : "Run Audit"}
          </button>
        </div>
      </div>

      {/* Score gauges */}
      <div className="bg-card border border-border/30 rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-foreground">Health Scores</h2>
          {latestScan?.completedAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              Last scan: {new Date(latestScan.completedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {latestScan ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 place-items-center">
            <ScoreGauge score={latestScan.overallScore} label="Overall" size="lg" />
            <ScoreGauge score={latestScan.performanceScore} label="Performance" size="md" />
            <ScoreGauge score={latestScan.accessibilityScore} label="Accessibility" size="md" />
            <ScoreGauge score={latestScan.seoScore} label="SEO" size="md" />
            <ScoreGauge score={latestScan.securityScore} label="Security" size="md" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-secondary/40 flex items-center justify-center mb-4">
              <BarChart2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No scans yet. Run your first audit to see health scores.
            </p>
          </div>
        )}
      </div>

      {/* Core Web Vitals */}
      {latestScan && (
        <div className="bg-card border border-border/30 rounded-2xl p-6">
          <h2 className="text-base font-bold text-foreground mb-5">Core Web Vitals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {vitals.map(({ key, label, unit }) => {
              const val = latestScan[key as keyof SerializedScan] as number | null;
              return (
                <div
                  key={key}
                  className="bg-secondary/20 border border-border/20 rounded-xl p-4 text-center space-y-1"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {label}
                  </p>
                  <p className={`text-xl font-extrabold tabular-nums ${vitalColor(key, val)}`}>
                    {key === "cls"
                      ? val !== null ? val.toFixed(3) : "—"
                      : val !== null ? val.toLocaleString() : "—"}
                  </p>
                  {val !== null && (
                    <p className="text-[10px] text-muted-foreground">{unit || "score"}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audit category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AUDIT_PAGES.map((page) => {
          const score = page.scoreKey && latestScan
            ? (latestScan[page.scoreKey] as number | null)
            : null;
          return (
            <Link
              key={page.key}
              href={page.href(website.id)}
              className="group bg-card border border-border/30 rounded-2xl p-5 hover:border-border/80 hover:shadow-lg transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${page.color}`}>
                  {page.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{page.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {score !== null ? `Score: ${score}` : "No data"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>

      {/* Score trend chart */}
      {scans.length > 0 && (
        <div className="bg-card border border-border/30 rounded-2xl p-6">
          <h2 className="text-base font-bold text-foreground mb-5">Score Trends</h2>
          <ScoreChart scans={scans} />
        </div>
      )}

      {/* Scan history table */}
      {scans.length > 0 && (
        <div className="bg-card border border-border/30 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/20">
            <h2 className="text-base font-bold text-foreground">Scan History</h2>
          </div>
          <div className="divide-y divide-border/20">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-secondary/10 transition-colors text-sm"
              >
                <StatusBadge status={scan.status} />
                <span className="text-muted-foreground text-xs">
                  {new Date(scan.createdAt).toLocaleString()}
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  {scan.overallScore !== null && (
                    <span className="font-bold text-foreground tabular-nums">
                      {scan.overallScore}
                    </span>
                  )}
                  {scan.criticalCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                      <AlertTriangle className="w-3 h-3" />
                      {scan.criticalCount} critical
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {scan.issueCount} issues
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
