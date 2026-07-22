import type { ScanIssueInput } from "./types";
import { analyzeCsp } from "@/lib/security/csp-analyzer";

const SECURITY_HEADERS: Array<{
  key: string;
  title: string;
  description: string;
  recommendation: string;
  severity: ScanIssueInput["severity"];
}> = [
  {
    key: "content-security-policy",
    title: "Missing Content-Security-Policy header",
    description:
      "CSP helps prevent XSS attacks by controlling which resources the browser can load.",
    recommendation: "Implement a strict Content-Security-Policy header on your server.",
    severity: "CRITICAL",
  },
  {
    key: "strict-transport-security",
    title: "Strict-Transport-Security header missing",
    description:
      "HSTS tells browsers to only connect via HTTPS, protecting against downgrade attacks.",
    recommendation:
      "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains",
    severity: "MAJOR",
  },
  {
    key: "x-frame-options",
    title: "X-Frame-Options header not set",
    description:
      "Without X-Frame-Options, your site may be vulnerable to clickjacking in iframes.",
    recommendation: "Add X-Frame-Options: DENY or SAMEORIGIN.",
    severity: "MAJOR",
  },
  {
    key: "x-content-type-options",
    title: "X-Content-Type-Options header missing",
    description:
      "This header prevents MIME-type sniffing attacks.",
    recommendation: "Add X-Content-Type-Options: nosniff.",
    severity: "MINOR",
  },
  {
    key: "referrer-policy",
    title: "Referrer-Policy header not configured",
    description:
      "Controls how much referrer information is sent with requests.",
    recommendation: "Set Referrer-Policy: strict-origin-when-cross-origin.",
    severity: "MINOR",
  },
  {
    key: "permissions-policy",
    title: "Permissions-Policy header not set",
    description:
      "Restricts access to browser features like camera, microphone, and geolocation.",
    recommendation: "Add a Permissions-Policy header to limit browser API access.",
    severity: "INFO",
  },
];

function getHeader(headers: Headers, name: string): string | null {
  return headers.get(name) ?? headers.get(name.toLowerCase());
}

export async function runSecurityAudit(
  url: string
): Promise<{ score: number; issues: ScanIssueInput[] }> {
  const issues: ScanIssueInput[] = [];

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "HealthMesh/1.0 (+https://loopnode.dev)" },
    });
  } catch (err) {
    issues.push({
      category: "SECURITY",
      severity: "CRITICAL",
      title: "Site unreachable for security audit",
      description: err instanceof Error ? err.message : "Network error",
      recommendation: "Ensure the URL is publicly accessible over HTTPS.",
    });
    return { score: 0, issues };
  }

  if (!url.startsWith("https://")) {
    issues.push({
      category: "SECURITY",
      severity: "CRITICAL",
      title: "Site not served over HTTPS",
      description: "The website URL does not use HTTPS encryption.",
      recommendation: "Enable SSL/TLS and redirect HTTP to HTTPS.",
    });
  }

  for (const header of SECURITY_HEADERS) {
    const value = getHeader(response.headers, header.key);
    if (!value) {
      issues.push({
        category: "SECURITY",
        severity: header.severity,
        title: header.title,
        description: header.description,
        recommendation: header.recommendation,
        metadata: { header: header.key },
      });
    }
  }

  const cspValue = getHeader(response.headers, "content-security-policy");
  if (cspValue) {
    const csp = analyzeCsp(cspValue);
    for (const finding of csp.findings) {
      const severity =
        finding.severity === "critical"
          ? "CRITICAL"
          : finding.severity === "warning"
            ? "MAJOR"
            : "INFO";
      issues.push({
        category: "SECURITY",
        severity,
        title: `CSP: ${finding.title}`,
        description: finding.description,
        recommendation: csp.recommendations.intermediate[0] ?? csp.recommendations.basic[0],
        metadata: { header: "content-security-policy", cspGrade: csp.grade, cspScore: csp.score },
      });
    }
  }

  const penalty = issues.reduce((sum, i) => {
    const w = { CRITICAL: 25, MAJOR: 15, MINOR: 8, INFO: 3 };
    return sum + w[i.severity];
  }, 0);

  return { score: Math.max(0, Math.round(100 - penalty)), issues };
}
