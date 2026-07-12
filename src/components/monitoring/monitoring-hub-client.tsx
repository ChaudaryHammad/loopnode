"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  PauseCircle,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatInterval,
  formatLatency,
  formatUptimePct,
  monitorStatusClass,
  monitorStatusLabel,
} from "@/lib/uptime/format";
import { cn } from "@/lib/utils";

export type MonitorHubRow = {
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  enabled: boolean;
  paused: boolean;
  lastStatus: string;
  lastLatencyMs: number | null;
  lastCheckedAt: string | null;
  intervalSeconds: number;
  uptimePercent24h: number | null;
  uptimePercent7d: number | null;
  openIncidents: number;
  sslDaysRemaining: number | null;
};

export function MonitoringHubClient({
  rows,
  summary,
}: {
  rows: MonitorHubRow[];
  summary: { up: number; down: number; degraded: number; paused: number; unmonitored: number };
}) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Monitoring</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Uptime, latency, SSL expiry, and incidents across your connected websites — checked on a
          schedule with email alerts when something goes wrong.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryTile label="Up" value={summary.up} tone="good" icon={<CheckCircle2 className="w-4 h-4" />} />
        <SummaryTile label="Down" value={summary.down} tone="bad" icon={<AlertTriangle className="w-4 h-4" />} />
        <SummaryTile label="Degraded" value={summary.degraded} tone="warn" icon={<Clock className="w-4 h-4" />} />
        <SummaryTile label="Paused" value={summary.paused} tone="muted" icon={<PauseCircle className="w-4 h-4" />} />
        <SummaryTile
          label="Not monitored"
          value={summary.unmonitored}
          tone="muted"
          icon={<Activity className="w-4 h-4" />}
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-card p-10 text-center">
          <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">No websites yet</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Connect a website first, then enable monitoring from its monitor page.
          </p>
          <Button render={<Link href="/dashboard/websites" />} nativeButton={false}>
            Go to websites
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Website</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Latency</th>
                  <th className="px-4 py-3 font-medium">Uptime 24h</th>
                  <th className="px-4 py-3 font-medium">Interval</th>
                  <th className="px-4 py-3 font-medium">SSL</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.websiteId} className="border-b border-border/30 hover:bg-secondary/10">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{row.websiteName}</div>
                      <a
                        href={row.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        {row.websiteUrl.replace(/^https?:\/\//, "")}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn("text-[11px]", monitorStatusClass(row.lastStatus))}
                      >
                        {monitorStatusLabel(row.lastStatus)}
                        {row.openIncidents > 0 ? ` · ${row.openIncidents} open` : ""}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {formatLatency(row.lastLatencyMs)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {formatUptimePct(row.uptimePercent24h)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.enabled ? formatInterval(row.intervalSeconds) : "Off"}
                    </td>
                    <td className="px-4 py-3">
                      {row.sslDaysRemaining != null ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs",
                            row.sslDaysRemaining <= 14
                              ? "text-amber-400"
                              : "text-muted-foreground"
                          )}
                        >
                          <Shield className="w-3 h-3" />
                          {row.sslDaysRemaining}d
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        render={<Link href={`/dashboard/websites/${row.websiteId}/monitoring`} />}
                        nativeButton={false}
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "good" | "bad" | "warn" | "muted";
  icon: React.ReactNode;
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-rose-400"
        : tone === "warn"
          ? "text-amber-400"
          : "text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-4 space-y-2">
      <div className={cn("flex items-center gap-2 text-xs uppercase tracking-wider", toneClass)}>
        {icon}
        {label}
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
