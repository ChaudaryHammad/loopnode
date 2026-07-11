"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RecentAuditRow = {
  id: string;
  status: string;
  overallScore: number | null;
  createdAt: Date | string;
  completedAt: Date | string | null;
  website: {
    id: string;
    name: string;
    url: string;
    user: { email: string; name: string | null };
  };
};

const PAGE_SIZE = 5;

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  RUNNING: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  FAILED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export function AdminRecentAuditsPanel({ audits }: { audits: RecentAuditRow[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (audits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No audits have been run yet.
      </p>
    );
  }

  const shown = audits.slice(0, visible);
  const hasMore = visible < audits.length;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border/25">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/20 bg-secondary/20 text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Website
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </th>
              <th className="hidden sm:table-cell px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">
                Score
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">
                When
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((audit) => (
              <tr
                key={audit.id}
                className="border-b border-border/10 last:border-0 hover:bg-secondary/15 transition-colors"
              >
                <td className="px-4 py-3 align-top min-w-0">
                  <p className="font-medium truncate">{audit.website.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {audit.website.user.email}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full text-[10px] capitalize",
                      STATUS_STYLE[audit.status] ?? STATUS_STYLE.PENDING
                    )}
                  >
                    {audit.status.toLowerCase()}
                  </Badge>
                </td>
                <td className="hidden sm:table-cell px-4 py-3 align-top text-right tabular-nums font-medium">
                  {audit.overallScore != null ? Math.round(audit.overallScore) : "—"}
                </td>
                <td className="px-4 py-3 align-top text-right text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                  {formatDateTime(audit.completedAt ?? audit.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1"
            onClick={() => setVisible((count) => Math.min(count + PAGE_SIZE, audits.length))}
          >
            Show more
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
