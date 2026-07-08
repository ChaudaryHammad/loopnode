import type { Browser, Page } from "puppeteer";
import type {
  PerformanceIssueKind,
  PerformanceIssueMetadata,
  PerformanceIssueOffender,
  ScanIssueInput,
} from "./types";
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
  explanation?: string;
  details?: {
    type?: string;
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
    headings?: Array<{ key?: string; text?: string; valueType?: string }>;
    items?: Array<Record<string, unknown>>;
  };
};

const PERFORMANCE_AUDIT_COPY: Record<
  string,
  {
    kind: PerformanceIssueKind;
    headline: string;
    impact: string;
    primaryAction: string;
  }
> = {
  "unused-css-rules": {
    kind: "resource-waste",
    headline: "Unused CSS is increasing download cost before the page becomes useful.",
    impact: "Extra stylesheet bytes delay render work and can slow down the first meaningful paint.",
    primaryAction: "Start with the largest stylesheet offenders and remove or defer rules not needed above the fold.",
  },
  "unused-javascript": {
    kind: "resource-waste",
    headline: "Unused JavaScript is being downloaded and parsed before users benefit from it.",
    impact: "Heavy scripts slow down interactivity and can worsen both LCP and Total Blocking Time.",
    primaryAction: "Prioritize the biggest unused script bundles and defer or split code until it is actually needed.",
  },
  "unminified-javascript": {
    kind: "resource-waste",
    headline: "JavaScript payloads are larger than they need to be.",
    impact: "Larger scripts take longer to download, parse, and execute on slower devices.",
    primaryAction: "Minify the listed scripts in production builds and confirm third-party assets are also optimized.",
  },
  "uses-optimized-images": {
    kind: "image-delivery",
    headline: "Large image payloads are slowing down the page.",
    impact: "Oversized images hurt perceived load speed and often directly increase LCP time.",
    primaryAction: "Compress or resize the largest image offenders first, especially those above the fold.",
  },
  "uses-webp-images": {
    kind: "image-delivery",
    headline: "Legacy image formats are wasting bandwidth.",
    impact: "PNG and JPEG assets can cost users megabytes more than modern formats like WebP or AVIF.",
    primaryAction: "Convert the biggest image offenders to modern formats and keep responsive sizes in place.",
  },
  "largest-contentful-paint": {
    kind: "metric",
    headline: "The page's largest visible element is appearing too late.",
    impact: "A slow LCP makes the page feel sluggish even when other assets have started loading.",
    primaryAction: "Identify the hero element and reduce the work required before it can render.",
  },
  "largest-contentful-paint-element": {
    kind: "metric",
    headline: "The element responsible for LCP needs targeted optimization.",
    impact: "When the main hero element is late, the entire page feels slow to users.",
    primaryAction: "Inspect the identified LCP element and optimize its asset size, preload strategy, and render path.",
  },
  "speed-index": {
    kind: "metric",
    headline: "Visible content is populating too slowly across the page.",
    impact: "A weak Speed Index means users wait longer before the page looks complete enough to use.",
    primaryAction: "Focus first on large render-blocking resources and the biggest above-the-fold media assets.",
  },
  "font-display": {
    kind: "font",
    headline: "Web fonts are delaying visible text.",
    impact: "Slow font rendering can leave users staring at blank text or cause visible layout changes later.",
    primaryAction: "Use font-display swap or optional on the listed fonts so text appears immediately.",
  },
  "forced-reflow": {
    kind: "layout",
    headline: "JavaScript-triggered layout recalculations are blocking smooth rendering.",
    impact: "Forced reflows can stall the main thread and make the page feel janky or slow to respond.",
    primaryAction: "Audit the listed scripts and reduce layout-thrashing reads after DOM writes.",
  },
  "uses-long-cache-ttl": {
    kind: "cache",
    headline: "Static assets are not cached long enough.",
    impact: "Short cache lifetimes force repeat visitors to re-download expensive resources.",
    primaryAction: "Increase cache lifetimes on the largest static assets, especially scripts, styles, fonts, and images.",
  },
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

function stripMarkdownLinks(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function getPerformanceIssueKind(auditId: string | undefined): PerformanceIssueKind {
  if (!auditId) return "general";
  return PERFORMANCE_AUDIT_COPY[auditId]?.kind ?? "general";
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function pickOffenderLabel(item: Record<string, unknown>): string {
  return (
    toStringValue(item.label) ??
    toStringValue(item.url) ??
    toStringValue(item.sourceURL) ??
    toStringValue(item.source) ??
    toStringValue(item.name) ??
    toStringValue(item.nodeLabel) ??
    toStringValue(item.selector) ??
    "Affected resource"
  );
}

function pickOffenderUrl(item: Record<string, unknown>): string | null {
  return (
    toStringValue(item.url) ??
    toStringValue(item.sourceURL) ??
    toStringValue(item.source) ??
    null
  );
}

function extractTopOffenders(audit: LighthouseAudit): PerformanceIssueOffender[] {
  const items = audit.details?.items ?? [];
  return items
    .map((item) => {
      const node = item.node;
      const nodeRecord = typeof node === "object" && node !== null ? (node as Record<string, unknown>) : null;

      return {
        label: pickOffenderLabel(item),
        url: pickOffenderUrl(item),
        wastedBytes:
          toNumber(item.wastedBytes) ??
          toNumber(item.totalBytes) ??
          toNumber(item.wastedKb) ??
          null,
        wastedMs:
          toNumber(item.wastedMs) ??
          toNumber(item.duration) ??
          toNumber(item.latency) ??
          null,
        transferSize: toNumber(item.transferSize),
        totalBytes: toNumber(item.totalBytes),
        snippet:
          toStringValue(nodeRecord?.snippet) ??
          toStringValue(item.nodeLabel) ??
          toStringValue(item.selector) ??
          null,
      };
    })
    .sort((a, b) => {
      const aWeight = (a.wastedBytes ?? 0) + (a.wastedMs ?? 0) * 1024;
      const bWeight = (b.wastedBytes ?? 0) + (b.wastedMs ?? 0) * 1024;
      return bWeight - aWeight;
    })
    .slice(0, 5);
}

function buildPerformanceMetadata(audit: LighthouseAudit, url: string): PerformanceIssueMetadata {
  const auditId = audit.id ?? null;
  const customCopy = auditId ? PERFORMANCE_AUDIT_COPY[auditId] : null;
  const summary = firstNonEmpty(
    customCopy?.headline,
    stripMarkdownLinks(audit.description),
    stripMarkdownLinks(audit.title),
    "Lighthouse flagged a performance issue that needs review."
  )!;
  const headings = (audit.details?.headings ?? [])
    .map((heading) => stripMarkdownLinks(heading.text))
    .filter(Boolean);

  return {
    version: 1,
    source: "lighthouse",
    lighthouseAuditId: auditId,
    lighthouseCategory: "performance",
    kind: getPerformanceIssueKind(audit.id),
    score: audit.score ?? null,
    scoreDisplayMode: audit.scoreDisplayMode ?? null,
    displayValue: stripMarkdownLinks(audit.displayValue) || null,
    numericValue: audit.numericValue ?? null,
    estimatedSavingsMs: audit.details?.overallSavingsMs ?? null,
    estimatedSavingsBytes: audit.details?.overallSavingsBytes ?? null,
    summary,
    impact: firstNonEmpty(customCopy?.impact, stripMarkdownLinks(audit.explanation)),
    primaryAction: firstNonEmpty(customCopy?.primaryAction, stripMarkdownLinks(audit.description)),
    headings,
    topOffenders: extractTopOffenders(audit),
    url,
  };
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
    const performanceMetadata = buildPerformanceMetadata(audit, url);

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
      recommendation: performanceMetadata.primaryAction ??
        "Review the main offenders and address the highest-impact resources first.",
      metadata: performanceMetadata as unknown as Record<string, unknown>,
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
          metadata: {
            ...(issue.metadata ?? {}),
            lighthouseCategory: "best-practices",
          },
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
        ({
          version: 1,
          source: "lighthouse",
          kind: "metric",
          lighthouseAuditId: "largest-contentful-paint",
          lighthouseCategory: "performance",
          score: null,
          scoreDisplayMode: "numeric",
          displayValue: `${lcp} ms`,
          numericValue: lcp,
          estimatedSavingsMs: null,
          estimatedSavingsBytes: null,
          summary: "The page's largest visible element is appearing too late.",
          impact: "A slow LCP makes the page feel sluggish even when some assets are already visible.",
          primaryAction:
            "Optimize the largest above-the-fold element first — compress images, preload hero assets, and reduce server latency.",
          headings: [],
          topOffenders: [],
          url,
        } satisfies PerformanceIssueMetadata) as unknown as Record<string, unknown>
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
      ({
        version: 1,
        source: "fallback",
        kind: "metric",
        lighthouseAuditId: "largest-contentful-paint",
        lighthouseCategory: "performance",
        score: null,
        scoreDisplayMode: "numeric",
        displayValue: `${lcp} ms`,
        numericValue: lcp,
        estimatedSavingsMs: null,
        estimatedSavingsBytes: null,
        summary: "The page appears to load slowly based on fallback performance measurements.",
        impact:
          "Fallback mode is less precise than Lighthouse, but a high LCP still suggests users are waiting too long for the page to become useful.",
        primaryAction:
          "Retry the audit for full Lighthouse detail. If it still fails, inspect the largest above-the-fold assets and heavy third-party content.",
        headings: [],
        topOffenders: [],
        url,
      } satisfies PerformanceIssueMetadata) as unknown as Record<string, unknown>
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
