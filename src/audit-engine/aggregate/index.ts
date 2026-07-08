import type { AuditEngineResult, ModuleResult, ScanContext } from "../core/types";

function pickScore(modules: ModuleResult[], ids: string[], fallback = 0): number {
  const scores = modules
    .filter((m) => ids.includes(m.moduleId) && m.score != null)
    .map((m) => m.score as number);
  if (scores.length === 0) return fallback;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function aggregateAuditResults(ctx: ScanContext): AuditEngineResult {
  const modules = ctx.modules;

  const seoScore = pickScore(modules, ["seo", "structured-data", "html-validation"]);
  const securityScore = pickScore(modules, ["security", "cookies"]);
  const performanceScore =
    ctx.lab?.score ?? pickScore(modules, ["performance", "assets"], 0);
  const staticA11y = pickScore(modules, ["accessibility-static"], 100);
  const axeScore = pickScore(modules, ["accessibility-axe"], staticA11y);
  const accessibilityScore = Math.round((staticA11y + axeScore) / 2);

  // Blend LH best-practices lightly into security when available
  const blendedSecurity =
    ctx.lab && ctx.lab.bestPracticesScore > 0
      ? Math.round((securityScore + ctx.lab.bestPracticesScore) / 2)
      : securityScore;

  const overallScore = Math.round(
    (performanceScore + accessibilityScore + seoScore + blendedSecurity) / 4
  );

  const issues = modules.flatMap((m) =>
    m.findings.map(({ moduleId: _moduleId, ...rest }) => rest)
  );

  // Attach lab BP findings already in performance module findings

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
    issues,
    moduleResults: modules,
  };
}
