"use client";

import { useId, useMemo, useState } from "react";
import { formatLatency } from "@/lib/uptime/format";
import { cn } from "@/lib/utils";

type Point = {
  id: string;
  latencyMs: number | null;
  up: boolean;
  checkedAt?: string;
};

const WIDTH = 720;
const HEIGHT = 220;
const PAD = { top: 20, right: 16, bottom: 36, left: 52 };

function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (min === max) {
    const base = Math.max(min, 1);
    return [Math.max(0, base - base * 0.25), base, base + base * 0.25].map((n) =>
      Math.round(n)
    );
  }
  const span = max - min;
  const step = span / (count - 1);
  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    ticks.push(Math.round(min + step * i));
  }
  return [...new Set(ticks)];
}

function formatTickMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10_000 ? 0 : 1)}s`;
  return `${Math.round(ms)}`;
}

function formatCheckTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function LatencySparkline({
  points,
  className,
}: {
  points: Point[];
  className?: string;
}) {
  const gradId = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const chart = useMemo(() => {
    const series = points.filter((p): p is Point & { latencyMs: number } => p.latencyMs != null);
    if (series.length === 0) return null;

    const values = series.map((p) => p.latencyMs);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const pad = Math.max((rawMax - rawMin) * 0.15, rawMax * 0.08, 20);
    const min = Math.max(0, rawMin - pad);
    const max = rawMax + pad;
    const span = Math.max(max - min, 1);

    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;

    const coords = series.map((p, i) => {
      const x =
        series.length === 1
          ? PAD.left + innerW / 2
          : PAD.left + (i / (series.length - 1)) * innerW;
      const y = PAD.top + innerH - ((p.latencyMs - min) / span) * innerH;
      return { ...p, x, y, index: i };
    });

    let line = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cx = (prev.x + curr.x) / 2;
      line += ` C ${cx.toFixed(2)} ${prev.y.toFixed(2)} ${cx.toFixed(2)} ${curr.y.toFixed(2)} ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
    }

    const baseline = PAD.top + innerH;
    const area = `${line} L ${coords[coords.length - 1].x.toFixed(2)} ${baseline} L ${coords[0].x.toFixed(2)} ${baseline} Z`;
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const p95 = [...values].sort((a, b) => a - b)[Math.floor(values.length * 0.95)] ?? avg;

    const yTicks = niceTicks(min, max, 4).map((value, i) => ({
      id: `ytick-${i}-${value}`,
      value,
      y: PAD.top + innerH - ((value - min) / span) * innerH,
    }));

    const xLabels =
      coords.length <= 1
        ? [{ id: coords[0].id, x: coords[0].x, label: formatCheckTime(coords[0].checkedAt) }]
        : [0, Math.floor((coords.length - 1) / 2), coords.length - 1].map((idx) => ({
            id: `xlabel-${idx}-${coords[idx].id}`,
            x: coords[idx].x,
            label: formatCheckTime(coords[idx].checkedAt),
          }));

    const avgY = PAD.top + innerH - ((avg - min) / span) * innerH;

    return { coords, line, area, avg, p95, yTicks, xLabels, avgY, rawMin, rawMax };
  }, [points]);

  if (!chart) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Run a few checks to see response time history.
      </p>
    );
  }

  const active = hover != null ? chart.coords[hover] : null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Response time</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Latency across recent uptime checks
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs tabular-nums">
          <div>
            <p className="text-muted-foreground">Avg</p>
            <p className="font-medium text-foreground">{formatLatency(chart.avg)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">p95</p>
            <p className="font-medium text-foreground">{formatLatency(chart.p95)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Range</p>
            <p className="font-medium text-foreground">
              {formatLatency(chart.rawMin)} – {formatLatency(chart.rawMax)}
            </p>
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl border border-border/30 bg-secondary/5">
        {active ? (
          <div className="absolute top-3 right-3 z-10 rounded-lg border border-border/40 bg-card/95 px-3 py-2 text-xs shadow-sm backdrop-blur-sm">
            <p className="font-medium tabular-nums text-foreground">
              {formatLatency(active.latencyMs)}
            </p>
            <p className="text-muted-foreground mt-0.5">
              {active.up ? "Healthy" : "Failed"}
              {active.checkedAt ? ` · ${new Date(active.checkedAt).toLocaleString()}` : ""}
            </p>
          </div>
        ) : null}

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-52"
          role="img"
          aria-label="Response time over recent checks"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {chart.yTicks.map((tick) => (
            <g key={tick.id}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={tick.y}
                y2={tick.y}
                stroke="currentColor"
                className="text-border/40"
                strokeDasharray="3 5"
              />
              <text
                x={PAD.left - 10}
                y={tick.y + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="10"
              >
                {formatTickMs(tick.value)}
              </text>
            </g>
          ))}

          {/* Average reference line */}
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={chart.avgY}
            y2={chart.avgY}
            stroke="rgb(251, 191, 36)"
            strokeOpacity="0.55"
            strokeDasharray="5 4"
            strokeWidth="1.25"
          />
          <text
            x={WIDTH - PAD.right}
            y={chart.avgY - 6}
            textAnchor="end"
            className="fill-amber-400/90"
            fontSize="10"
          >
            avg
          </text>

          <path d={chart.area} fill={`url(#${gradId})`} />
          <path
            d={chart.line}
            fill="none"
            stroke="rgb(52, 211, 153)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chart.coords.map((p, i) => (
            <g key={p.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={18}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={hover === i ? 5 : 3.25}
                className={cn(
                  p.up ? "fill-emerald-400" : "fill-rose-400",
                  "stroke-card pointer-events-none"
                )}
                strokeWidth={2}
              />
            </g>
          ))}

          {chart.xLabels.map((label) =>
            label.label ? (
              <text
                key={label.id}
                x={label.x}
                y={HEIGHT - 12}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize="10"
              >
                {label.label}
              </text>
            ) : null
          )}
        </svg>
      </div>
    </div>
  );
}
