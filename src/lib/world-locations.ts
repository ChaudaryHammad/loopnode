export type WorldLocationPoint = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  name?: string | null;
  email?: string;
};

export function isValidCoordinate(lat: number | null | undefined, lng: number | null | undefined) {
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function toWorldLocationPoint(input: {
  id: string;
  lat: number | null;
  lng: number | null;
  label?: string | null;
}): WorldLocationPoint | null {
  if (!isValidCoordinate(input.lat, input.lng)) return null;
  return {
    id: input.id,
    lat: input.lat!,
    lng: input.lng!,
    label: input.label ?? undefined,
  };
}
