"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Globe, AlertCircle, ArrowRight, Trash2, Edit, Square, Zap } from "lucide-react";
import { DeleteWebsiteDialog } from "@/components/websites/delete-website-dialog";
import { AuditProgressPanel } from "@/components/websites/audit-progress-panel";
import { useAuditScan } from "@/hooks/use-audit-scan";
import type { WebsiteListScan } from "@/lib/website-scan-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface Website {
  id: string;
  name: string;
  url: string;
  scanFrequency: string;
  scans: WebsiteListScan[];
  latestScan: WebsiteListScan | null;
  runningScan: WebsiteListScan | null;
  displayScan: WebsiteListScan | null;
  monitorStatus?: string | null;
  monitorEnabled?: boolean;
}

interface WebsiteCardProps {
  website: Website;
}

function ScoreBadge({ score, muted = false }: { score: number | null; muted?: boolean }) {
  if (score === null) {
    return (
      <Badge variant="secondary" className="w-8 h-8 justify-center tabular-nums">
        —
      </Badge>
    );
  }

  let className = "text-destructive bg-destructive/10 border-destructive/20";
  if (score >= 90) className = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  else if (score >= 50) className = "text-amber-500 bg-amber-500/10 border-amber-500/20";

  return (
    <Badge
      variant="outline"
      className={cn(
        "w-8 h-8 justify-center tabular-nums font-bold",
        className,
        muted && "opacity-70"
      )}
    >
      {score}
    </Badge>
  );
}

export function WebsiteCard({ website }: WebsiteCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { displayScan, runningScan } = website;

  const initialProgress = runningScan
    ? {
        phase: runningScan.phase ?? "queued",
        statusMessage: runningScan.statusMessage ?? "Audit in progress…",
        progressPercent: runningScan.progressPercent ?? 2,
        startedAt: runningScan.startedAt ?? runningScan.createdAt,
      }
    : null;

  const { startScan, cancelScan, isRunning, isCancelling, progress, completedScan } = useAuditScan({
    websiteId: website.id,
    initialRunningScanId: runningScan?.id ?? null,
    initialProgress,
  });

  const metricsScan = completedScan ?? displayScan;

  const scoreRows = metricsScan
    ? [
        { label: "ALL", score: metricsScan.overallScore },
        { label: "PERF", score: metricsScan.performanceScore },
        { label: "A11Y", score: metricsScan.accessibilityScore },
        { label: "SEO", score: metricsScan.seoScore },
        { label: "SEC", score: metricsScan.securityScore },
      ]
    : [];

  return (
    <Card className="rounded-2xl border-border/30 hover:border-border/80 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1 min-w-0">
          <CardTitle className="text-base truncate max-w-[180px]">{website.name}</CardTitle>
          <a
            href={website.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors truncate max-w-[200px]"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            {website.url.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={`/dashboard/websites/${website.id}/settings`} />}
            nativeButton={false}
            title="Edit settings"
          >
            <Edit />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeleteOpen(true)}
            className="hover:text-destructive hover:bg-destructive/10"
            title="Delete website"
          >
            <Trash2 />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {metricsScan ? (
          <div className="space-y-2">
            {isRunning && displayScan ? (
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Last completed scores
              </p>
            ) : null}
            <div className="grid grid-cols-5 gap-2 text-center">
              {scoreRows.map((row) => (
                <div key={row.label} className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    {row.label}
                  </span>
                  <ScoreBadge score={row.score} muted={isRunning} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Alert>
            <AlertCircle />
            <AlertDescription className="text-xs">
              No completed audits yet. Run your first audit to see scores.
            </AlertDescription>
          </Alert>
        )}

        {isRunning ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-3">
            <AuditProgressPanel progress={progress} compact />
          </div>
        ) : null}

      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/30">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
            {website.scanFrequency.toLowerCase()}
          </Badge>
          {website.monitorEnabled ? (
            <Badge
              variant="outline"
              className={cn(
                "uppercase text-[10px] tracking-wider",
                website.monitorStatus === "UP"
                  ? "text-emerald-400 border-emerald-500/25"
                  : website.monitorStatus === "DOWN"
                    ? "text-rose-400 border-rose-500/25"
                    : website.monitorStatus === "DEGRADED"
                      ? "text-amber-400 border-amber-500/25"
                      : "text-muted-foreground"
              )}
            >
              {website.monitorStatus === "UP"
                ? "Up"
                : website.monitorStatus === "DOWN"
                  ? "Down"
                  : website.monitorStatus === "DEGRADED"
                    ? "Slow"
                    : "Paused"}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void cancelScan()}
              disabled={isCancelling}
              className="h-8 gap-1.5 text-xs"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              {isCancelling ? "Stopping…" : "Stop audit"}
            </Button>
          ) : (
            <Button
              variant="link"
              size="sm"
              onClick={() => void startScan()}
              className="h-8 gap-1.5 text-xs px-0"
            >
              <Zap className="w-3.5 h-3.5" />
              Audit now
            </Button>
          )}
          <ButtonLink
            href={`/dashboard/websites/${website.id}`}
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-foreground"
          >
            Overview
            <ArrowRight />
          </ButtonLink>
        </div>
      </CardFooter>

      <DeleteWebsiteDialog
        websiteId={website.id}
        websiteName={website.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </Card>
  );
}
