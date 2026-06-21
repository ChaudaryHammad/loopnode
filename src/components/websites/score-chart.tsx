"use client";

import React from "react";

interface ScanHistoryPoint {
  createdAt: Date | string;
  overallScore: number | null;
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  securityScore: number | null;
}

interface ScoreChartProps {
  scans: ScanHistoryPoint[];
}

const SERIES = [
  { key: "overallScore" as const, label: "Overall", color: "#818cf8" },
  { key: "performanceScore" as const, label: "Performance", color: "#34d399" },
  { key: "accessibilityScore" as const, label: "Accessibility", color: "#a78bfa" },
  { key: "seoScore" as const, label: "SEO", color: "#fbbf24" },
  { key: "securityScore" as const, label: "Security", color: "#f87171" },
];

const WIDTH = 680;
const HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 40, left: 40 };
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

function buildAreaPath(points: Array<{ x: number; y: number }>, bottomY: number): string {
  if (points.length < 2) return "";
  const line = buildPath(points);
  return `${line} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
}

export function ScoreChart({ scans }: ScoreChartProps) {
  if (scans.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Run your first scan to see score trends.
      </div>
    );
  }

  // Reverse so oldest is left
  const ordered = [...scans].reverse();

  const xScale = (i: number) =>
    PADDING.left + (ordered.length === 1 ? CHART_W / 2 : (i / (ordered.length - 1)) * CHART_W);
  const yScale = (val: number) =>
    PADDING.top + CHART_H - (val / 100) * CHART_H;

  const yLines = [0, 25, 50, 75, 100];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ minWidth: 320 }}
        aria-label="Score trend chart"
      >
        <defs>
          {SERIES.map((s) => (
            <linearGradient
              key={s.key}
              id={`grad-${s.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={s.color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {/* Y-axis grid lines */}
        {yLines.map((v) => (
          <g key={v}>
            <line
              x1={PADDING.left}
              y1={yScale(v)}
              x2={WIDTH - PADDING.right}
              y2={yScale(v)}
              stroke="currentColor"
              strokeOpacity={0.06}
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 6}
              y={yScale(v) + 4}
              textAnchor="end"
              fontSize={9}
              fill="currentColor"
              opacity={0.4}
            >
              {v}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {ordered.map((scan, i) => {
          const date = new Date(scan.createdAt);
          const label = `${date.getMonth() + 1}/${date.getDate()}`;
          return (
            <text
              key={i}
              x={xScale(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              opacity={0.4}
            >
              {label}
            </text>
          );
        })}

        {/* Series: area + line + dots */}
        {SERIES.map((s) => {
          const points = ordered
            .map((scan, i) => {
              const val = scan[s.key];
              if (val === null) return null;
              return { x: xScale(i), y: yScale(val) };
            })
            .filter(Boolean) as Array<{ x: number; y: number }>;

          if (points.length === 0) return null;

          const bottomY = PADDING.top + CHART_H;

          return (
            <g key={s.key}>
              {/* Area fill */}
              <path
                d={buildAreaPath(points, bottomY)}
                fill={`url(#grad-${s.key})`}
              />
              {/* Line */}
              <path
                d={buildPath(points)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
              {/* Dots */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={3}
                  fill={s.color}
                  opacity={0.9}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 px-1">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[10px] font-medium text-muted-foreground">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
