"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, AlertTriangle, Info, AlertOctagon,
  ChevronDown, ChevronUp, Globe, Filter,
} from "lucide-react";

export type AuditCategory =
  | "PERFORMANCE"
  | "ACCESSIBILITY"
  | "SEO"
  | "SECURITY"
  | "BROKEN_LINKS";

export type IssueSeverity = "CRITICAL" | "MAJOR" | "MINOR" | "INFO";

export interface AuditIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  selector?: string | null;
  url?: string | null;
  recommendation?: string | null;
}

interface AuditPageClientProps {
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  category: AuditCategory;
  categoryLabel: string;
  score: number | null;
  icon: React.ReactNode;
  accentClass: string;
  issues: AuditIssue[];
  lastScanned: string | null;
}

function SeverityIcon({ severity }: { severity: IssueSeverity }) {
  const map = {
    CRITICAL: <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />,
    MAJOR: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    MINOR: <Info className="w-3.5 h-3.5 text-blue-400" />,
    INFO: <Info className="w-3.5 h-3.5 text-muted-foreground" />,
  };
  return map[severity];
}

function severityBadge(severity: IssueSeverity) {
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
    <div className="border border-border/30 rounded-xl overflow-hidden bg-card hover:border-border/60 transition-colors">
      <button
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
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityBadge(issue.severity)}`}
        >
          {issue.severity}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-border/20 pt-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {issue.description}
          </p>
          {issue.recommendation && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
              <p className="text-xs font-semibold text-primary mb-1">💡 Recommendation</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {issue.recommendation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const SEVERITIES: IssueSeverity[] = ["CRITICAL", "MAJOR", "MINOR", "INFO"];

export function AuditPageClient({
  websiteId,
  websiteName,
  websiteUrl,
  category,
  categoryLabel,
  score,
  icon,
  accentClass,
  issues,
  lastScanned,
}: AuditPageClientProps) {
  const [filter, setFilter] = useState<IssueSeverity | "ALL">("ALL");

  const filtered = filter === "ALL" ? issues : issues.filter((i) => i.severity === filter);

  const counts = {
    CRITICAL: issues.filter((i) => i.severity === "CRITICAL").length,
    MAJOR: issues.filter((i) => i.severity === "MAJOR").length,
    MINOR: issues.filter((i) => i.severity === "MINOR").length,
    INFO: issues.filter((i) => i.severity === "INFO").length,
  };

  const getScoreColor = (s: number | null) => {
    if (s === null) return "text-muted-foreground";
    if (s >= 90) return "text-emerald-400";
    if (s >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="space-y-6 select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/dashboard/websites" className="hover:text-foreground transition-colors">
          Websites
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/websites/${websiteId}`}
          className="hover:text-foreground transition-colors"
        >
          {websiteName}
        </Link>
        <span>/</span>
        <span className="text-foreground">{categoryLabel}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-border/20 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${accentClass}`}>
              {icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{categoryLabel} Audit</h1>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Globe className="w-3 h-3" />
                {websiteUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Score */}
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Score
            </p>
            <p className={`text-3xl font-extrabold tabular-nums ${getScoreColor(score)}`}>
              {score ?? "—"}
            </p>
          </div>

          <Link
            href={`/dashboard/websites/${websiteId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl bg-secondary/40 border border-border/30"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Overview
          </Link>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {/* All */}
        <button
          onClick={() => setFilter("ALL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            filter === "ALL"
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-secondary/30 border-border/30 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Filter className="w-3 h-3" />
          All Issues ({issues.length})
        </button>

        {SEVERITIES.map((sev) => {
          const count = counts[sev];
          if (count === 0) return null;
          return (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                filter === sev
                  ? severityBadge(sev) + " ring-1 ring-current"
                  : "bg-secondary/30 border-border/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              <SeverityIcon severity={sev} />
              {sev.charAt(0) + sev.slice(1).toLowerCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* Issues list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border/30 rounded-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <span className="text-xl">✅</span>
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No issues detected</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {issues.length === 0
              ? "Run an audit to check this category."
              : "No issues match the current filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      {lastScanned && (
        <p className="text-xs text-muted-foreground text-center">
          Last scanned: {new Date(lastScanned).toLocaleString()}
        </p>
      )}
    </div>
  );
}
