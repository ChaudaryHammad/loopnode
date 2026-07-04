/** Normalize a website URL to a stable hostname for slot tracking. */
export function normalizeWebsiteHost(rawUrl: string): string | null {
  try {
    const withProtocol = rawUrl.match(/^https?:\/\//i) ? rawUrl : `https://${rawUrl}`;
    const host = new URL(withProtocol).hostname.toLowerCase();
    if (!host) return null;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}
