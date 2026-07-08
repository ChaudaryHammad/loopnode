import type { AuditFinding, AuditModule } from "../core/types";
import { moduleFail, moduleOk, requireResponse, scoreFromFindings } from "./_helpers";

function parseSetCookieFlags(raw: string) {
  const parts = raw.split(";").map((p) => p.trim().toLowerCase());
  return {
    secure: parts.some((p) => p === "secure"),
    httpOnly: parts.some((p) => p === "httponly"),
    sameSite: parts.find((p) => p.startsWith("samesite=")) ?? null,
  };
}

export const cookiesModule: AuditModule = {
  id: "cookies",
  label: "Cookies",
  async run(ctx) {
    const started = Date.now();
    try {
      const response = requireResponse(ctx);
      const findings: AuditFinding[] = [];
      const setCookie = response.headers["set-cookie"] ?? "";

      const cookies = setCookie
        ? setCookie.split(/,(?=[^;]+?=)/).map((c) => c.trim()).filter(Boolean)
        : [];

      for (const cookie of cookies.slice(0, 20)) {
        const flags = parseSetCookieFlags(cookie);
        const name = cookie.split("=")[0] ?? "cookie";
        if (!flags.secure) {
          findings.push({
            moduleId: "cookies",
            category: "SECURITY",
            severity: "MAJOR",
            title: `Cookie "${name}" missing Secure flag`,
            description: "Cookies without Secure may be sent over HTTP.",
            recommendation: "Add the Secure attribute to session and auth cookies.",
            metadata: { cookie: name },
          });
        }
        if (!flags.httpOnly) {
          findings.push({
            moduleId: "cookies",
            category: "SECURITY",
            severity: "MINOR",
            title: `Cookie "${name}" missing HttpOnly flag`,
            description: "Without HttpOnly, JavaScript can read the cookie (XSS risk).",
            recommendation: "Add HttpOnly to cookies that do not need JS access.",
            metadata: { cookie: name },
          });
        }
        if (!flags.sameSite) {
          findings.push({
            moduleId: "cookies",
            category: "SECURITY",
            severity: "INFO",
            title: `Cookie "${name}" missing SameSite`,
            description: "SameSite helps mitigate CSRF.",
            recommendation: "Set SameSite=Lax or Strict where appropriate.",
            metadata: { cookie: name },
          });
        }
      }

      return moduleOk("cookies", started, scoreFromFindings(findings), findings, {
        cookieCount: cookies.length,
      });
    } catch (error) {
      return moduleFail("cookies", started, error);
    }
  },
};
