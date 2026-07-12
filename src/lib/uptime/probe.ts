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
  bodySnippet?: string;
}

export async function probeUrl(input: ProbeInput): Promise<ProbeResult> {
  const timeoutMs = input.timeoutMs ?? UPTIME_CHECK_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  try {
    const needsBody =
      input.keywordMode &&
      input.keywordMode !== "NONE" &&
      Boolean(input.keyword?.trim());

    const method = needsBody ? "GET" : input.method;

    const response = await fetch(input.url, {
      method,
      redirect: input.followRedirects === false ? "manual" : "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "LoopNodeUptime/1.0 (+https://loopnode.app)",
        Accept: "*/*",
      },
      cache: "no-store",
    });

    const latencyMs = Date.now() - started;
    const httpStatus = response.status;
    const inRange =
      httpStatus >= input.expectedStatusMin && httpStatus <= input.expectedStatusMax;

    let keywordMatched: boolean | null = null;
    if (needsBody && input.keyword) {
      const text = await response.text();
      const haystack = text.slice(0, 500_000);
      const found = haystack.includes(input.keyword);
      keywordMatched = input.keywordMode === "CONTAINS" ? found : !found;
    } else {
      // Drain body for GET without keyword to free the connection
      if (method === "GET") {
        try {
          await response.arrayBuffer();
        } catch {
          /* ignore */
        }
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
    };
  } finally {
    clearTimeout(timer);
  }
}
