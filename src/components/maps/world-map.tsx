"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { geoEqualEarth, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import { cn } from "@/lib/utils";
import type { WorldLocationPoint } from "@/lib/world-locations";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type MapPoint = WorldLocationPoint & {
  x: number;
  y: number;
};

type WorldMapProps = {
  points: WorldLocationPoint[];
  variant: "marketing" | "admin";
  className?: string;
  height?: number;
  onHoverChange?: (id: string | null) => void;
};

let countriesCache: FeatureCollection<Geometry> | null = null;

async function loadCountries(): Promise<FeatureCollection<Geometry>> {
  if (countriesCache) return countriesCache;

  const response = await fetch(GEO_URL);
  const world = await response.json();
  countriesCache = feature(
    world,
    world.objects.countries
  ) as unknown as FeatureCollection<Geometry>;
  return countriesCache;
}

function hashOffset(id: string, axis: "lat" | "lng"): number {
  let hash = 0;
  for (const char of `${id}-${axis}`) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }
  return ((hash % 100) - 50) / 600;
}

function toMapPoints(
  points: WorldLocationPoint[],
  project: (coords: [number, number]) => [number, number] | null
): MapPoint[] {
  const coordCounts = new Map<string, number>();

  return points.flatMap((point) => {
    const key = `${point.lat.toFixed(2)}:${point.lng.toFixed(2)}`;
    const index = coordCounts.get(key) ?? 0;
    coordCounts.set(key, index + 1);

    const lat = point.lat + hashOffset(point.id, "lat") * (index + 1);
    const lng = point.lng + hashOffset(point.id, "lng") * (index + 1);
    const projected = project([lng, lat]);
    if (!projected) return [];

    return [
      {
        ...point,
        lat,
        lng,
        x: projected[0],
        y: projected[1],
      },
    ];
  });
}

/** Teardrop map pin — tip at (0, 0). */
const PIN_PATH =
  "M0,0 C-1.6,-3.6 -4.2,-4.2 -4.2,-7.2 A 2.8,2.8 0 1 1 4.2,-7.2 C4.2,-4.2 1.6,-3.6 0,0 Z";

function LocationMarker({
  active,
  variant,
  gradientId,
  interactive,
  onEnter,
  onLeave,
}: {
  active: boolean;
  variant: "marketing" | "admin";
  gradientId: string;
  interactive: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const isMarketing = variant === "marketing";
  const scale = active ? (isMarketing ? 1.05 : 1.12) : isMarketing ? 0.82 : 0.92;
  const stroke = isMarketing ? "#6366f1" : "#0ea5e9";

  return (
    <g
      onMouseEnter={interactive ? onEnter : undefined}
      onMouseLeave={interactive ? onLeave : undefined}
      className={interactive ? "cursor-pointer" : undefined}
      transform={`scale(${scale})`}
    >
      {active ? (
        <circle cy={-7.2} r={5.5} fill="none" stroke={stroke} strokeWidth={0.8} opacity={0.45} />
      ) : null}
      <path
        d={PIN_PATH}
        fill={`url(#${gradientId})`}
        stroke="rgba(255,255,255,0.9)"
        strokeWidth={0.65}
        strokeLinejoin="round"
      />
      <circle cy={-7.2} r={1.15} fill="rgba(255,255,255,0.85)" />
      {interactive ? (
        <circle cy={-3.5} r={6} fill="transparent" />
      ) : null}
    </g>
  );
}

export function WorldMap({
  points,
  variant,
  className,
  height = 440,
  onHoverChange,
}: WorldMapProps) {
  const uid = useId().replace(/:/g, "");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [countries, setCountries] = useState<FeatureCollection<Geometry> | null>(null);

  const width = 800;
  const isMarketing = variant === "marketing";
  const interactive = !isMarketing;

  useEffect(() => {
    let active = true;
    loadCountries()
      .then((data) => {
        if (active) setCountries(data);
      })
      .catch((error) => {
        console.error("Failed to load world map:", error);
      });
    return () => {
      active = false;
    };
  }, []);

  const { countryPaths, graticulePath, mapPoints } = useMemo(() => {
    if (!countries) {
      return { countryPaths: [] as string[], graticulePath: "", mapPoints: [] as MapPoint[] };
    }

    const projection = geoEqualEarth().fitSize([width, height], countries);
    const pathGenerator = geoPath(projection);
    const project = (coords: [number, number]) => projection(coords);

    return {
      countryPaths: countries.features.map((geo) => pathGenerator(geo) ?? ""),
      graticulePath: pathGenerator(geoGraticule10()) ?? "",
      mapPoints: toMapPoints(points, project),
    };
  }, [countries, height, points, width]);

  const hovered = mapPoints.find((point) => point.id === hoveredId) ?? null;

  if (points.length === 0) return null;

  const handleHover = (id: string | null) => {
    if (!interactive) return;
    setHoveredId(id);
    onHoverChange?.(id);
  };

  const markerGradientId = `marker-gradient-${uid}`;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        isMarketing
          ? "rounded-none border-0 bg-transparent"
          : "rounded-2xl border border-border/25 bg-[#050505]",
        className
      )}
    >
      {isMarketing ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(99,102,241,0.12),transparent_70%)]"
        />
      ) : null}

      {!countries ? (
        <div
          className="flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          Loading map…
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="relative z-[1] w-full h-auto"
          role="img"
          aria-label={
            isMarketing
              ? "World map showing global community presence"
              : "World map showing user locations"
          }
        >
          <defs>
            <radialGradient id={markerGradientId} cx="35%" cy="35%" r="65%">
              <stop
                offset="0%"
                stopColor={isMarketing ? "#c7d2fe" : "#bae6fd"}
              />
              <stop
                offset="100%"
                stopColor={isMarketing ? "#6366f1" : "#0ea5e9"}
              />
            </radialGradient>
          </defs>

          <path
            d={graticulePath}
            fill="none"
            stroke="rgba(148,163,184,0.06)"
            strokeWidth={0.25}
          />

          {countryPaths.map((path, index) => (
            <path
              key={index}
              d={path}
              fill={isMarketing ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.045)"}
              stroke="rgba(148,163,184,0.14)"
              strokeWidth={0.35}
            />
          ))}

          {mapPoints.map((point) => (
            <g key={point.id} transform={`translate(${point.x}, ${point.y})`}>
              <LocationMarker
                active={hoveredId === point.id}
                variant={variant}
                gradientId={markerGradientId}
                interactive={interactive}
                onEnter={() => handleHover(point.id)}
                onLeave={() => handleHover(null)}
              />
            </g>
          ))}
        </svg>
      )}

      {!isMarketing && hovered ? (
        <div className="absolute bottom-4 left-4 z-[2] max-w-xs rounded-xl border border-border/30 bg-background/95 px-4 py-3 shadow-xl backdrop-blur-sm">
          <p className="text-sm font-semibold text-foreground truncate">
            {hovered.name ?? "Unknown user"}
          </p>
          {hovered.email ? (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{hovered.email}</p>
          ) : null}
          {hovered.label ? (
            <p className="text-xs text-muted-foreground mt-1.5">{hovered.label}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
