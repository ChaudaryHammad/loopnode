import type { Browser, Page } from "puppeteer";
import type { ScanIssueInput } from "./types";
import { lighthouseSubstepMessage } from "./audit-phases";
import { ensureLighthouseLocales } from "./lighthouse-locales";

export interface PerformanceAuditResult {
  score: number;
  bestPracticesScore: number;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
  issues: ScanIssueInput[];
  engine: "lighthouse" | "fallback";
}

type LighthouseAudit = {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  numericValue?: number;
  details?: {
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
  };
};

function roundMetric(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function auditNumericValue(audits: Record<string, LighthouseAudit>, id: string): number | null {
  return roundMetric(audits[id]?.numericValue);
}

function pushMetricIssue(
  issues: ScanIssueInput[],
  title: string,
  severity: ScanIssueInput["severity"],
  description: string,
  recommendation: string,
  metadata: Record<string, unknown>
) {
  issues.push({
    category: "PERFORMANCE",
    severity,
    title,
    description,
    recommendation,
    metadata,
  });
}

function severityFromScore(score: number): ScanIssueInput["severity"] {
  if (score < 0.5) return "MAJOR";
  if (score < 0.75) return "MINOR";
  return "INFO";
}

function severityFromSavings(ms: number, bytes: number): ScanIssueInput["severity"] {
  if (ms >= 1000 || bytes >= 500_000) return "MAJOR";
  if (ms >= 300 || bytes >= 100_000) return "MINOR";
  return "INFO";
}

function shouldIncludeAudit(audit: LighthouseAudit): boolean {
  if (!audit.id || !audit.title) return false;
  if (audit.scoreDisplayMode === "notApplicable" || audit.scoreDisplayMode === "manual") {
    return false;
  }

  if (audit.score !== null && audit.score !== undefined) {
    return audit.score < 0.9;
  }

  if (audit.scoreDisplayMode === "metricSavings") {
    const savingsMs = audit.numericValue ?? audit.details?.overallSavingsMs ?? 0;
    const savingsBytes = audit.details?.overallSavingsBytes ?? 0;
    return savingsMs > 0 || savingsBytes > 0;
  }

  if (audit.scoreDisplayMode === "binary") {
    return audit.score != null && audit.score < 1;
  }

  return false;
}

function buildIssueDescription(audit: LighthouseAudit): string {
  if (audit.displayValue) {
    return audit.description
      ? `${audit.description} (${audit.displayValue})`
      : audit.displayValue;
  }
  return audit.description ?? audit.title ?? "Lighthouse flagged this item.";
}

function issuesFromLighthouseAudits(
  audits: Record<string, LighthouseAudit>,
  auditIds: string[],
  issueCategory: ScanIssueInput["category"],
  url: string
): ScanIssueInput[] {
  const issues: ScanIssueInput[] = [];

  for (const auditId of auditIds) {
    const audit = audits[auditId];
    if (!audit || !shouldIncludeAudit(audit)) continue;

    let severity: ScanIssueInput["severity"] = "INFO";

    if (audit.score !== null && audit.score !== undefined) {
      severity = severityFromScore(audit.score);
    } else if (audit.scoreDisplayMode === "metricSavings") {
      const savingsMs = audit.numericValue ?? audit.details?.overallSavingsMs ?? 0;
      const savingsBytes = audit.details?.overallSavingsBytes ?? 0;
      severity = severityFromSavings(savingsMs, savingsBytes);
    }

    issues.push({
      category: issueCategory,
      severity,
      title: audit.title ?? audit.id ?? "Lighthouse audit",
      description: buildIssueDescription(audit),
      recommendation:
        audit.description ??
        "Review this item in Chrome DevTools Lighthouse report for remediation steps.",
      metadata: {
        lighthouseAuditId: audit.id,
        score: audit.score ?? null,
        scoreDisplayMode: audit.scoreDisplayMode ?? null,
        displayValue: audit.displayValue ?? null,
        numericValue: audit.numericValue ?? null,
        url,
      },
    });
  }

  return issues;
}

function getBrowserPort(browser: Browser): number {
  const endpoint = browser.wsEndpoint();
  return Number(new URL(endpoint).port);
}

async function importLighthouseWithTimeout(timeoutMs: number) {
  console.log("[lighthouse] Loading module…");
  const mod = await Promise.race([
    import("lighthouse"),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Lighthouse module import timed out after ${timeoutMs / 1000}s`)),
        timeoutMs
      );
    }),
  ]);
  console.log("[lighthouse] Module loaded");
  return mod.default;
}

export type LighthousePreset = "fast" | "accurate";

export async function runLighthousePerformanceAudit(
  browser: Browser,
  _page: Page,
  url: string,
  onSubstep?: (message: string) => Promise<void>,
  preset: LighthousePreset = "fast"
): Promise<PerformanceAuditResult> {
  const port = getBrowserPort(browser);

  const logLighthouse = async (message: string) => {
    console.log(`[lighthouse] ${message}`);
    await onSubstep?.(lighthouseSubstepMessage(message));
  };

  await logLighthouse("Initializing Lighthouse");

  ensureLighthouseLocales();
  const lighthouse = await importLighthouseWithTimeout(45000);

  await logLighthouse(
    preset === "accurate"
      ? "Running accurate mobile Lighthouse lab…"
      : "Running fast Lighthouse lab…"
  );
  console.log(`[lighthouse] Starting audit for ${url} on port ${port} (${preset})`);

  // Lighthouse opens its own tab via CDP — do not attach request interception.
  const mobile = preset === "accurate";
  const runnerResult = await lighthouse(
    url,
    {
      port,
      output: "json",
      logLevel: "error",
      // Performance only — security/HTML modules cover best-practices overlap (saves time).
      onlyCategories: ["performance"],
      maxWaitForLoad: mobile ? 45000 : 30000,
      maxWaitForFcp: mobile ? 30000 : 20000,
      networkQuietThresholdMs: mobile ? 3000 : 1000,
      cpuQuietThresholdMs: mobile ? 3000 : 1000,
      formFactor: mobile ? "mobile" : "desktop",
      screenEmulation: mobile
        ? {
            mobile: true,
            width: 412,
            height: 823,
            deviceScaleFactor: 2.625,
            disabled: false,
          }
        : {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false,
          },
      throttling: mobile
        ? {
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 4,
          }
        : {
            rttMs: 40,
            throughputKbps: 10_240,
            cpuSlowdownMultiplier: 1,
          },
    },
    undefined
  );

  console.log("[lighthouse] Run finished");

  const lhr = runnerResult?.lhr;
  if (!lhr?.categories?.performance) {
    throw new Error("Lighthouse did not return performance results.");
  }

  await logLighthouse("Analyzing metrics and opportunities");

  const audits = lhr.audits as Record<string, LighthouseAudit>;
  const performanceAuditIds = lhr.categories.performance.auditRefs.map((ref) => ref.id);
  const bestPracticesAuditIds =
    lhr.categories["best-practices"]?.auditRefs.map((ref) => ref.id) ?? [];

  const score = clampScore((lhr.categories.performance.score ?? 0) * 100);
  const bestPracticesScore = clampScore(
    (lhr.categories["best-practices"]?.score ?? 0) * 100
  );

  const fcp = auditNumericValue(audits, "first-contentful-paint");
  const lcp = auditNumericValue(audits, "largest-contentful-paint");
  const clsRaw = audits["cumulative-layout-shift"]?.numericValue;
  const cls = clsRaw === undefined ? null : parseFloat(Number(clsRaw).toFixed(3));
  const tbt = auditNumericValue(audits, "total-blocking-time");
  const inp =
    auditNumericValue(audits, "interaction-to-next-paint") ??
    auditNumericValue(audits, "experimental-interaction-to-next-paint");

  const performanceIssues = issuesFromLighthouseAudits(
    audits,
    performanceAuditIds,
    "PERFORMANCE",
    url
  );
  const bestPracticesIssues = bestPracticesAuditIds.length
    ? issuesFromLighthouseAudits(audits, bestPracticesAuditIds, "SECURITY", url).map(
        (issue) => ({
          ...issue,
          metadata: { ...issue.metadata, lighthouseCategory: "best-practices" },
        })
      )
    : [];

  const issues = [...performanceIssues, ...bestPracticesIssues];

  if (lcp !== null && lcp > 2500) {
    const alreadyHasLcp = issues.some(
      (i) => String((i.metadata as Record<string, unknown>)?.lighthouseAuditId ?? "") === "largest-contentful-paint"
    );
    if (!alreadyHasLcp) {
      pushMetricIssue(
        issues,
        "Largest Contentful Paint needs improvement",
        lcp > 4000 ? "CRITICAL" : "MAJOR",
        `LCP was ${lcp} ms under mobile throttling.`,
        "Optimize the largest above-the-fold element — compress images, preload hero assets, reduce server latency.",
        { metric: "lcp", value: lcp, url, source: "lighthouse" }
      );
    }
  }

  return {
    score,
    bestPracticesScore,
    fcp,
    lcp,
    cls,
    inp,
    tbt,
    issues,
    engine: "lighthouse",
  };
}

export async function runFallbackPerformanceAudit(
  page: Page,
  url: string
): Promise<PerformanceAuditResult> {
  const snapshot = await page.evaluate(() => {
    const paints = performance.getEntriesByType("paint");
    const fcpEntry = paints.find((entry) => entry.name === "first-contentful-paint");
    const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
    const lcpEntry = lcpEntries.at(-1);
    const navigation = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;

    return {
      fcp: fcpEntry?.startTime ?? null,
      lcp: lcpEntry?.startTime ?? null,
      loadTime: navigation?.loadEventEnd
        ? navigation.loadEventEnd - navigation.startTime
        : null,
    };
  });

  const fcp = roundMetric(snapshot.fcp ?? snapshot.loadTime);
  const lcp = roundMetric(snapshot.lcp ?? fcp);

  let score = 100;
  const issues: ScanIssueInput[] = [];

  if (lcp !== null && lcp > 2500) {
    score -= Math.min(35, (lcp - 2500) / 100);
    pushMetricIssue(
      issues,
      "Page load appears slow (fallback measurement)",
      "MAJOR",
      `Estimated LCP was ${lcp} ms. Lighthouse could not complete; this is a simplified reading.`,
      "Retry the audit. If it keeps failing, the page may block headless browsers or heavy media.",
      { metric: "lcp", value: lcp, url, source: "fallback" }
    );
  }

  return {
    score: clampScore(score),
    bestPracticesScore: 0,
    fcp,
    lcp,
    cls: null,
    inp: null,
    tbt: null,
    issues,
    engine: "fallback",
  };
}

export async function runPerformanceAuditWithFallback(
  browser: Browser,
  page: Page,
  url: string,
  onSubstep?: (message: string) => Promise<void>,
  preset: LighthousePreset = "fast"
): Promise<PerformanceAuditResult> {
  try {
    return await runLighthousePerformanceAudit(browser, page, url, onSubstep, preset);
  } catch (error) {
    console.warn("[audit] Lighthouse failed, using fallback performance metrics:", error);
    await onSubstep?.("Lighthouse could not finish — collecting fallback Web Vitals…");
    return runFallbackPerformanceAudit(page, url);
  }
}
