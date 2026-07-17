import type { AuditEngineResult, ModuleResult, ScanContext } from "../core/types";

function pickScore(modules: ModuleResult[], ids: string[], fallback = 0): number {
  const scores = modules
    .filter((m) => ids.includes(m.moduleId) && m.status === "completed" && m.score != null)
    .map((m) => m.score as number);
  if (scores.length === 0) return fallback;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function moduleFailureFindings(modules: ModuleResult[]) {
  // moduleFail already attaches CRITICAL findings; keep this as a no-op guard.
  return modules
    .filter((m) => m.status === "failed" && m.findings.length === 0)
    .map((m) => ({
      category: "PERFORMANCE" as const,
      severity: "CRITICAL" as const,
      title: `Audit module failed: ${m.moduleId}`,
      description: m.error ?? "Module failed without details.",
      recommendation: "Retry the audit. If it keeps failing, check target availability and browser blocks.",
      metadata: {
        version: 2,
        source: "lab-failed",
        moduleId: m.moduleId,
      },
    }));
}

export function aggregateAuditResults(ctx: ScanContext): AuditEngineResult {
  const modules = ctx.modules;

  const seoFromHttp = pickScore(modules, ["seo", "structured-data", "html-validation"]);
  const seoFromLab =
    typeof ctx.lab?.seoScore === "number" && ctx.lab.engine === "lighthouse"
      ? ctx.lab.seoScore
      : null;
  const seoScore =
    seoFromLab != null ? Math.round((seoFromHttp + seoFromLab) / 2) : seoFromHttp;

  const securityScore = pickScore(modules, ["security", "cookies"]);
  const performanceScore =
    ctx.lab?.engine === "lighthouse"
      ? ctx.lab.score
      : ctx.lab?.engine === "failed"
        ? 0
        : pickScore(modules, ["performance"], 0);

  const staticA11y = pickScore(modules, ["accessibility-static"], 100);
  const axeScore = pickScore(modules, ["accessibility-axe"], staticA11y);
  const lhA11y =
    ctx.lab?.engine === "lighthouse" && ctx.lab.accessibilityScore > 0
      ? ctx.lab.accessibilityScore
      : null;
  const accessibilityScore =
    lhA11y != null
      ? Math.round((staticA11y + axeScore + lhA11y) / 3)
      : Math.round((staticA11y + axeScore) / 2);

  const blendedSecurity =
    ctx.lab && ctx.lab.engine === "lighthouse" && ctx.lab.bestPracticesScore > 0
      ? Math.round((securityScore + ctx.lab.bestPracticesScore) / 2)
      : securityScore;

  const overallScore = Math.round(
    (performanceScore + accessibilityScore + seoScore + blendedSecurity) / 4
  );

  const issues = [
    ...modules.flatMap((m) => m.findings.map(({ moduleId: _moduleId, ...rest }) => rest)),
    ...moduleFailureFindings(modules),
  ];

  return {
    performanceScore,
    accessibilityScore,
    seoScore,
    securityScore: blendedSecurity,
    overallScore,
    fcp: ctx.lab?.fcp ?? null,
    lcp: ctx.lab?.lcp ?? null,
    cls: ctx.lab?.cls ?? null,
    inp: ctx.lab?.inp ?? null,
    tbt: ctx.lab?.tbt ?? null,
    labEngine: ctx.lab?.engine ?? (ctx.meta.enableLab ? "failed" : "skipped"),
    lighthouseReportUrl: ctx.lab?.lighthouseReportUrl ?? null,
    issues,
    moduleResults: modules,
  };
}
