import { headers } from "next/headers";

function normalizeIp(raw: string | null): string | null {
  if (!raw) return null;
  const ip = raw.split(",")[0]?.trim() ?? null;
  if (!ip) return null;
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}

export async function getClientIp(): Promise<string | null> {
  const headerList = await headers();
  return (
    normalizeIp(headerList.get("cf-connecting-ip")) ??
    normalizeIp(headerList.get("x-real-ip")) ??
    normalizeIp(headerList.get("x-forwarded-for"))
  );
}

export function isPrivateOrLocalIp(ip: string): boolean {
  if (ip === "::1" || ip === "127.0.0.1" || ip === "localhost") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) {
    return true;
  }
  if (ip.startsWith("172.")) {
    const second = Number(ip.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) return true;
  return false;
}
