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

function toLabMetrics(result: PerformanceAuditResult): LabMetrics {
  return {
    score: result.score,
    bestPracticesScore: result.bestPracticesScore,
    fcp: result.fcp,
    lcp: result.lcp,
    cls: result.cls,
    inp: result.inp,
    tbt: result.tbt,
    engine: result.engine,
    findings: result.issues.map((issue) => ({
      ...issue,
      moduleId: "performance",
    })),
  };
}

/**
 * Runs Performance (Lighthouse) + axe in a single Chrome lifecycle.
 * Returns both module results; orchestrator assigns them by id.
 */
export async function runLabBundle(
  ctx: {
    auditId: string;
    targetUrl: string;
    onSubstep?: (message: string) => Promise<void>;
    lighthousePreset?: "fast" | "accurate";
  },
  options: { runAxe: boolean }
): Promise<{ performance: Awaited<ReturnType<AuditModule["run"]>>; accessibility: Awaited<ReturnType<AuditModule["run"]>> | null; lab: LabMetrics | null }> {
  const perfStarted = Date.now();
  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;

  try {
    await assertScanRunnable(ctx.auditId);
    await ctx.onSubstep?.("Launching secure lab browser…");
    browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setViewport({ width: 412, height: 823, deviceScaleFactor: 2 });

    await assertScanRunnable(ctx.auditId);
    await ctx.onSubstep?.("Running Lighthouse on your target URL…");

    const performance = await runPerformanceAuditWithFallback(
      browser,
      page,
      ctx.targetUrl,
      async (substep) => {
        await assertScanRunnable(ctx.auditId);
        await ctx.onSubstep?.(substep);
      },
      ctx.lighthousePreset ?? "fast"
    );

    const lab = toLabMetrics(performance);
    const perfResult = moduleOk(
      "performance",
      perfStarted,
      lab.score,
      lab.findings,
      {
        engine: lab.engine,
        bestPracticesScore: lab.bestPracticesScore,
        fcp: lab.fcp,
        lcp: lab.lcp,
        cls: lab.cls,
        inp: lab.inp,
        tbt: lab.tbt,
      }
    );

    let accessibility: Awaited<ReturnType<AuditModule["run"]>> | null = null;

    if (options.runAxe) {
      const axeStarted = Date.now();
      try {
        await assertScanRunnable(ctx.auditId);
        await ctx.onSubstep?.("Running accessibility checks in the lab browser…");

        // Navigate once for axe — Lighthouse used its own tab/session.
        await page.goto(ctx.targetUrl, {
          waitUntil: "domcontentloaded",
          timeout: 40000,
        });

        const axe = await runAccessibilityAudit(page);
        const findings: AuditFinding[] = axe.issues.map((issue) => ({
          ...issue,
          moduleId: "accessibility-axe",
        }));
        accessibility = moduleOk("accessibility-axe", axeStarted, axe.score, findings);
      } catch (error) {
        accessibility = moduleFail("accessibility-axe", axeStarted, error);
      }
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
