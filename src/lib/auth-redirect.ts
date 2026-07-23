/**
 * Prevent open redirects after OAuth / sign-in.
 * Only same-origin relative paths are allowed.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!candidate) return fallback;

  const value = candidate.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  // Block scheme-relative and protocol-smuggling forms: "/\\evil.com", "/@evil"
  if (/^\/[\t\v\f\r\n ]*\\/.test(value) || value.includes("://")) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://localhost");
    if (url.origin !== "http://localhost") return fallback;
    return `${url.pathname}${url.search}${url.hash}` || fallback;
  } catch {
    return fallback;
  }
}
