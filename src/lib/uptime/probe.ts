import type { KeywordMatchMode, MonitorHttpMethod } from "@prisma/client";
import { UPTIME_CHECK_TIMEOUT_MS } from "@/lib/uptime/constants";

export interface ProbeInput {
  url: string;
  method: MonitorHttpMethod;
  timeoutMs?: number;
  followRedirects?: boolean;
  expectedStatusMin: number;
  expectedStatusMax: number;
  keyword?: string | null;
  keywordMode?: KeywordMatchMode;
}

export interface ProbeResult {
  ok: boolean;
  degraded: boolean;
  httpStatus: number | null;
  latencyMs: number;
  errorMessage: string | null;
  finalUrl: string | null;
  keywordMatched: boolean | null;
  usedMethod?: MonitorHttpMethod;
  bodySnippet?: string;
}

async function executeProbe(
  input: ProbeInput,
  method: MonitorHttpMethod
): Promise<ProbeResult> {
  const timeoutMs = input.timeoutMs ?? UPTIME_CHECK_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const response = await fetch(input.url, {
      method,
      redirect: input.followRedirects === false ? "manual" : "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "HealthMeshUptime/1.0 (+https://loopnode.app)",
        Accept: "*/*",
      },
      cache: "no-store",
    });

    const latencyMs = Date.now() - started;
    const httpStatus = response.status;
    const inRange =
      httpStatus >= input.expectedStatusMin && httpStatus <= input.expectedStatusMax;

    let keywordMatched: boolean | null = null;
    const needsBody =
      input.keywordMode &&
      input.keywordMode !== "NONE" &&
      Boolean(input.keyword?.trim());

    if (needsBody && input.keyword && method === "GET") {
      const text = await response.text();
      const haystack = text.slice(0, 500_000);
      const found = haystack.includes(input.keyword);
      keywordMatched = input.keywordMode === "CONTAINS" ? found : !found;
    } else if (method === "GET") {
      try {
        await response.arrayBuffer();
      } catch {
        /* ignore */
      }
    }

    const keywordOk = keywordMatched === null ? true : keywordMatched;
    const ok = inRange && keywordOk;

    let errorMessage: string | null = null;
    if (!inRange) {
      errorMessage = `Unexpected status ${httpStatus} (expected ${input.expectedStatusMin}-${input.expectedStatusMax})`;
    } else if (!keywordOk) {
      errorMessage =
        input.keywordMode === "CONTAINS"
          ? `Keyword "${input.keyword}" not found in response`
          : `Forbidden keyword "${input.keyword}" found in response`;
    }

    return {
      ok,
      degraded: false,
      httpStatus,
      latencyMs,
      errorMessage,
      finalUrl: response.url || input.url,
      keywordMatched,
      usedMethod: method,
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? `Timed out after ${timeoutMs}ms`
          : err.message
        : "Request failed";

    return {
      ok: false,
      degraded: false,
      httpStatus: null,
      latencyMs,
      errorMessage: message,
      finalUrl: null,
      keywordMatched: null,
      usedMethod: method,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probe a URL. Many CDNs/static hosts reject HEAD with 405 — automatically
 * retry once with GET when that happens (UptimeRobot/Better Stack style).
 */
export async function probeUrl(input: ProbeInput): Promise<ProbeResult> {
  const needsBody =
    input.keywordMode &&
    input.keywordMode !== "NONE" &&
    Boolean(input.keyword?.trim());

  const primary: MonitorHttpMethod = needsBody ? "GET" : input.method;
  const first = await executeProbe(input, primary);

  if (
    primary === "HEAD" &&
    first.httpStatus === 405 &&
    !needsBody
  ) {
    return executeProbe(input, "GET");
  }

  return first;
}
