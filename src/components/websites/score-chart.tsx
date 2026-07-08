"use client";

import React, { useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanHistoryPoint {
  createdAt: Date | string;
  overallScore: number | null;
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  securityScore: number | null;
  status?: string;
}

interface ScoreChartProps {
  scans: ScanHistoryPoint[];
}

const SERIES = [
  { key: "overallScore" as const, label: "Overall", color: "#818cf8", defaultOn: true },
  { key: "performanceScore" as const, label: "Performance", color: "#34d399", defaultOn: true },
  { key: "accessibilityScore" as const, label: "Accessibility", color: "#a78bfa", defaultOn: true },
  { key: "seoScore" as const, label: "SEO", color: "#fbbf24", defaultOn: true },
  { key: "securityScore" as const, label: "Security", color: "#f87171", defaultOn: true },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

const WIDTH = 1000;
const HEIGHT = 400;
const PADDING = { top: 32, right: 28, bottom: 56, left: 48 };
const CHART_W = WIDTH - PADDING.left - PADDING.right;
const CHART_H = HEIGHT - PADDING.top - PADDING.bottom;

function buildPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
    const cp2x = points[i].x - (points[i].x - points[i - 1].x) / 3;
    d += ` C ${cp1x} ${points[i - 1].y} ${cp2x} ${points[i].y} ${points[i].x} ${points[i].y}`;
  }
  return d;
}

function formatAxisDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
        —
      </span>
    );
  }

  const tone =
    delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-muted-foreground";
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : ArrowRight;

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold tabular-nums", tone)}>
      <Icon className="h-4 w-4" />
      {delta > 0 ? "+" : ""}
      {delta}
    </span>
  );
}

export function ScoreChart({ scans }: ScoreChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>(() =>
    SERIES.reduce(
      (acc, series) => {
        acc[series.key] = series.defaultOn;
        return acc;
      },
      {} as Record<SeriesKey, boolean>
    )
  );

  const completedScans = useMemo(
    () =>
      [...scans]
        .filter((scan) => scan.status === "COMPLETED" || scan.status === undefined)
        .filter(
          (scan) =>
            scan.overallScore !== null ||
            scan.performanceScore !== null ||
            scan.accessibilityScore !== null ||
            scan.seoScore !== null ||
            scan.securityScore !== null
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [scans]
  );

  if (completedScans.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Run your first scan to see score trends.
      </div>
    );
  }

  const latest = completedScans[completedScans.length - 1]!;
  const previous = completedScans.length > 1 ? completedScans[completedScans.length - 2]! : null;
  const overallDelta =
    latest.overallScore !== null && previous?.overallScore != null
      ? Math.round(latest.overallScore - previous.overallScore)
      : null;

  const xScale = (i: number) =>
    PADDING.left + (completedScans.length === 1 ? CHART_W / 2 : (i / (completedScans.length - 1)) * CHART_W);
  const yScale = (val: number) => PADDING.top + CHART_H - (val / 100) * CHART_H;
  const yTicks = [0, 25, 50, 75, 100];
  const bottomY = PADDING.top + CHART_H;

  const activeSeries = SERIES.filter((series) => visibleSeries[series.key]);

  function toggleSeries(key: SeriesKey) {
    setVisibleSeries((current) => {
      const enabledCount = Object.values(current).filter(Boolean).length;
      if (current[key] && enabledCount <= 1) return current;
      return { ...current, [key]: !current[key] };
    });
  }

  function handleHover(index: number, event: React.MouseEvent) {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHoveredIndex(index);
    setTooltipPos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  function clearHover() {
    setHoveredIndex(null);
    setTooltipPos(null);
  }

  const hoveredScan = hoveredIndex !== null ? completedScans[hoveredIndex] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-end gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Current overall
            </p>
            <p className="mt-1 text-5xl font-semibold tabular-nums leading-none text-foreground">
              {latest.overallScore ?? "—"}
            </p>
          </div>
          <div className="pb-1">
            <DeltaBadge delta={overallDelta} />
            {previous?.overallScore != null ? (
              <p className="mt-1 text-xs text-muted-foreground">
                vs {previous.overallScore} last run
              </p>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Hover any point to see all category scores for that run
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {SERIES.map((series) => {
          const on = visibleSeries[series.key];
          return (
            <button
              key={series.key}
              type="button"
              onClick={() => toggleSeries(series.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                on
                  ? "border-border/40 bg-secondary/20 text-foreground"
                  : "border-border/20 bg-transparent text-muted-foreground opacity-60"
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: on ? series.color : "currentColor" }}
              />
              {series.label}
            </button>
          );
        })}
      </div>

      <div ref={chartRef} className="relative w-full" onMouseLeave={clearHover}>
        <div className="h-[min(440px,58vw)] min-h-[320px] w-full">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            aria-label="Audit score trends by category"
          >
            {yTicks.map((v) => (
              <g key={v}>
                <line
                  x1={PADDING.left}
                  y1={yScale(v)}
                  x2={WIDTH - PADDING.right}
                  y2={yScale(v)}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                  strokeWidth={1}
                />
                <text
                  x={PADDING.left - 10}
                  y={yScale(v) + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="currentColor"
                  opacity={0.45}
                >
                  {v}
                </text>
              </g>
            ))}

            {completedScans.map((scan, i) => {
              const showLabel =
                i === 0 || i === completedScans.length - 1 || completedScans.length <= 6;
              if (!showLabel && completedScans.length > 8 && i % 2 !== 0) return null;
              return (
                <text
                  key={`label-${i}`}
                  x={xScale(i)}
                  y={HEIGHT - 18}
                  textAnchor="middle"
                  fontSize={11}
                  fill="currentColor"
                  opacity={hoveredIndex === i ? 0.9 : 0.45}
                >
                  {formatAxisDate(new Date(scan.createdAt))}
                </text>
              );
            })}

            {hoveredIndex !== null ? (
              <line
                x1={xScale(hoveredIndex)}
                y1={PADDING.top}
                x2={xScale(hoveredIndex)}
                y2={bottomY}
                stroke="currentColor"
                strokeOpacity={0.18}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ) : null}

            {activeSeries.map((series) => {
              const points = completedScans
                .map((scan, i) => {
                  const val = scan[series.key];
                  if (val === null) return null;
                  return { x: xScale(i), y: yScale(val), value: val };
                })
                .filter(Boolean) as Array<{ x: number; y: number; value: number }>;

              if (points.length < 2) return null;
              const isOverall = series.key === "overallScore";

              return (
                <g key={series.key}>
                  <path
                    d={buildPath(points)}
                    fill="none"
                    stroke={series.color}
                    strokeWidth={isOverall ? 3.5 : 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={isOverall ? 1 : 0.9}
                  />
                </g>
              );
            })}

            {completedScans.map((scan, i) => {
              const x = xScale(i);
              const hitWidth =
                completedScans.length === 1
                  ? 80
                  : Math.max(28, CHART_W / Math.max(completedScans.length - 1, 1) * 0.7);

              return (
                <rect
                  key={`hit-${i}`}
                  x={x - hitWidth / 2}
                  y={PADDING.top}
                  width={hitWidth}
                  height={CHART_H}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={(event) => handleHover(i, event)}
                  onMouseMove={(event) => handleHover(i, event)}
                />
              );
            })}

            {activeSeries.map((series) =>
              completedScans.map((scan, i) => {
                const val = scan[series.key];
                if (val === null) return null;
                const x = xScale(i);
                const y = yScale(val);
                const isHovered = hoveredIndex === i;
                const isOverall = series.key === "overallScore";

                return (
                  <circle
                    key={`${series.key}-${i}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? (isOverall ? 6 : 5) : isOverall ? 4.5 : 3.5}
                    fill={series.color}
                    stroke="var(--background, #0a0a0a)"
                    strokeWidth={isHovered ? 2 : 1.5}
                    opacity={isHovered ? 1 : 0.92}
                    pointerEvents="none"
                  />
                );
              })
            )}
          </svg>
        </div>

        {hoveredScan && tooltipPos ? (
          <div
            className="pointer-events-none absolute z-20 min-w-[210px] rounded-xl border border-border/40 bg-card/95 px-4 py-3 shadow-xl backdrop-blur-sm"
            style={{
              left: Math.min(Math.max(tooltipPos.x + 12, 8), (chartRef.current?.clientWidth ?? 0) - 220),
              top: Math.max(tooltipPos.y - 12, 8),
              transform: "translateY(-100%)",
            }}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {formatFullDate(new Date(hoveredScan.createdAt))}
            </p>
            <div className="mt-3 space-y-2">
              {SERIES.map((series) => {
                const value = hoveredScan[series.key];
                return (
                  <div key={series.key} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: series.color }}
                      />
                      <span className="text-sm text-foreground">{series.label}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {value ?? "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border/20 pt-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Category movement since last run
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SERIES.filter((s) => s.key !== "overallScore").map((series) => {
            const current = latest[series.key];
            const before = previous?.[series.key] ?? null;
            const delta =
              current !== null && before !== null ? Math.round(current - before) : null;

            return (
              <div key={series.key} className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: series.color }}
                  />
                  <p className="truncate text-sm font-medium text-foreground">{series.label}</p>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {current ?? "—"}
                  </p>
                  <DeltaBadge delta={delta} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
