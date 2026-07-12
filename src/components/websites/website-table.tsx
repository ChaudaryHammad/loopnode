"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Globe,
  ArrowRight,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  ChevronUp,
  ChevronDown,
  Zap,
} from "lucide-react";
import { DeleteWebsiteDialog } from "@/components/websites/delete-website-dialog";
import { AuditScanControls } from "@/components/websites/audit-scan-controls";
import type { WebsiteListScan } from "@/lib/website-scan-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Website {
  id: string;
  name: string;
  url: string;
  scanFrequency: string;
  scans: WebsiteListScan[];
  latestScan: WebsiteListScan | null;
  runningScan: WebsiteListScan | null;
  displayScan: WebsiteListScan | null;
  monitorEnabled?: boolean;
  monitorStatus?: string | null;
}

interface WebsiteTableProps {
  websites: Website[];
}

type SortKey = "name" | "overallScore" | "frequency" | "lastScan";
type SortDir = "asc" | "desc";

function ScoreText({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[11px] font-bold text-muted-foreground/60">—</span>;
  const color =
    score >= 90 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-400";
  return <span className={`text-sm font-bold tabular-nums ${color}`}>{score}</span>;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) {
    return (
      <Badge variant="secondary" className="uppercase text-[10px]">
        <Clock />
        No scan
      </Badge>
    );
  }

  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    COMPLETED: {
      label: "Completed",
      className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      icon: <CheckCircle />,
    },
    RUNNING: {
      label: "Running",
      className: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      icon: <Zap className="animate-pulse" />,
    },
    PENDING: {
      label: "Pending",
      className: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      icon: <Clock />,
    },
    FAILED: {
      label: "Failed",
      className: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      icon: <XCircle />,
    },
  };

  const config = map[status] ?? map.PENDING;
  return (
    <Badge variant="outline" className={`uppercase text-[10px] ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
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
    <Button
      variant="ghost"
      size="sm"
      className={`h-auto p-0 text-[11px] font-semibold uppercase tracking-wider ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
      onClick={() => onClick(sortKey)}
    >
      {label}
      {active ? (
        dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3 opacity-30" />
      )}
    </Button>
  );
}

export function WebsiteTable({ websites }: WebsiteTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [deleteTarget, setDeleteTarget] = useState<Website | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...websites].sort((a, b) => {
    const latestA = a.latestScan;
    const latestB = b.latestScan;
    const displayA = a.displayScan;
    const displayB = b.displayScan;
    let valA: string | number;
    let valB: string | number;

    if (sortKey === "name") {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortKey === "overallScore") {
      valA = displayA?.overallScore ?? -1;
      valB = displayB?.overallScore ?? -1;
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

  return (
    <>
    <Card className="rounded-2xl border-border/30 overflow-hidden py-0 gap-0">
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

      <div className="divide-y divide-border/20">
        {sorted.map((site) => {
          const { latestScan, runningScan, displayScan } = site;
          const statusScan = runningScan ?? latestScan;
          const initialProgress = runningScan
            ? {
                phase: runningScan.phase ?? "queued",
                statusMessage: runningScan.statusMessage ?? "Audit in progress…",
                progressPercent: runningScan.progressPercent ?? 2,
                startedAt: runningScan.startedAt ?? runningScan.createdAt,
              }
            : null;

          return (
            <div
              key={site.id}
              className="grid grid-cols-[2fr_1fr_repeat(4,_minmax(0,_1fr))_1.5fr_auto] items-center gap-4 px-5 py-4 hover:bg-secondary/10 transition-colors group"
            >
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

              <StatusBadge status={statusScan?.status} />
              <ScoreText score={displayScan?.overallScore ?? null} />
              <ScoreText score={displayScan?.performanceScore ?? null} />
              <ScoreText score={displayScan?.accessibilityScore ?? null} />
              <ScoreText score={displayScan?.seoScore ?? null} />

              <Badge variant="secondary" className="w-fit uppercase text-[11px]">
                {site.scanFrequency.toLowerCase()}
              </Badge>

              <div className="flex items-center gap-1 justify-end">
                <AuditScanControls
                  websiteId={site.id}
                  runningScanId={runningScan?.id ?? null}
                  initialProgress={initialProgress}
                  iconOnly
                  runVariant="ghost"
                  size="icon-sm"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  render={<Link href={`/dashboard/websites/${site.id}/settings`} />}
                  nativeButton={false}
                  title="Edit settings"
                >
                  <Edit />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(site)}
                  className="hover:text-destructive hover:bg-destructive/10"
                  title="Delete website"
                >
                  <Trash2 />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  render={<Link href={`/dashboard/websites/${site.id}`} />}
                  nativeButton={false}
                  title="View overview"
                >
                  <ArrowRight />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>

    {deleteTarget ? (
      <DeleteWebsiteDialog
        websiteId={deleteTarget.id}
        websiteName={deleteTarget.name}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    ) : null}
    </>
  );
}
