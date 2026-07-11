"use client";

import React, { useMemo, useState } from "react";
import { DollarSign, Globe2, ScanLine, Users } from "lucide-react";
import { PLAN_LABELS } from "@/lib/plans";
import type { PlanTier } from "@prisma/client";
import { cn } from "@/lib/utils";

export interface ScanTrendPoint {
  key: string;
  label: string;
  total: number;
  failed: number;
  completed: number;
}

export interface SubscriptionPlanPoint {
  plan: PlanTier;
  count: number;
  revenue: number;
}

const PLAN_COLORS: Record<PlanTier, string> = {
  STARTER: "#818cf8",
  PRO: "#34d399",
  AGENCY: "#fbbf24",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  TRIALING: "Trialing",
  PAST_DUE: "Past due",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export function AdminKpiStrip({
  stats,
}: {
  stats: Array<{
    label: string;
    value: string;
    sub?: string;
    icon: "mrr" | "users" | "websites" | "audits";
    tone: "violet" | "sky" | "emerald" | "amber";
  }>;
}) {
  const toneMap = {
    violet: "from-violet-500/15 to-violet-500/0 border-violet-500/15 text-violet-500",
    sky: "from-sky-500/15 to-sky-500/0 border-sky-500/15 text-sky-500",
    emerald: "from-emerald-500/15 to-emerald-500/0 border-emerald-500/15 text-emerald-500",
    amber: "from-amber-500/15 to-amber-500/0 border-amber-500/15 text-amber-500",
  };

  const icons = {
    mrr: DollarSign,
    users: Users,
    websites: Globe2,
    audits: ScanLine,
  };

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = icons[stat.icon];
        return (
          <div
            key={stat.label}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5",
              toneMap[stat.tone]
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl xl:text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                  {stat.value}
                </p>
                {stat.sub ? (
                  <p className="text-xs text-muted-foreground truncate">{stat.sub}</p>
                ) : null}
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/60 border border-border/30">
                <Icon className="w-4 h-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cp1x = prev.x + (curr.x - prev.x) / 3;
    const cp2x = curr.x - (curr.x - prev.x) / 3;
    d += ` C ${cp1x} ${prev.y} ${cp2x} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

export function AdminAuditVolumeChart({ data }: { data: ScanTrendPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const width = 720;
  const height = 280;
  const pad = { top: 24, right: 20, bottom: 40, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const maxY = Math.max(1, ...data.map((d) => d.total));
  const weekTotal = data.reduce((sum, d) => sum + d.total, 0);
  const weekCompleted = data.reduce((sum, d) => sum + d.completed, 0);
  const weekFailed = data.reduce((sum, d) => sum + d.failed, 0);

  const points = useMemo(
    () =>
      data.map((point, index) => {
        const x =
          data.length === 1
            ? pad.left + innerW / 2
            : pad.left + (index / (data.length - 1)) * innerW;
        const y = pad.top + innerH - (point.total / maxY) * innerH;
        return { x, y, point, index };
      }),
    [data, innerW, innerH, maxY, pad.left, pad.top]
  );

  const linePath = buildSmoothPath(points.map((p) => ({ x: p.x, y: p.y })));
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${pad.top + innerH} L ${points[0].x} ${pad.top + innerH} Z`
      : "";

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const value = Math.round((maxY / 4) * i);
    const y = pad.top + innerH - (value / maxY) * innerH;
    return { value, y };
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-2xl font-semibold tabular-nums">{weekTotal}</p>
            <p className="text-xs text-muted-foreground">Total audits · 7 days</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums text-emerald-500">{weekCompleted}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div>
            <p className="text-lg font-semibold tabular-nums text-rose-500">{weekFailed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[300px] h-auto"
          role="img"
          aria-label="Audit volume trend for the last seven days"
        >
          <defs>
            <linearGradient id="auditArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridLines.map((line) => (
            <g key={line.value}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={line.y}
                y2={line.y}
                stroke="currentColor"
                strokeOpacity={0.07}
              />
              <text
                x={pad.left - 8}
                y={line.y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {line.value}
              </text>
            </g>
          ))}

          {areaPath ? <path d={areaPath} fill="url(#auditArea)" /> : null}
          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke="rgb(99 102 241)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ) : null}

          {points.map(({ x, y, point, index }) => (
            <g
              key={point.key}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle cx={x} cy={y} r={22} fill="transparent" className="cursor-default" />
              {point.failed > 0 ? (
                <circle cx={x} cy={pad.top + innerH - 6} r={3} className="fill-rose-500/90" />
              ) : null}
              <circle
                cx={x}
                cy={y}
                r={hovered === index ? 6 : 4}
                className={cn(
                  "fill-indigo-500 stroke-background stroke-2 transition-all",
                  hovered === index && "fill-indigo-400"
                )}
              />
              {hovered === index ? (
                <>
                  <line
                    x1={x}
                    x2={x}
                    y1={pad.top}
                    y2={pad.top + innerH}
                    stroke="rgb(99 102 241)"
                    strokeOpacity={0.35}
                    strokeWidth={1}
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={Math.min(Math.max(x - 58, pad.left), width - pad.right - 116)}
                    y={Math.max(y - 52, pad.top)}
                    width={116}
                    height={44}
                    rx={10}
                    className="fill-foreground stroke-border/20"
                    strokeWidth={1}
                  />
                  <text
                    x={Math.min(Math.max(x, pad.left + 58), width - pad.right - 58)}
                    y={Math.max(y - 32, pad.top + 14)}
                    textAnchor="middle"
                    className="fill-background text-[13px] font-semibold"
                  >
                    {point.total} audits
                  </text>
                  <text
                    x={Math.min(Math.max(x, pad.left + 58), width - pad.right - 58)}
                    y={Math.max(y - 16, pad.top + 30)}
                    textAnchor="middle"
                    className="fill-background/70 text-[10px]"
                  >
                    {point.completed} completed · {point.failed} failed
                  </text>
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    className="fill-indigo-400 text-[11px] font-bold"
                  >
                    {point.total}
                  </text>
                </>
              ) : null}
              <text
                x={x}
                y={height - 12}
                textAnchor="middle"
                className={cn(
                  "text-[11px]",
                  hovered === index
                    ? "fill-foreground font-medium"
                    : "fill-muted-foreground"
                )}
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export function AdminSubscriptionChart({
  plans,
  status,
  estimatedMrr,
}: {
  plans: SubscriptionPlanPoint[];
  status: Record<string, number>;
  estimatedMrr: number;
}) {
  const maxRevenue = Math.max(1, ...plans.map((p) => p.revenue));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Estimated MRR
        </p>
        <p className="text-3xl font-semibold tabular-nums mt-1">${estimatedMrr.toLocaleString()}</p>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Revenue by plan
        </p>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active paid plans yet.</p>
        ) : (
          plans.map((row) => {
            const width = Math.max(8, (row.revenue / maxRevenue) * 100);
            return (
              <div key={row.plan} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{PLAN_LABELS[row.plan]}</span>
                  <span className="text-muted-foreground tabular-nums text-xs">
                    {row.count} accounts · ${row.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary/50 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${width}%`, backgroundColor: PLAN_COLORS[row.plan] }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {Object.entries(status).map(([key, count]) => (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-secondary/15 px-2.5 py-1 text-xs"
          >
            <span className="font-medium">{STATUS_LABELS[key] ?? key}</span>
            <span className="text-muted-foreground tabular-nums">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
