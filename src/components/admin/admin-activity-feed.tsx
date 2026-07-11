"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type ActivityLog = {
  id: string;
  action: string;
  description: string | null;
  createdAt: Date | string;
  user: { name: string | null; email: string };
};

const PAGE_SIZE = 5;

function formatActionLabel(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminActivityFeed({ logs }: { logs: ActivityLog[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }

  const shown = logs.slice(0, visible);
  const hasMore = visible < logs.length;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border/25">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/20 bg-secondary/20 text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Event
              </th>
              <th className="hidden sm:table-cell px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                User
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-right">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((log) => (
              <tr
                key={log.id}
                className="border-b border-border/10 last:border-0 hover:bg-secondary/15 transition-colors"
              >
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-foreground">{formatActionLabel(log.action)}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {log.description ?? "—"}
                  </p>
                  <p className="sm:hidden text-[11px] text-muted-foreground mt-1 truncate">
                    {log.user.email}
                  </p>
                </td>
                <td className="hidden sm:table-cell px-4 py-3 align-top text-muted-foreground truncate max-w-[180px]">
                  {log.user.email}
                </td>
                <td className="px-4 py-3 align-top text-right text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                  {formatDateTime(log.createdAt)}
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
            onClick={() => setVisible((count) => Math.min(count + PAGE_SIZE, logs.length))}
          >
            Show more
            <ChevronDown className="w-4 h-4" />
            <span className="text-xs tabular-nums">({logs.length - visible} remaining)</span>
          </Button>
        </div>
      ) : logs.length > PAGE_SIZE ? (
        <p className="text-center text-xs text-muted-foreground">Showing all recent events</p>
      ) : null}
    </div>
  );
}
