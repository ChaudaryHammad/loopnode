import type { AuditFinding, AuditModule, LabMetrics } from "../core/types";
import { moduleFail, moduleOk } from "../modules/_helpers";
import { launchBrowser } from "@/lib/scanner/launch-browser";
import {
  runPerformanceAuditWithFallback,
  type PerformanceAuditResult,
} from "@/lib/scanner/lighthouse-runner";
import { runAccessibilityAudit } from "@/lib/scanner/accessibility-runner";
import { assertScanRunnable } from "@/lib/scanner/audit-scan-control";

async function closeBrowserSoon(
  browser: Awaited<ReturnType<typeof launchBrowser>>
): Promise<void> {
  const closePromise = browser.close();
  const timeout = new Promise<"timeout">((resolve) => {
    setTimeout(() => resolve("timeout"), 5000);
  });
  const result = await Promise.race([closePromise, timeout]);
  if (result === "timeout") {
    browser.process()?.kill("SIGKILL");
  }
}

async function maybeUploadLhr(
  auditId: string,
  lhrJson: string | null
): Promise<string | null> {
  if (!lhrJson) return null;
  try {
    const { uploadLighthouseReport } = await import("@/lib/cloudinary");
    const uploaded = await uploadLighthouseReport(auditId, lhrJson);
    return uploaded.url;
  } catch (error) {
    console.warn("[lab] Failed to upload Lighthouse artifact:", error);
    return null;
  }
}

function toLabMetrics(
  result: PerformanceAuditResult,
  lighthouseReportUrl: string | null
): LabMetrics {
  return {
    score: result.score,
    accessibilityScore: result.accessibilityScore,
    seoScore: result.seoScore,
    bestPracticesScore: result.bestPracticesScore,
    fcp: result.fcp,
    lcp: result.lcp,
    cls: result.cls,
    inp: result.inp,
    tbt: result.tbt,
    engine: result.engine,
    failureReason: result.failureReason,
    lighthouseReportUrl,
    findings: result.issues.map((issue) => ({
      ...issue,
      moduleId: "performance",
    })),
  };
}

/**
 * Runs Performance (full Lighthouse categories) + axe in a single Chrome lifecycle.
 */
export async function runLabBundle(
  ctx: {
    auditId: string;
    targetUrl: string;
    onSubstep?: (message: string) => Promise<void>;
    device?: "desktop" | "mobile";
  },
  options: { runAxe: boolean }
): Promise<{
  performance: Awaited<ReturnType<AuditModule["run"]>>;
  accessibility: Awaited<ReturnType<AuditModule["run"]>> | null;
  lab: LabMetrics | null;
}> {
  const perfStarted = Date.now();
  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;

  try {
    await assertScanRunnable(ctx.auditId);
    await ctx.onSubstep?.("Launching secure lab browser…");
    browser = await launchBrowser();

    const device = ctx.device ?? "desktop";
    const page = await browser.newPage();
    await page.setViewport(
      device === "mobile"
        ? { width: 412, height: 823, deviceScaleFactor: 2 }
        : { width: 1350, height: 940, deviceScaleFactor: 1 }
    );

    await assertScanRunnable(ctx.auditId);
    await ctx.onSubstep?.(
      device === "mobile"
        ? "Running mobile Lighthouse on your target URL…"
        : "Running desktop Lighthouse on your target URL…"
    );

    const performance = await runPerformanceAuditWithFallback(
      browser,
      page,
      ctx.targetUrl,
      async (substep) => {
        await assertScanRunnable(ctx.auditId);
        await ctx.onSubstep?.(substep);
      },
      device
    );

    const lighthouseReportUrl = await maybeUploadLhr(ctx.auditId, performance.lhrJson);
    const lab = toLabMetrics(performance, lighthouseReportUrl);

    // Split LH findings into category-aligned module buckets for aggregation clarity.
    const perfFindings = lab.findings.filter((f) => f.category === "PERFORMANCE");
    const lhA11yFindings = lab.findings.filter((f) => f.category === "ACCESSIBILITY");
    const lhSeoFindings = lab.findings.filter((f) => f.category === "SEO");
    const lhBpFindings = lab.findings.filter((f) => f.category === "SECURITY");

    const perfResult = moduleOk(
      "performance",
      perfStarted,
      lab.engine === "lighthouse" ? lab.score : null,
      [...perfFindings, ...lhBpFindings],
      {
        engine: lab.engine,
        failureReason: lab.failureReason,
        bestPracticesScore: lab.bestPracticesScore,
        lighthouseAccessibilityScore: lab.accessibilityScore,
        lighthouseSeoScore: lab.seoScore,
        lighthouseReportUrl: lab.lighthouseReportUrl,
        fcp: lab.fcp,
        lcp: lab.lcp,
        cls: lab.cls,
        inp: lab.inp,
        tbt: lab.tbt,
      }
    );

    // Surface LH a11y + SEO as additional completed modules so scores/findings merge.
    if (lhA11yFindings.length > 0 && lab.engine === "lighthouse") {
      // Findings stay on performance module payload via lab.findings; aggregate uses lab scores.
    }
    void lhSeoFindings;

    let accessibility: Awaited<ReturnType<AuditModule["run"]>> | null = null;

    if (options.runAxe) {
      const axeStarted = Date.now();
      try {
        await assertScanRunnable(ctx.auditId);
        await ctx.onSubstep?.("Running accessibility checks in the lab browser…");

        await page.goto(ctx.targetUrl, {
          waitUntil: "domcontentloaded",
          timeout: 40000,
        });

        const axe = await runAccessibilityAudit(page);
        const findings: AuditFinding[] = [
          ...lhA11yFindings.map((f) => ({ ...f, moduleId: "accessibility-axe" })),
          ...axe.issues.map((issue) => ({
            ...issue,
            moduleId: "accessibility-axe",
          })),
        ];
        const blendedScore =
          lab.engine === "lighthouse" && lab.accessibilityScore > 0
            ? Math.round((axe.score + lab.accessibilityScore) / 2)
            : axe.score;
        accessibility = moduleOk("accessibility-axe", axeStarted, blendedScore, findings);
      } catch (error) {
        accessibility = moduleFail("accessibility-axe", axeStarted, error);
        if (lhA11yFindings.length > 0) {
          accessibility = moduleOk(
            "accessibility-axe",
            axeStarted,
            lab.accessibilityScore || null,
            lhA11yFindings.map((f) => ({ ...f, moduleId: "accessibility-axe" }))
          );
        }
      }
    } else if (lhA11yFindings.length > 0) {
      accessibility = moduleOk(
        "accessibility-axe",
        Date.now(),
        lab.accessibilityScore || null,
        lhA11yFindings.map((f) => ({ ...f, moduleId: "accessibility-axe" }))
      );
    }

    // Attach LH SEO findings onto the performance module metrics for aggregate SEO blending.
    if (lhSeoFindings.length > 0) {
      perfResult.findings.push(
        ...lhSeoFindings.map((f) => ({ ...f, moduleId: "performance" }))
      );
    }

    return { performance: perfResult, accessibility, lab };
  } catch (error) {
    return {
      performance: moduleFail("performance", perfStarted, error),
      accessibility: options.runAxe
        ? moduleFail("accessibility-axe", Date.now(), error)
        : null,
      lab: null,
    };
  } finally {
    if (browser) {
      await closeBrowserSoon(browser);
    }
  }
}

/** Placeholder modules registered for profile lookup — real work is runLabBundle. */
export const performanceModule: AuditModule = {
  id: "performance",
  label: "Performance",
  requiresLab: true,
  async run() {
    throw new Error("Performance runs via lab bundle, not standalone");
  },
};

export const accessibilityAxeModule: AuditModule = {
  id: "accessibility-axe",
  label: "Accessibility (axe)",
  requiresLab: true,
  async run() {
    throw new Error("Axe runs via lab bundle, not standalone");
  },
};
