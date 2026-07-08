"use client";

import React, { useState } from "react";
import { Shield, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { AuditSection } from "./audit-shared";
import {
  cspGradeBadge,
  cspGradeColor,
  type CspAnalysis,
} from "@/lib/security/csp-analyzer";
import type { SecurityHeaderAudit, SecurityHeaderCheck } from "@/lib/security/fetch-security-headers";

function headerStatusIcon(status: SecurityHeaderCheck["status"]) {
  switch (status) {
    case "good":
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case "weak":
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case "missing":
      return <XCircle className="w-4 h-4 text-rose-400" />;
    default:
      return <Shield className="w-4 h-4 text-muted-foreground" />;
  }
}

function headerStatusBadge(status: SecurityHeaderCheck["status"]) {
  switch (status) {
    case "good":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
    case "weak":
      return "bg-amber-500/10 text-amber-400 border-amber-500/25";
    case "missing":
      return "bg-rose-500/10 text-rose-400 border-rose-500/25";
    default:
      return "bg-secondary/40 text-muted-foreground border-border/30";
  }
}

function prioritizeHeaders(headers: SecurityHeaderCheck[]) {
  return [...headers].sort((a, b) => {
    const score = (header: SecurityHeaderCheck) => {
      if (header.key === "content-security-policy" && !header.present) return 0;
      if (header.key === "https" && !header.present) return 1;
      if (header.status === "missing") return 2;
      if (header.status === "weak") return 3;
      if (header.status === "info") return 4;
      return 5;
    };

    return score(a) - score(b) || a.label.localeCompare(b.label);
  });
}

function CspPanel({ analysis, title }: { analysis: CspAnalysis; title: string }) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {analysis.present
              ? `${analysis.directives.length} directive(s) parsed`
              : "Not configured on this site"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">CSP grade</p>
            <p className={`text-3xl font-bold ${cspGradeColor(analysis.grade)}`}>
              {analysis.grade}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cspGradeBadge(analysis.grade)}`}
          >
            {analysis.score}/100
          </span>
        </div>
      </div>

      {analysis.present && analysis.raw && (
        <div>
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showRaw ? "Hide" : "Show"} raw CSP header
          </button>
          {showRaw && (
            <pre className="mt-2 p-3 rounded-xl bg-secondary/30 border border-border/30 text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all">
              {analysis.raw}
            </pre>
          )}
        </div>
      )}

      {analysis.directives.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Directive</th>
                <th className="pb-2 font-medium">Allowed sources</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {analysis.directives.map((d) => (
                <tr key={d.name}>
                  <td className="py-2.5 pr-4 font-mono text-xs text-primary whitespace-nowrap">
                    {d.name}
                  </td>
                  <td className="py-2.5 font-mono text-[11px] text-muted-foreground break-all">
                    {d.values.join(" ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {analysis.findings.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Policy findings</p>
          {analysis.findings.map((f, i) => (
            <div
              key={i}
              className={`flex gap-3 p-3 rounded-xl border text-xs ${
                f.severity === "critical"
                  ? "border-rose-500/20 bg-rose-500/5"
                  : f.severity === "warning"
                    ? "border-amber-500/20 bg-amber-500/5"
                    : "border-border/30 bg-secondary/10"
              }`}
            >
              {f.severity === "critical" ? (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : f.severity === "warning" ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <div>
                <p className="font-semibold text-foreground">{f.title}</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SecurityLivePanel({ headerAudit }: { headerAudit: SecurityHeaderAudit }) {
  const prioritizedHeaders = prioritizeHeaders(headerAudit.headers);

  return (
    <>
      {headerAudit.error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
          Could not fetch live headers: {headerAudit.error}
        </div>
      )}

      <AuditSection
        title="Security headers"
        description="Live check of HTTP response headers from your site (refreshed on each page load)"
      >
        {!headerAudit.csp.present && (
          <div className="mb-4 rounded-2xl border border-rose-500/25 bg-rose-500/8 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Missing Content-Security-Policy
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Your site is missing a CSP header, which removes a major browser-level defense
                  against XSS and untrusted script execution. This should be treated as one of the
                  highest-priority fixes on the page.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {prioritizedHeaders.map((header) => (
            <div
              key={header.key}
              className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-xl border border-border/30 bg-secondary/5"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {headerStatusIcon(header.status)}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{header.label}</p>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${headerStatusBadge(header.status)}`}
                    >
                      {header.present
                        ? header.status === "good"
                          ? "Configured"
                          : header.status === "weak"
                            ? "Needs improvement"
                            : "Present"
                        : "Missing"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{header.summary}</p>
                  {header.value && header.key !== "https" && (
                    <p className="text-[11px] font-mono text-foreground/70 mt-2 break-all bg-secondary/30 rounded-lg px-2 py-1.5">
                      {header.value}
                    </p>
                  )}
                </div>
              </div>
              {!header.present || header.status === "weak" ? (
                <p className="text-[11px] text-muted-foreground sm:max-w-[220px] sm:text-right leading-relaxed">
                  {header.recommendation}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </AuditSection>

      <AuditSection
        title="Content Security Policy"
        description="Parsed directives and policy findings from your live CSP headers"
      >
        <CspPanel analysis={headerAudit.csp} title="Enforced policy" />
        {headerAudit.cspReportOnly && (
          <div className="pt-6 mt-6 border-t border-border/20">
            <CspPanel analysis={headerAudit.cspReportOnly} title="Report-only policy" />
          </div>
        )}
      </AuditSection>
    </>
  );
}
