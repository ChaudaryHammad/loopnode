import { analyzeCsp, type CspAnalysis } from "./csp-analyzer";

export type HeaderStatus = "good" | "weak" | "missing" | "info";

export interface SecurityHeaderCheck {
  key: string;
  label: string;
  present: boolean;
  value: string | null;
  status: HeaderStatus;
  summary: string;
  recommendation: string;
}

export interface SecurityHeaderAudit {
  https: boolean;
  reachable: boolean;
  error: string | null;
  headers: SecurityHeaderCheck[];
  csp: CspAnalysis;
  cspReportOnly: CspAnalysis | null;
}

const HEADER_DEFS: Array<{
  key: string;
  label: string;
  description: string;
  recommendation: string;
  evaluate?: (value: string) => HeaderStatus;
}> = [
  {
    key: "strict-transport-security",
    label: "Strict-Transport-Security (HSTS)",
    description: "Forces browsers to use HTTPS only, preventing downgrade attacks.",
    recommendation: "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
    evaluate: (v) => {
      const maxAge = v.match(/max-age=(\d+)/i);
      if (!maxAge || Number(maxAge[1]) < 31536000) return "weak";
      return "good";
    },
  },
  {
    key: "content-security-policy",
    label: "Content-Security-Policy",
    description: "Controls which resources the browser can load — key XSS defense.",
    recommendation: "Implement a strict CSP. See the CSP analysis below for graded guidance.",
    evaluate: () => "info",
  },
  {
    key: "x-frame-options",
    label: "X-Frame-Options",
    description: "Prevents your site from being embedded in iframes (clickjacking protection).",
    recommendation: "X-Frame-Options: DENY or SAMEORIGIN (or use CSP frame-ancestors).",
    evaluate: (v) => {
      const upper = v.toUpperCase();
      if (upper === "DENY" || upper === "SAMEORIGIN") return "good";
      return "weak";
    },
  },
  {
    key: "x-content-type-options",
    label: "X-Content-Type-Options",
    description: "Stops MIME-type sniffing that can turn uploads into executable content.",
    recommendation: "X-Content-Type-Options: nosniff",
    evaluate: (v) => (v.toLowerCase() === "nosniff" ? "good" : "weak"),
  },
  {
    key: "referrer-policy",
    label: "Referrer-Policy",
    description: "Controls how much referrer URL data is sent with requests.",
    recommendation: "Referrer-Policy: strict-origin-when-cross-origin",
    evaluate: (v) => {
      const good = ["no-referrer", "strict-origin", "strict-origin-when-cross-origin", "same-origin"];
      return good.includes(v.toLowerCase()) ? "good" : "weak";
    },
  },
  {
    key: "permissions-policy",
    label: "Permissions-Policy",
    description: "Restricts browser features like camera, microphone, and geolocation.",
    recommendation: "Permissions-Policy: camera=(), microphone=(), geolocation=()",
    evaluate: () => "good",
  },
  {
    key: "cross-origin-opener-policy",
    label: "Cross-Origin-Opener-Policy",
    description: "Isolates browsing context from cross-origin documents.",
    recommendation: "Cross-Origin-Opener-Policy: same-origin",
    evaluate: (v) => (v.toLowerCase().includes("same-origin") ? "good" : "weak"),
  },
  {
    key: "cross-origin-resource-policy",
    label: "Cross-Origin-Resource-Policy",
    description: "Blocks other origins from loading your resources.",
    recommendation: "Cross-Origin-Resource-Policy: same-origin",
    evaluate: (v) => (v.toLowerCase().includes("same-origin") ? "good" : "weak"),
  },
];

function getHeader(headers: Headers, name: string): string | null {
  return headers.get(name) ?? headers.get(name.toLowerCase());
}

export async function fetchSecurityHeaderAudit(url: string): Promise<SecurityHeaderAudit> {
  const https = url.startsWith("https://");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "HealthMesh/1.0 (+https://loopnode.dev)" },
    });
  } catch (err) {
    return {
      https,
      reachable: false,
      error: err instanceof Error ? err.message : "Could not reach site",
      headers: HEADER_DEFS.map((h) => ({
        key: h.key,
        label: h.label,
        present: false,
        value: null,
        status: "missing" as HeaderStatus,
        summary: h.description,
        recommendation: h.recommendation,
      })),
      csp: analyzeCsp(null),
      cspReportOnly: null,
    };
  }

  const cspValue = getHeader(response.headers, "content-security-policy");
  const cspRoValue = getHeader(response.headers, "content-security-policy-report-only");

  const headers: SecurityHeaderCheck[] = HEADER_DEFS.map((def) => {
    const value = getHeader(response.headers, def.key);
    const present = Boolean(value);
    let status: HeaderStatus = present ? "good" : "missing";

    if (present && value && def.evaluate) {
      status = def.evaluate(value);
    } else if (!present && def.key !== "content-security-policy") {
      status = def.key === "permissions-policy" || def.key.startsWith("cross-origin")
        ? "info"
        : "missing";
    }

    if (def.key === "content-security-policy") {
      status = present ? "info" : "missing";
    }

    return {
      key: def.key,
      label: def.label,
      present,
      value,
      status,
      summary: def.description,
      recommendation: def.recommendation,
    };
  });

  if (!https) {
    headers.unshift({
      key: "https",
      label: "HTTPS",
      present: false,
      value: null,
      status: "missing",
      summary: "Site is not served over HTTPS — traffic can be intercepted.",
      recommendation: "Enable TLS and redirect all HTTP traffic to HTTPS.",
    });
  } else {
    headers.unshift({
      key: "https",
      label: "HTTPS",
      present: true,
      value: "enabled",
      status: "good",
      summary: "Site is served over encrypted HTTPS.",
      recommendation: "Keep certificates renewed and enforce HSTS.",
    });
  }

  return {
    https,
    reachable: true,
    error: null,
    headers,
    csp: analyzeCsp(cspValue),
    cspReportOnly: cspRoValue ? analyzeCsp(cspRoValue, true) : null,
  };
}
