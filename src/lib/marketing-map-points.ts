import type { WorldLocationPoint } from "@/lib/world-locations";

/** Slight stable jitter so demo pins are not perfectly stacked on city centers. */
function jitter(id: string, lat: number, lng: number): { lat: number; lng: number } {
  let hash = 0;
  for (const char of id) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }
  const latOffset = ((hash % 100) - 50) / 280;
  const lngOffset = (((hash >> 3) % 100) - 50) / 280;
  return { lat: lat + latOffset, lng: lng + lngOffset };
}

const US_STATE_POINTS: Array<{ id: string; lat: number; lng: number }> = [
  { id: "us-ca", lat: 37.7749, lng: -122.4194 },
  { id: "us-tx", lat: 30.2672, lng: -97.7431 },
  { id: "us-ny", lat: 40.7128, lng: -74.006 },
  { id: "us-fl", lat: 25.7617, lng: -80.1918 },
];

const INTERNATIONAL_POINTS: Array<{ id: string; lat: number; lng: number }> = [
  { id: "intl-gb", lat: 51.5074, lng: -0.1278 },
  { id: "intl-de", lat: 52.52, lng: 13.405 },
  { id: "intl-ca", lat: 43.6532, lng: -79.3832 },
  { id: "intl-au", lat: -33.8688, lng: 151.2093 },
  { id: "intl-in", lat: 19.076, lng: 72.8777 },
  { id: "intl-jp", lat: 35.6762, lng: 139.6503 },
];

function toPoints(entries: Array<{ id: string; lat: number; lng: number }>): WorldLocationPoint[] {
  return entries.map((entry) => {
    const coords = jitter(entry.id, entry.lat, entry.lng);
    return {
      id: entry.id,
      lat: coords.lat,
      lng: coords.lng,
    };
  });
}

/** Decorative map pins for the marketing homepage — not real user data. */
export function getMarketingMapPoints(): WorldLocationPoint[] {
  return [...toPoints(US_STATE_POINTS), ...toPoints(INTERNATIONAL_POINTS)];
}
