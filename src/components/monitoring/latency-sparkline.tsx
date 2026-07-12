"use client";

import { useId, useMemo, useState } from "react";
import { formatLatency } from "@/lib/uptime/format";
import { cn } from "@/lib/utils";

export type LatencyPoint = {
  id: string;
  latencyMs: number | null;
  up: boolean;
  checkedAt?: string;
};

const W = 900;
const H = 260;
const P = { t: 24, r: 16, b: 36, l: 52 };

function uniqueLabelIndexes(n: number): number[] {
  if (n <= 1) return n === 1 ? [0] : [];
  if (n === 2) return [0, 1];
  if (n <= 5) return Array.from({ length: n }, (_, i) => i);
  return [...new Set([0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1])];
}

function axisLabel(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function timeLabel(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LatencySparkline({
  points,
  className,
}: {
  points: LatencyPoint[];
  className?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const chart = useMemo(() => {
    const data = points.filter(
      (p): p is LatencyPoint & { latencyMs: number } => p.latencyMs != null
    );
    if (data.length === 0) return null;

    const vals = data.map((d) => d.latencyMs);
    const rawMin = Math.min(...vals);
    const rawMax = Math.max(...vals);
    const pad = Math.max((rawMax - rawMin) * 0.25, 50);
    const y0 = Math.max(0, rawMin - pad);
    const y1 = rawMax + pad;
    const span = Math.max(y1 - y0, 1);
    const iw = W - P.l - P.r;
    const ih = H - P.t - P.b;

    const pts = data.map((d, i) => {
      const x = data.length === 1 ? P.l + iw / 2 : P.l + (i / (data.length - 1)) * iw;
      const y = P.t + ih - ((d.latencyMs - y0) / span) * ih;
      return { ...d, x, y, i };
    });

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const mx = (a.x + b.x) / 2;
      path += ` C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
    }
    const floor = P.t + ih;
    const area = `${path} L ${pts[pts.length - 1].x} ${floor} L ${pts[0].x} ${floor} Z`;

    const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
    const sorted = [...vals].sort((a, b) => a - b);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? avg;
    const avgY = P.t + ih - ((avg - y0) / span) * ih;

    const yTicks = [y0, (y0 + y1) / 2, y1].map((v, i) => ({
      key: `yt-${i}`,
      v,
      y: P.t + ih - ((v - y0) / span) * ih,
    }));

    const xTicks = uniqueLabelIndexes(pts.length).map((idx, order) => ({
      key: `xt-${order}`,
      x: pts[idx].x,
      label: timeLabel(pts[idx].checkedAt),
    }));

    const upPct =
      Math.round((data.filter((d) => d.up).length / data.length) * 1000) / 10;

    return { pts, path, area, avg, p95, avgY, yTicks, xTicks, rawMin, rawMax, upPct, floor, iw };
  }, [points]);

  if (!chart) {
    return (
      <div
        className={cn(
          "flex h-48 items-center justify-center text-sm text-muted-foreground",
          className
        )}
      >
        No checks yet — run a check to see response times.
      </div>
    );
  }

  const active = hover != null ? chart.pts[hover] : null;

  return (
    <div className={cn("space-y-5", className)}>
      {/* Inline stats — no nested cards */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <InlineStat label="Avg" value={formatLatency(chart.avg)} />
        <InlineStat label="p95" value={formatLatency(chart.p95)} />
        <InlineStat
          label="Range"
          value={`${formatLatency(chart.rawMin)} – ${formatLatency(chart.rawMax)}`}
        />
        <InlineStat label="Success" value={`${chart.upPct}%`} />
      </div>

      <div className="relative">
        {active ? (
          <div className="pointer-events-none absolute left-0 top-0 z-10 rounded-lg border border-border/50 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
            <p className="text-sm font-semibold tabular-nums">
              {formatLatency(active.latencyMs)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              <span className={active.up ? "text-emerald-400" : "text-rose-400"}>
                {active.up ? "Success" : "Failed"}
              </span>
              {active.checkedAt
                ? ` · ${new Date(active.checkedAt).toLocaleString()}`
                : ""}
            </p>
          </div>
        ) : null}

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-56 w-full sm:h-64"
          role="img"
          aria-label="Response time"
        >
          <defs>
            <linearGradient id={`g-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>

          {chart.yTicks.map((t) => (
            <g key={t.key}>
              <line
                x1={P.l}
                x2={W - P.r}
                y1={t.y}
                y2={t.y}
                stroke="currentColor"
                className="text-border/35"
                strokeDasharray="4 5"
              />
              <text
                x={P.l - 8}
                y={t.y + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="10"
              >
                {axisLabel(t.v)}
              </text>
            </g>
          ))}

          <line
            x1={P.l}
            x2={W - P.r}
            y1={chart.avgY}
            y2={chart.avgY}
            stroke="#fbbf24"
            strokeOpacity="0.4"
            strokeDasharray="5 4"
          />

          <path d={chart.area} fill={`url(#g-${gid})`} />
          <path
            d={chart.path}
            fill="none"
            stroke="#34d399"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chart.pts.map((p, i) => (
            <g key={p.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={18}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={hover === i ? 4.5 : 2.75}
                fill={p.up ? "#34d399" : "#f87171"}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                className="pointer-events-none"
              />
            </g>
          ))}

          {chart.xTicks.map((t) =>
            t.label ? (
              <text
                key={t.key}
                x={t.x}
                y={H - 10}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize="10"
              >
                {t.label}
              </text>
            ) : null
          )}
        </svg>
      </div>

      {/* Availability strip */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Availability</span>
          <span>{chart.upPct}% succeeded</span>
        </div>
        <div className="flex h-2 gap-px overflow-hidden rounded-sm">
          {chart.pts.map((p) => (
            <button
              key={`seg-${p.id}`}
              type="button"
              title={`${p.up ? "Up" : "Down"} · ${formatLatency(p.latencyMs)}`}
              className={cn(
                "min-w-[3px] flex-1 transition-opacity hover:opacity-80",
                p.up ? "bg-emerald-500/80" : "bg-rose-500"
              )}
              onMouseEnter={() => setHover(p.i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}
