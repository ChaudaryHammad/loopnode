export function normalizeUrl(raw: string, baseUrl: string): string | null {
  try {
    const resolved = new URL(raw, baseUrl);
    if (!["http:", "https:"].includes(resolved.protocol)) return null;
    resolved.hash = "";
    resolved.pathname = resolved.pathname.replace(/\.html?$/i, "");
    let normalized = resolved.href;
    if (normalized.endsWith("/") && resolved.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return null;
  }
}

export function getOrigin(url: string): string {
  return new URL(url).origin;
}

export function isSameOrigin(url: string, origin: string): boolean {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

export function isCrawlablePageUrl(url: string, origin: string): boolean {
  if (!isSameOrigin(url, origin)) return false;
  const pathname = new URL(url).pathname.toLowerCase();
  const blocked = [
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico",
    ".pdf", ".zip", ".rar", ".mp4", ".mp3", ".woff", ".woff2",
    ".css", ".js", ".json", ".xml",
  ];
  return !blocked.some((ext) => pathname.endsWith(ext));
}

export function buildElementSelector(
  tag: string,
  id?: string,
  className?: string,
  index?: number
): string {
  if (id) return `${tag}#${id}`;
  const firstClass = className?.split(/\s+/).filter(Boolean)[0];
  if (firstClass) return `${tag}.${firstClass}`;
  if (index !== undefined) return `${tag}:nth-of-type(${index + 1})`;
  return tag;
}
