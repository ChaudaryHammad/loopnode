import { getClientIp, isPrivateOrLocalIp } from "@/lib/request-ip";

export type IpLocation = {
  ip: string;
  country: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
};

type IpWhoResponse = {
  success?: boolean;
  ip?: string;
  country?: string;
  country_code?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
};

export async function lookupIpLocation(ip: string): Promise<IpLocation | null> {
  if (isPrivateOrLocalIp(ip)) return null;

  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as IpWhoResponse;
    if (!data.success) return null;

    return {
      ip: data.ip ?? ip,
      country: data.country_code ?? data.country ?? null,
      city: data.city ?? null,
      lat: typeof data.latitude === "number" ? data.latitude : null,
      lng: typeof data.longitude === "number" ? data.longitude : null,
    };
  } catch (error) {
    console.error("IP geolocation lookup failed:", error);
    return null;
  }
}

export async function resolveClientLocation(): Promise<IpLocation | null> {
  const ip = await getClientIp();
  if (!ip) return null;
  return lookupIpLocation(ip);
}
