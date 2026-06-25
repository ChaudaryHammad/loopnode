import { launchBrowser } from "./launch-browser";
import { preparePerformanceMonitoring, runPerformanceAudit } from "./lighthouse-runner";
import { runAccessibilityAudit } from "./accessibility-runner";
import { runSeoAudit } from "./seo-runner";
import { runSecurityAudit } from "./security-runner";
import type { AuditResult } from "./types";

const BROWSER_CLOSE_TIMEOUT_MS = 5000;

async function withTimeout<T>(
  label: string,
  timeoutMs: number,
  task: Promise<T>,
  onTimeout?: () => void
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          onTimeout?.();
          reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function auditErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown scanner error";
}

function scannerFailureIssue(
  category: AuditResult["issues"][number]["category"],
  title: string,
  error: unknown
): AuditResult["issues"][number] {
  return {
    category,
    severity: "CRITICAL",
    title,
    description: auditErrorMessage(error),
    recommendation: "Retry the audit. If it keeps failing, check whether the page blocks headless browsers or long-running scripts.",
  };
}

function closePageSoon(page: { close: () => Promise<void> }): void {
  void page.close().catch(() => undefined);
}

async function closeBrowserWithTimeout(
  browser: Awaited<ReturnType<typeof launchBrowser>>
): Promise<void> {
  const closePromise = browser.close();
  const timeoutPromise = new Promise<"timeout">((resolve) => {
    setTimeout(() => resolve("timeout"), BROWSER_CLOSE_TIMEOUT_MS);
  });

  const result = await Promise.race([closePromise, timeoutPromise]);
  if (result === "timeout") {
    browser.process()?.kill("SIGKILL");
  }
}

export async function runFullAudit(url: string): Promise<AuditResult> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  console.log(`[audit] Starting full audit for ${normalizedUrl}`);

  const securityPromise = withTimeout(
    "Security audit",
    25000,
    runSecurityAudit(normalizedUrl)
  );

  console.log("[audit] Launching browser");
  const browser = await launchBrowser();
  console.log("[audit] Browser launched");

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await preparePerformanceMonitoring(page);
    console.log("[audit] Opening page");
    await page.goto(normalizedUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    console.log("[audit] Page loaded");

    const html = await page.content();

    console.log("[audit] Running performance audit");
    const performance = await withTimeout(
      "Performance audit",
      120000,
      runPerformanceAudit(page, normalizedUrl)
    ).catch((error) => {
      console.error("[audit] Performance audit failed", error);
      return {
        score: 0,
        fcp: null,
        lcp: null,
        cls: null,
        inp: null,
        tbt: null,
        issues: [
          scannerFailureIssue("PERFORMANCE", "Performance audit failed", error),
        ],
      };
    });
    console.log("[audit] Performance audit completed");

    const accessibilityPage = await browser.newPage();
    await accessibilityPage.setViewport({ width: 1280, height: 800 });
    await accessibilityPage.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    console.log("[audit] Running accessibility audit");
    const accessibility = await withTimeout(
      "Accessibility audit",
      45000,
      runAccessibilityAudit(accessibilityPage),
      () => closePageSoon(accessibilityPage)
    ).catch((error) => {
      console.error("[audit] Accessibility audit failed", error);
      return {
        score: 0,
        issues: [
          scannerFailureIssue("ACCESSIBILITY", "Accessibility audit failed", error),
        ],
      };
    }).finally(() => {
      closePageSoon(accessibilityPage);
    });
    console.log("[audit] Accessibility audit completed");

    console.log("[audit] Running SEO audit");
    const seo = await withTimeout("SEO audit", 45000, runSeoAudit(normalizedUrl, html))
      .catch((error) => {
        console.error("[audit] SEO audit failed", error);
        return {
          score: 0,
          issues: [
            scannerFailureIssue("SEO", "SEO audit failed", error),
          ],
        };
      });
    console.log("[audit] SEO audit completed");

    console.log("[audit] Waiting for security audit");
    const security = await securityPromise.catch((error) => {
      console.error("[audit] Security audit failed", error);
      return {
        score: 0,
        issues: [
          scannerFailureIssue("SECURITY", "Security audit failed", error),
        ],
      };
    });
    console.log("[audit] Security audit completed");

    console.log("[audit] Audit phases completed");

    const overallScore = Math.round(
      (performance.score +
        accessibility.score +
        seo.score +
        security.score) /
        4
    );

    return {
      performanceScore: performance.score,
      accessibilityScore: accessibility.score,
      seoScore: seo.score,
      securityScore: security.score,
      overallScore,
      fcp: performance.fcp,
      lcp: performance.lcp,
      cls: performance.cls,
      inp: performance.inp,
      tbt: performance.tbt,
      issues: [
        ...performance.issues,
        ...accessibility.issues,
        ...seo.issues,
        ...security.issues,
      ],
    };
  } finally {
    console.log("[audit] Closing browser");
    await closeBrowserWithTimeout(browser);
  }
}
