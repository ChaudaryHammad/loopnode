import React from "react";
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { AuditSection } from "./audit-shared";
import type { SeoSnapshot, CheckStatus } from "@/lib/seo/fetch-seo-snapshot";

function statusIcon(status: CheckStatus) {
  switch (status) {
    case "pass":
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case "warn":
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case "fail":
      return <XCircle className="w-4 h-4 text-rose-400" />;
    default:
      return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
  }
}

function statusBadge(status: CheckStatus) {
  switch (status) {
    case "pass":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
    case "warn":
      return "bg-amber-500/10 text-amber-400 border-amber-500/25";
    case "fail":
      return "bg-rose-500/10 text-rose-400 border-rose-500/25";
    default:
      return "bg-secondary/40 text-muted-foreground border-border/30";
  }
}

function statusLabel(status: CheckStatus) {
  switch (status) {
    case "pass":
      return "Pass";
    case "warn":
      return "Needs work";
    case "fail":
      return "Fail";
    default:
      return "Unknown";
  }
}

export function SeoSnapshotPanel({ snapshot }: { snapshot: SeoSnapshot }) {
  if (snapshot.error) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
        Could not fetch live page data: {snapshot.error}
      </div>
    );
  }

  if (!snapshot.reachable) return null;

  return (
    <AuditSection
      title="On-page SEO checklist"
      description="Live analysis of your homepage HTML (refreshed on each page load)"
    >
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{snapshot.passCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Passing</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{snapshot.warnCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Needs work</p>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-rose-400">{snapshot.failCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Failing</p>
        </div>
      </div>

      <div className="space-y-3">
        {snapshot.checks.map((check) => (
          <div
            key={check.id}
            className="p-4 rounded-xl border border-border/30 bg-secondary/5 space-y-2"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {statusIcon(check.status)}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{check.label}</p>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusBadge(check.status)}`}
                    >
                      {statusLabel(check.status)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{check.detail}</p>
                </div>
              </div>
            </div>
            {check.value && (
              <p className="text-[11px] font-mono text-foreground/70 bg-secondary/30 rounded-lg px-3 py-2 break-all">
                {check.value}
              </p>
            )}
            {check.status !== "pass" && (
              <p className="text-xs text-muted-foreground pl-7">
                <span className="font-medium text-foreground">Fix: </span>
                {check.recommendation}
              </p>
            )}
          </div>
        ))}
      </div>
    </AuditSection>
  );
}
