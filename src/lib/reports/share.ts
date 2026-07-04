import { randomBytes } from "crypto";
import { env } from "@/lib/env";

export function getReportShareUrl(shareToken: string) {
  const base = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/share/report/${shareToken}`;
}

export function createShareToken() {
  return randomBytes(24).toString("base64url");
}
