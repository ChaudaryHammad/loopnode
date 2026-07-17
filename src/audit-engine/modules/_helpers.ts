import type { AuditFinding, ModuleResult, ScanContext } from "../core/types";

export function moduleOk(
  moduleId: string,
  started: number,
  score: number | null,
  findings: AuditFinding[],
  metrics?: ModuleResult["metrics"]
): ModuleResult {
  return {
    moduleId,
    status: "completed",
    score,
    findings,
    metrics,
    durationMs: Date.now() - started,
  };
}

export function moduleFail(moduleId: string, started: number, error: unknown): ModuleResult {
  const message = error instanceof Error ? error.message : "Module failed";
  return {
    moduleId,
    status: "failed",
    score: null,
    findings: [
      {
        moduleId,
        category: moduleId.includes("accessibility")
          ? "ACCESSIBILITY"
          : moduleId.includes("seo")
            ? "SEO"
            : moduleId.includes("security") || moduleId.includes("cookie")
              ? "SECURITY"
              : "PERFORMANCE",
        severity: "CRITICAL",
        title: `Audit module failed: ${moduleId}`,
        description: message,
        recommendation:
          "Retry the audit. If it keeps failing, check whether the page blocks scanners or returns errors.",
        metadata: {
          version: 2,
          source: "lab-failed",
          moduleId,
        },
      },
    ],
    durationMs: Date.now() - started,
    error: message,
  };
}

export function scoreFromFindings(
  findings: AuditFinding[],
  weights: Record<AuditFinding["severity"], number> = {
    CRITICAL: 20,
    MAJOR: 12,
    MINOR: 5,
    INFO: 2,
  }
): number {
  const penalty = findings.reduce((sum, f) => sum + (weights[f.severity] ?? 2), 0);
  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}

export function requireDom(ctx: ScanContext) {
  if (!ctx.dom) throw new Error("DomArtifact missing — collect must run first");
  return ctx.dom;
}

export function requireResponse(ctx: ScanContext) {
  if (!ctx.response) throw new Error("ResponseArtifact missing — collect must run first");
  return ctx.response;
}
