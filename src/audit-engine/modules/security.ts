import { analyzeCsp } from "@/lib/security/csp-analyzer";
import type { AuditFinding, AuditModule } from "../core/types";
import { moduleFail, moduleOk, requireResponse, scoreFromFindings } from "./_helpers";

const SECURITY_HEADERS: Array<{
  key: string;
  title: string;
  description: string;
  recommendation: string;
  severity: AuditFinding["severity"];
}> = [
  {
    key: "content-security-policy",
    title: "Missing Content-Security-Policy header",
    description: "CSP helps prevent XSS by controlling which resources the browser can load.",
    recommendation: "Implement a strict Content-Security-Policy header.",
    severity: "CRITICAL",
  },
  {
    key: "strict-transport-security",
    title: "Strict-Transport-Security header missing",
    description: "HSTS tells browsers to only connect via HTTPS.",
    recommendation: "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains",
    severity: "MAJOR",
  },
  {
    key: "x-frame-options",
    title: "X-Frame-Options header not set",
    description: "Without X-Frame-Options, the site may be vulnerable to clickjacking.",
    recommendation: "Add X-Frame-Options: DENY or SAMEORIGIN.",
    severity: "MAJOR",
  },
  {
    key: "x-content-type-options",
    title: "X-Content-Type-Options header missing",
    description: "Prevents MIME-type sniffing attacks.",
    recommendation: "Add X-Content-Type-Options: nosniff.",
    severity: "MINOR",
  },
  {
    key: "referrer-policy",
    title: "Referrer-Policy header not configured",
    description: "Controls how much referrer information is sent with requests.",
    recommendation: "Set Referrer-Policy: strict-origin-when-cross-origin.",
    severity: "MINOR",
  },
  {
    key: "permissions-policy",
    title: "Permissions-Policy header not set",
    description: "Restricts access to browser features like camera and geolocation.",
    recommendation: "Add a Permissions-Policy header.",
    severity: "INFO",
  },
];

export const securityModule: AuditModule = {
  id: "security",
  label: "Security",
  async run(ctx) {
    const started = Date.now();
    try {
      const response = requireResponse(ctx);
      const findings: AuditFinding[] = [];

      if (!ctx.meta.targetUrl.startsWith("https://") && !response.finalUrl.startsWith("https://")) {
        findings.push({
          moduleId: "security",
          category: "SECURITY",
          severity: "CRITICAL",
          title: "Site not served over HTTPS",
          description: "The website URL does not use HTTPS encryption.",
          recommendation: "Enable SSL/TLS and redirect HTTP to HTTPS.",
        });
      }

      for (const header of SECURITY_HEADERS) {
        if (!response.headers[header.key]) {
          findings.push({
            moduleId: "security",
            category: "SECURITY",
            severity: header.severity,
            title: header.title,
            description: header.description,
            recommendation: header.recommendation,
            metadata: { header: header.key },
          });
        }
      }

      const cspValue = response.headers["content-security-policy"];
      if (cspValue) {
        const csp = analyzeCsp(cspValue);
        for (const finding of csp.findings) {
          findings.push({
            moduleId: "security",
            category: "SECURITY",
            severity:
              finding.severity === "critical"
                ? "CRITICAL"
                : finding.severity === "warning"
                  ? "MAJOR"
                  : "INFO",
            title: `CSP: ${finding.title}`,
            description: finding.description,
            recommendation:
              csp.recommendations.intermediate[0] ?? csp.recommendations.basic[0] ?? null,
            metadata: { header: "content-security-policy", cspGrade: csp.grade },
          });
        }
      }

      return moduleOk(
        "security",
        started,
        scoreFromFindings(findings, { CRITICAL: 25, MAJOR: 15, MINOR: 8, INFO: 3 }),
        findings
      );
    } catch (error) {
      return moduleFail("security", started, error);
    }
  },
};
