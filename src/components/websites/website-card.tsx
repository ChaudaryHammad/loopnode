"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Globe, AlertCircle, ArrowRight, Trash2, Edit } from "lucide-react";
import { DeleteWebsiteDialog } from "@/components/websites/delete-website-dialog";
import { AuditScanControls } from "@/components/websites/audit-scan-controls";
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
}

function ScoreBadge({ score }: { score: number | null }) {
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
    <Badge variant="outline" className={`w-8 h-8 justify-center tabular-nums font-bold ${className}`}>
      {score}
    </Badge>
  );
}

export function WebsiteCard({ website }: WebsiteCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const latestScan = website.scans[0];

  const scoreRows = latestScan
    ? [
        { label: "ALL", score: latestScan.overallScore },
        { label: "PERF", score: latestScan.performanceScore },
        { label: "A11Y", score: latestScan.accessibilityScore },
        { label: "SEO", score: latestScan.seoScore },
        { label: "SEC", score: latestScan.securityScore },
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

      <CardContent>
        {latestScan ? (
          <div className="grid grid-cols-5 gap-2 text-center">
            {scoreRows.map((row) => (
              <div key={row.label} className="flex flex-col items-center">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                  {row.label}
                </span>
                <ScoreBadge score={row.score} />
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertCircle />
            <AlertDescription className="text-xs">
              No scan reports found. Click Audit.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/30">
        <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
          {website.scanFrequency.toLowerCase()}
        </Badge>

        <div className="flex items-center gap-3">
          <AuditScanControls
            websiteId={website.id}
            runningScanId={
              latestScan?.status === "RUNNING" ? latestScan.id : null
            }
            className="h-auto p-0 text-xs"
          />
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
