"use client";

import React from "react";
import { Zap } from "lucide-react";
import {
  AUDIT_FINDINGS_DESCRIPTION,
  AUDIT_FINDINGS_TITLE,
  AuditPageShell,
  AuditSection,
  type AuditIssue,
} from "./audit-shared";
import {
  VITAL_DEFINITIONS,
  formatVitalValue,
  getVitalRating,
  vitalRatingClasses,
  vitalRatingLabel,
} from "@/lib/web-vitals";
import { PerformanceFindingsList } from "./performance-findings-list";

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
}

interface PerformanceAuditClientProps {
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  score: number | null;
  issues: AuditIssue[];
  lastScanned: string | null;
  metrics: PerformanceMetrics | null;
}

function getScoreTone(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}

function PerformanceScoreBand({
  score,
}: {
  score: number | null;
}) {
  const safeScore = score === null ? 0 : Math.max(0, Math.min(100, score));
  const scoreTone = getScoreTone(score);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Performance score</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Overall result from the latest Lighthouse run
          </p>
        </div>
        <div className="text-right">
          <p className={`text-5xl font-semibold tabular-nums leading-none ${scoreTone}`}>
            {score ?? "—"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">out of 100</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative h-4 overflow-hidden rounded-full bg-secondary/30">
          <div className="absolute inset-y-0 left-0 w-[50%] bg-rose-500/80" />
          <div className="absolute inset-y-0 left-[50%] w-[40%] bg-amber-400/80" />
          <div className="absolute inset-y-0 right-0 w-[10%] bg-emerald-400/80" />
          <div
            className="absolute top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
            style={{ left: `calc(${safeScore}% - 2px)` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>0-49 Poor</span>
          <span>50-89 Needs improvement</span>
          <span>90-100 Good</span>
        </div>
      </div>
    </div>
  );
}

function MetricBar({
  label,
  abbr,
  value,
  ratingLabel,
  toneClass,
}: {
  label: string;
  abbr: string;
  value: string;
  ratingLabel: string;
  toneClass: string;
}) {
  const widths: Record<string, string> = {
    Good: "w-[92%]",
    Poor: "w-[35%]",
    "Needs improvement": "w-[64%]",
    Unknown: "w-[18%]",
  };

  return (
    <div className="rounded-2xl border border-border/30 bg-secondary/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {abbr}
            </span>
            <span className={`h-2 w-2 rounded-full ${toneClass} bg-current`} />
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
          <p className={`mt-1 text-xs font-medium ${toneClass}`}>{ratingLabel}</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary/30">
        <div className={`h-full rounded-full ${widths[ratingLabel] ?? widths.Unknown} ${toneClass} bg-current`} />
      </div>
    </div>
  );
}

export function PerformanceAuditClient({
  websiteId,
  websiteName,
  websiteUrl,
  score,
  issues,
  lastScanned,
  metrics,
}: PerformanceAuditClientProps) {
  const coreVitals = VITAL_DEFINITIONS.filter((v) => v.isCoreWebVital);
  const labMetrics = VITAL_DEFINITIONS.filter((v) => !v.isCoreWebVital);
  const visibleCoreVitals = coreVitals.filter(
    (v) => metrics?.[v.key as keyof PerformanceMetrics] !== null
  );
  const visibleLabMetrics = labMetrics.filter(
    (v) => metrics?.[v.key as keyof PerformanceMetrics] !== null
  );
  const scoreBand =
    score === null ? "Unavailable" : score >= 90 ? "90-100" : score >= 50 ? "50-89" : "0-49";
  const scoreBandTone =
    score === null
      ? "text-muted-foreground"
      : score >= 90
        ? "text-emerald-400"
        : score >= 50
          ? "text-amber-400"
          : "text-rose-400";

  return (
    <AuditPageShell
      websiteId={websiteId}
      websiteName={websiteName}
      websiteUrl={websiteUrl}
      categoryLabel="Performance"
      score={score}
      icon={<Zap className="w-5 h-5" />}
      accentClass="text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      lastScanned={lastScanned}
    >
      {metrics && visibleCoreVitals.length > 0 && (
        <AuditSection
          title="Core Web Vitals"
          description="Key user experience metrics from your latest Lighthouse performance audit"
        >
          <div className="space-y-8">
            <div className="rounded-[28px] border border-border/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] px-6 py-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
                <div className="space-y-5">
                  <PerformanceScoreBand score={score} />
                  <div className="rounded-2xl border border-border/30 bg-secondary/5 p-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Score band
                    </p>
                    <p className={`mt-2 text-sm font-semibold ${scoreBandTone}`}>{scoreBand}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Calculated from the Core Web Vitals and supporting lab signals below.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {visibleCoreVitals.map(({ key, abbr, name }) => {
                    const val = metrics[key as keyof PerformanceMetrics];
                    const rating = getVitalRating(key, val);
                    const styles = vitalRatingClasses(rating);
                    return (
                      <MetricBar
                        key={key}
                        abbr={abbr}
                        label={name}
                        value={formatVitalValue(key, val)}
                        ratingLabel={vitalRatingLabel(rating)}
                        toneClass={styles.text}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {visibleLabMetrics.length > 0 ? (
              <div className="border-t border-border/20 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Supporting lab metrics
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {visibleLabMetrics.map(({ key, abbr, name }) => {
                    const val = metrics[key as keyof PerformanceMetrics];
                    const rating = getVitalRating(key, val);
                    const styles = vitalRatingClasses(rating);
                    return (
                      <div
                        key={key}
                        className={`rounded-2xl border p-4 flex items-center justify-between gap-4 ${styles.border} bg-secondary/5`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{abbr}</p>
                          <p className="text-xs text-muted-foreground">{name}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold tabular-nums ${styles.text}`}>
                            {formatVitalValue(key, val)}
                          </p>
                          <span className={`text-[10px] font-medium ${styles.text}`}>
                            {vitalRatingLabel(rating)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </AuditSection>
      )}

      <AuditSection title={AUDIT_FINDINGS_TITLE} description={AUDIT_FINDINGS_DESCRIPTION}>
        <PerformanceFindingsList issues={issues} />
      </AuditSection>
    </AuditPageShell>
  );
}
