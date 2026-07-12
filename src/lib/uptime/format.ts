import type { MonitorStatus } from "@prisma/client";

export function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${seconds / 60}m`;
  return `${seconds / 3600}h`;
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatUptimePct(pct: number | null | undefined): string {
  if (pct == null) return "—";
  return `${pct.toFixed(2)}%`;
}

export function monitorStatusLabel(status: MonitorStatus | string): string {
  switch (status) {
    case "UP":
      return "Up";
    case "DOWN":
      return "Down";
    case "DEGRADED":
      return "Degraded";
    case "PAUSED":
      return "Paused";
    default:
      return "Unknown";
  }
}

export function monitorStatusClass(status: MonitorStatus | string): string {
  switch (status) {
    case "UP":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
    case "DOWN":
      return "bg-rose-500/10 text-rose-400 border-rose-500/25";
    case "DEGRADED":
      return "bg-amber-500/10 text-amber-400 border-amber-500/25";
    case "PAUSED":
      return "bg-secondary/40 text-muted-foreground border-border/30";
    default:
      return "bg-secondary/40 text-muted-foreground border-border/30";
  }
}

export function formatIncidentDuration(startedAt: Date | string, resolvedAt?: Date | string | null): string {
  const start = new Date(startedAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  const totalSec = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
