"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type UserLocationPoint = {
  id: string;
  name: string | null;
  email: string;
  signupCountry: string | null;
  signupCity: string | null;
  signupLat: number;
  signupLng: number;
  createdAt: Date | string;
};

function project(lat: number, lng: number, width: number, height: number) {
  return {
    x: ((lng + 180) / 360) * width,
    y: ((90 - lat) / 180) * height,
  };
}

export function AdminUserLocationMap({ points }: { points: UserLocationPoint[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const width = 720;
  const height = 340;
  const pad = 12;

  const projected = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        ...project(point.signupLat, point.signupLng, width, height),
      })),
    [points, width, height]
  );

  const countryCount = useMemo(() => {
    const countries = new Set(
      points.map((point) => point.signupCountry).filter(Boolean) as string[]
    );
    return countries.size;
  }, [points]);

  const hovered = projected.find((point) => point.id === hoveredId) ?? null;

  if (points.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-10 text-center">
        No signup locations recorded yet. Locations are captured from IP when users register.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{points.length}</p>
          <p className="text-xs text-muted-foreground">Users mapped</p>
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{countryCount}</p>
          <p className="text-xs text-muted-foreground">Countries</p>
        </div>
        {hovered ? (
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {hovered.name ?? hovered.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {[hovered.signupCity, hovered.signupCountry].filter(Boolean).join(", ") ||
                "Unknown location"}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground self-end pb-0.5">
            Hover a dot for user details
          </p>
        )}
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-border/25 bg-secondary/10">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[280px] h-auto"
          role="img"
          aria-label="Map of user signup locations"
        >
          <defs>
            <pattern id="userMapGrid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.06}
              />
            </pattern>
            <radialGradient id="userMapGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(56 189 248)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="rgb(56 189 248)" stopOpacity="0.15" />
            </radialGradient>
          </defs>

          <rect width={width} height={height} fill="url(#userMapGrid)" />

          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              x2={width}
              y1={height * ratio}
              y2={height * ratio}
              stroke="currentColor"
              strokeOpacity={0.05}
            />
          ))}

          {projected.map((point) => {
            const isHovered = hoveredId === point.id;
            const x = Math.min(Math.max(point.x, pad), width - pad);
            const y = Math.min(Math.max(point.y, pad), height - pad);

            return (
              <g
                key={point.id}
                onMouseEnter={() => setHoveredId(point.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <circle cx={x} cy={y} r={14} fill="transparent" className="cursor-default" />
                {isHovered ? (
                  <circle cx={x} cy={y} r={10} fill="url(#userMapGlow)" />
                ) : null}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5 : 3.5}
                  className={cn(
                    "fill-sky-400 stroke-background transition-all",
                    isHovered && "fill-sky-300"
                  )}
                  strokeWidth={2}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
