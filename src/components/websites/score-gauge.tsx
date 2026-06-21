"use client";

import React from "react";

interface ScoreGaugeProps {
  score: number | null;
  label: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { radius: 32, stroke: 5, svgSize: 80, fontSize: "text-lg" },
  md: { radius: 44, stroke: 7, svgSize: 110, fontSize: "text-2xl" },
  lg: { radius: 60, stroke: 9, svgSize: 150, fontSize: "text-4xl" },
};

function getScoreColor(score: number | null): string {
  if (score === null) return "#6b7280";
  if (score >= 90) return "#10b981"; // emerald-500
  if (score >= 50) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

function getTrackColor(score: number | null): string {
  if (score === null) return "rgba(107,114,128,0.15)";
  if (score >= 90) return "rgba(16,185,129,0.12)";
  if (score >= 50) return "rgba(245,158,11,0.12)";
  return "rgba(239,68,68,0.12)";
}

export function ScoreGauge({ score, label, size = "md" }: ScoreGaugeProps) {
  const { radius, stroke, svgSize, fontSize } = SIZE_MAP[size];
  const center = svgSize / 2;
  const circumference = 2 * Math.PI * radius;

  // We draw a 270° arc (¾ of the circle), starting from bottom-left
  const arcFraction = 0.75;
  const arcLen = circumference * arcFraction;
  const gap = circumference - arcLen;

  const progress = score === null ? 0 : (score / 100) * arcLen;
  const dashOffset = arcLen - progress;

  const color = getScoreColor(score);
  const trackColor = getTrackColor(score);

  // Rotation: start the arc at the bottom-left (135deg from top)
  const rotation = 135;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="drop-shadow-sm"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Track arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={stroke}
            strokeDasharray={`${arcLen} ${gap}`}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${progress} ${circumference - progress}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{
              transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)",
              filter: `drop-shadow(0 0 6px ${color}60)`,
            }}
          />
        </svg>

        {/* Score label in center */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: `rotate(-${rotation}deg)` }}
        >
          <span
            className={`${fontSize} font-extrabold tabular-nums leading-none`}
            style={{ color }}
          >
            {score ?? "—"}
          </span>
        </div>
      </div>

      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
