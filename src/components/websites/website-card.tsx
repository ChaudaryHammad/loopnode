"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { Globe, Shield, Zap, Eye, Search, AlertCircle, ArrowRight, Trash2, Edit } from "lucide-react";
import { deleteWebsiteAction } from "@/actions/websites";

interface Scan {
  id: string;
  status: string;
  overallScore: number | null;
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  securityScore: number | null;
  createdAt: Date;
}

interface Website {
  id: string;
  name: string;
  url: string;
  scanFrequency: string;
  scans: Scan[];
}

interface WebsiteCardProps {
  website: Website;
  onScanTrigger?: (websiteId: string) => void;
}

export function WebsiteCard({ website, onScanTrigger }: WebsiteCardProps) {
  const [isPending, startTransition] = useTransition();
  const latestScan = website.scans[0]; // Assumed ordered by desc in query

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${website.name}?`)) {
      startTransition(async () => {
        await deleteWebsiteAction(website.id);
      });
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground bg-secondary/30";
    if (score >= 90) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 50) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-destructive bg-destructive/10 border-destructive/20";
  };

  return (
    <div className="bg-card border border-border/30 rounded-2xl p-6 flex flex-col justify-between hover:border-border/80 hover:shadow-lg transition-all duration-300 select-none">
      <div className="space-y-6">
        {/* Header Block */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="font-bold text-base text-foreground leading-snug truncate max-w-[180px]">
              {website.name}
            </h4>
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors truncate max-w-[200px]"
            >
              <Globe className="w-3.5 h-3.5" />
              {website.url.replace(/^https?:\/\//, "")}
            </a>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/dashboard/websites/${website.id}/settings`}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent hover:border-border/30 transition-all"
              title="Edit Settings"
            >
              <Edit className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/25 transition-all cursor-pointer"
              title="Delete Website"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scores Overview Row */}
        {latestScan ? (
          <div className="grid grid-cols-5 gap-2 text-center">
            {/* Overall Score */}
            <div className="col-span-1 flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1">
                ALL
              </span>
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg border font-bold text-xs ${
                getScoreColor(latestScan.overallScore)
              }`}>
                {latestScan.overallScore ?? "—"}
              </span>
            </div>

            {/* Performance */}
            <div className="col-span-1 flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1" title="Performance">
                PERF
              </span>
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg border font-bold text-xs ${
                getScoreColor(latestScan.performanceScore)
              }`}>
                {latestScan.performanceScore ?? "—"}
              </span>
            </div>

            {/* Accessibility */}
            <div className="col-span-1 flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1" title="Accessibility">
                A11Y
              </span>
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg border font-bold text-xs ${
                getScoreColor(latestScan.accessibilityScore)
              }`}>
                {latestScan.accessibilityScore ?? "—"}
              </span>
            </div>

            {/* SEO */}
            <div className="col-span-1 flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1" title="SEO">
                SEO
              </span>
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg border font-bold text-xs ${
                getScoreColor(latestScan.seoScore)
              }`}>
                {latestScan.seoScore ?? "—"}
              </span>
            </div>

            {/* Security */}
            <div className="col-span-1 flex flex-col items-center">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block mb-1" title="Security">
                SEC
              </span>
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg border font-bold text-xs ${
                getScoreColor(latestScan.securityScore)
              }`}>
                {latestScan.securityScore ?? "—"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/20 border border-border/30 text-muted-foreground">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-xs">No scan reports found. Click Audit.</span>
          </div>
        )}
      </div>

      {/* Footer Block */}
      <div className="border-t border-border/30 mt-6 pt-4 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/50 border border-border/20 text-muted-foreground">
          {website.scanFrequency.toLowerCase()}
        </span>

        <div className="flex items-center gap-3">
          {onScanTrigger && (
            <button
              onClick={() => onScanTrigger(website.id)}
              disabled={isPending || latestScan?.status === "RUNNING"}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {latestScan?.status === "RUNNING" ? "Auditing..." : "Audit Now"}
            </button>
          )}

          <Link
            href={`/dashboard/websites/${website.id}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-all group/link"
          >
            Overview
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
