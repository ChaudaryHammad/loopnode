"use client";

import React, { useMemo, useState } from "react";
import { WorldMap } from "@/components/maps/world-map";
import type { WorldLocationPoint } from "@/lib/world-locations";

export type AdminUserLocationRow = {
  id: string;
  name: string | null;
  email: string;
  signupCountry: string | null;
  signupCity: string | null;
  signupLat: number | null;
  signupLng: number | null;
  createdAt: Date | string;
};

export function AdminUserLocationMap({ users }: { users: AdminUserLocationRow[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const mappedUsers = useMemo(
    () =>
      users.filter(
        (user): user is AdminUserLocationRow & { signupLat: number; signupLng: number } =>
          user.signupLat != null && user.signupLng != null
      ),
    [users]
  );

  const points: WorldLocationPoint[] = useMemo(
    () =>
      mappedUsers.map((user) => ({
        id: user.id,
        lat: user.signupLat,
        lng: user.signupLng,
        label: [user.signupCity, user.signupCountry].filter(Boolean).join(", ") || undefined,
        name: user.name,
        email: user.email,
      })),
    [mappedUsers]
  );

  const countryCount = useMemo(() => {
    const countries = new Set(
      mappedUsers.map((user) => user.signupCountry).filter(Boolean) as string[]
    );
    return countries.size;
  }, [mappedUsers]);

  const hovered = mappedUsers.find((user) => user.id === hoveredId) ?? null;

  if (mappedUsers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-10 text-center">
        No user locations recorded yet. Locations are captured from IP on sign-up and sign-in.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{mappedUsers.length}</p>
          <p className="text-xs text-muted-foreground">Users mapped</p>
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{countryCount}</p>
          <p className="text-xs text-muted-foreground">Countries</p>
        </div>
        {hovered ? (
          <div className="min-w-0 lg:hidden">
            <p className="text-sm font-medium truncate">{hovered.name ?? hovered.email}</p>
            <p className="text-xs text-muted-foreground truncate">
              {[hovered.signupCity, hovered.signupCountry].filter(Boolean).join(", ") ||
                "Unknown location"}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground self-end pb-0.5 lg:hidden">
            Tap a marker for details
          </p>
        )}
      </div>

      <WorldMap
        points={points}
        variant="admin"
        height={420}
        onHoverChange={setHoveredId}
      />
    </div>
  );
}
