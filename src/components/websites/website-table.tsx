"use client";

import React, { useTransition, useState } from "react";
import Link from "next/link";
import {
  Globe, ArrowRight, Edit, Trash2, AlertCircle,
  CheckCircle, Clock, XCircle, ChevronUp, ChevronDown, Zap,
} from "lucide-react";
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

interface WebsiteTableProps {
  websites: Website[];
  onScanTrigger?: (websiteId: string) => void;
}

type SortKey = "name" | "overallScore" | "frequency" | "lastScan";
type SortDir = "asc" | "desc";

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null)
    return (
      <span className="text-[11px] font-bold text-muted-foreground/60">—</span>
    );
  const color =
    score >= 90
      ? "text-emerald-400"
      : score >= 50
      ? "text-amber-400"
      : "text-rose-400";
  return <span className={`text-sm font-bold tabular-nums ${color}`}>{score}</span>;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/40 border border-border/30 text-muted-foreground">
        <Clock className="w-2.5 h-2.5" /> No Scan
      </span>
    );
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    COMPLETED: {
      label: "Completed",
      className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      icon: <CheckCircle className="w-2.5 h-2.5" />,
    },
    RUNNING: {
      label: "Running",
      className: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      icon: <Zap className="w-2.5 h-2.5 animate-pulse" />,
    },
    PENDING: {
      label: "Pending",
      className: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      icon: <Clock className="w-2.5 h-2.5" />,
    },
    FAILED: {
      label: "Failed",
      className: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      icon: <XCircle className="w-2.5 h-2.5" />,
    },
  };
  const config = map[status] ?? map["PENDING"];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function SortButton({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onClick(sortKey)}
      className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )
      ) : (
        <ChevronDown className="w-3 h-3 opacity-30" />
      )}
    </button>
  );
}

export function WebsiteTable({ websites, onScanTrigger }: WebsiteTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pendingId, startTransition] = useTransition();

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...websites].sort((a, b) => {
    const latestA = a.scans[0];
    const latestB = b.scans[0];
    let valA: any, valB: any;

    if (sortKey === "name") {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortKey === "overallScore") {
      valA = latestA?.overallScore ?? -1;
      valB = latestB?.overallScore ?? -1;
    } else if (sortKey === "frequency") {
      valA = a.scanFrequency;
      valB = b.scanFrequency;
    } else {
      valA = latestA?.createdAt ? new Date(latestA.createdAt).getTime() : 0;
      valB = latestB?.createdAt ? new Date(latestB.createdAt).getTime() : 0;
    }

    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleDelete = (website: Website) => {
    if (confirm(`Delete "${website.name}"? This action cannot be undone.`)) {
      startTransition(async () => {
        await deleteWebsiteAction(website.id);
      });
    }
  };

  return (
    <div className="bg-card border border-border/30 rounded-2xl overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[2fr_1fr_repeat(4,_minmax(0,_1fr))_1.5fr_auto] items-center gap-4 px-5 py-3 border-b border-border/20 bg-secondary/20">
        <SortButton label="Website" sortKey="name" current={sortKey} dir={sortDir} onClick={handleSort} />
        <SortButton label="Status" sortKey="lastScan" current={sortKey} dir={sortDir} onClick={handleSort} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Overall</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Perf</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">A11y</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SEO</span>
        <SortButton label="Frequency" sortKey="frequency" current={sortKey} dir={sortDir} onClick={handleSort} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</span>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border/20">
        {sorted.map((site) => {
          const latestScan = site.scans[0];
          return (
            <div
              key={site.id}
              className="grid grid-cols-[2fr_1fr_repeat(4,_minmax(0,_1fr))_1.5fr_auto] items-center gap-4 px-5 py-4 hover:bg-secondary/10 transition-colors group"
            >
              {/* Name + URL */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{site.name}</p>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors truncate"
                >
                  <Globe className="w-3 h-3 shrink-0" />
                  <span className="truncate">{site.url.replace(/^https?:\/\//, "")}</span>
                </a>
              </div>

              {/* Status */}
              <StatusBadge status={latestScan?.status} />

              {/* Scores */}
              <ScoreBadge score={latestScan?.overallScore ?? null} />
              <ScoreBadge score={latestScan?.performanceScore ?? null} />
              <ScoreBadge score={latestScan?.accessibilityScore ?? null} />
              <ScoreBadge score={latestScan?.seoScore ?? null} />

              {/* Frequency */}
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/40 border border-border/20 text-muted-foreground w-fit">
                {site.scanFrequency.toLowerCase()}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 justify-end">
                {onScanTrigger && (
                  <button
                    onClick={() => onScanTrigger(site.id)}
                    disabled={latestScan?.status === "RUNNING"}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all disabled:opacity-40 cursor-pointer"
                    title="Audit Now"
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                )}
                <Link
                  href={`/dashboard/websites/${site.id}/settings`}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent hover:border-border/30 transition-all"
                  title="Edit Settings"
                >
                  <Edit className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => handleDelete(site)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/25 transition-all cursor-pointer"
                  title="Delete Website"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <Link
                  href={`/dashboard/websites/${site.id}`}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all"
                  title="View Overview"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
