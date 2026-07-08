const USER_AGENT = "LoopNode-LinkChecker/2.0 (+https://loopnode.dev)";

export async function fetchPageHtml(
  pageUrl: string,
  timeoutMs: number
): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
    });
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("text/html")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function checkLink(
  href: string,
  timeoutMs: number
): Promise<{ ok: boolean; statusCode: number | null; errorMessage: string | null }> {
  try {
    let res = await fetch(href, {
      method: "HEAD",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });

    if (res.status === 405 || res.status === 501) {
      res = await fetch(href, {
        method: "GET",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
    }

    const ok = res.status >= 200 && res.status < 400;
    return {
      ok,
      statusCode: res.status,
      errorMessage: ok ? null : `HTTP ${res.status} ${res.statusText}`,
    };
  } catch (err) {
    return {
      ok: false,
      statusCode: null,
      errorMessage: err instanceof Error ? err.message : "Request failed",
    };
  }
}

export function buildWwwFallbackUrl(href: string): string | null {
  try {
    const url = new URL(href);
    if (url.hostname.startsWith("www.")) return null;
    url.hostname = `www.${url.hostname}`;
    return url.href;
  } catch {
    return null;
  }
}

export function severityForStatus(
  statusCode: number | null
): "CRITICAL" | "MAJOR" | "MINOR" | "INFO" {
  if (statusCode === 404 || statusCode === 410) return "CRITICAL";
  if (statusCode === null) return "MAJOR";
  if (statusCode >= 500) return "MAJOR";
  return "MINOR";
}
