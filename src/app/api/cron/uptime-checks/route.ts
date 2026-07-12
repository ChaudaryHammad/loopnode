import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  processDueUptimeChecks,
  pruneOldUptimeChecks,
} from "@/lib/uptime/run-check";
import {
  UPTIME_CHECK_RETENTION_DAYS,
  UPTIME_CRON_BATCH_SIZE,
} from "@/lib/uptime/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorize(request: NextRequest): boolean {
  const secret = env.CRON_SECRET?.trim();
  if (!secret) {
    // Local/dev without secret: allow. Production should always set CRON_SECRET.
    return env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  // Vercel Cron also sends this header on newer runtimes
  const cronHeader = request.headers.get("x-vercel-cron");
  if (cronHeader && header === `Bearer ${secret}`) return true;
  return header === `Bearer ${secret}`;
}

async function handle(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { processed, errors } = await processDueUptimeChecks(UPTIME_CRON_BATCH_SIZE);

  // Light prune once per hour-ish: only when minute is 0
  let pruned = 0;
  if (new Date().getMinutes() === 0) {
    pruned = await pruneOldUptimeChecks(UPTIME_CHECK_RETENTION_DAYS);
  }

  return NextResponse.json({
    ok: true,
    processed,
    errors,
    pruned,
    at: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
