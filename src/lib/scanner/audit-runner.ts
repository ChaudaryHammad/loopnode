import { launchBrowser } from "./launch-browser";
import { runPerformanceAuditWithFallback } from "./lighthouse-runner";
import { runAccessibilityAudit } from "./accessibility-runner";
import { runSeoAudit } from "./seo-runner";
import { runSecurityAudit } from "./security-runner";
import { configureAuditPage } from "./page-request-policy";
import {
  assertScanRunnable,
  updateScanProgress,
} from "./audit-scan-control";
import { AuditCancelledError } from "./audit-cancelled-error";
import { normalizeWebsiteHost } from "@/lib/website-host";
import type { AuditResult } from "./types";

const BROWSER_CLOSE_TIMEOUT_MS = 5000;
const PAGE_SETUP_TIMEOUT_MS = 15000;
const PERFORMANCE_TIMEOUT_MS = 120000;

export interface RunFullAuditOptions {
  scanId: string;
  onProgressSubstep?: (message: string) => Promise<void>;
}

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
    recommendation:
      "Retry the audit. If it keeps failing, check whether the page blocks headless browsers or long-running scripts.",
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

async function checkpoint(scanId: string) {
  await assertScanRunnable(scanId);
}

export async function runFullAudit(
  url: string,
  options: RunFullAuditOptions
): Promise<AuditResult> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const host = normalizeWebsiteHost(normalizedUrl) ?? normalizedUrl;
  const { scanId, onProgressSubstep } = options;

  console.log(`[audit] Starting full audit for ${normalizedUrl}`);

  await checkpoint(scanId);
  await updateScanProgress(scanId, "initializing", { url, host });

  await updateScanProgress(scanId, "security", { url, host });
  const securityPromise = withTimeout(
    "Security audit",
    25000,
    runSecurityAudit(normalizedUrl)
  );

  await checkpoint(scanId);
  await updateScanProgress(scanId, "browser", { url, host });
  console.log("[audit] Launching browser");
  const browser = await launchBrowser();
  console.log("[audit] Browser launched");

  try {
    const page = await withTimeout(
      "Audit page creation",
      PAGE_SETUP_TIMEOUT_MS,
      browser.newPage()
    );

    await withTimeout(
      "Audit viewport setup",
      PAGE_SETUP_TIMEOUT_MS,
      page.setViewport({ width: 412, height: 823, deviceScaleFactor: 2 })
    );

    await withTimeout(
      "Audit page policy setup",
      PAGE_SETUP_TIMEOUT_MS,
      configureAuditPage(page)
    );

    await checkpoint(scanId);
    await updateScanProgress(scanId, "navigation", { url, host });
    console.log("[audit] Opening page");
    await withTimeout(
      "Page navigation",
      45000,
      page.goto(normalizedUrl, {
        waitUntil: "domcontentloaded",
        timeout: 40000,
      }),
      () => closePageSoon(page)
    );
    console.log("[audit] Page loaded");

    const html = await withTimeout(
      "HTML snapshot",
      PAGE_SETUP_TIMEOUT_MS,
      page.content()
    );

    await checkpoint(scanId);
    await updateScanProgress(scanId, "performance", { url, host });
    console.log("[audit] Running Lighthouse performance audit");

    const performance = await withTimeout(
      "Performance audit",
      PERFORMANCE_TIMEOUT_MS,
      runPerformanceAuditWithFallback(browser, page, normalizedUrl, async (substep) => {
        await updateScanProgress(scanId, "performance", { url, host, substep });
        await onProgressSubstep?.(substep);
      })
    ).catch(async (error) => {
      if (error instanceof AuditCancelledError) throw error;
      console.error("[audit] Performance audit failed", error);
      return {
        score: 0,
        bestPracticesScore: 0,
        fcp: null,
        lcp: null,
        cls: null,
        inp: null,
        tbt: null,
        issues: [
          scannerFailureIssue("PERFORMANCE", "Performance audit failed", error),
        ],
        engine: "fallback" as const,
      };
    });
    console.log(`[audit] Performance audit completed (${performance.engine})`);

    await checkpoint(scanId);
    await updateScanProgress(scanId, "accessibility", { url, host });
    console.log("[audit] Preparing accessibility audit");

    const accessibility = await (async () => {
      let accessibilityPage: Awaited<ReturnType<typeof browser.newPage>> | undefined;
      try {
        accessibilityPage = await withTimeout(
          "Accessibility page creation",
          PAGE_SETUP_TIMEOUT_MS,
          browser.newPage()
        );
        await withTimeout(
          "Accessibility viewport setup",
          PAGE_SETUP_TIMEOUT_MS,
          accessibilityPage.setViewport({ width: 1280, height: 800 })
        );
        await withTimeout(
          "Accessibility content setup",
          PAGE_SETUP_TIMEOUT_MS,
          accessibilityPage.setContent(html, {
            waitUntil: "domcontentloaded",
            timeout: PAGE_SETUP_TIMEOUT_MS,
          }),
          () => accessibilityPage && closePageSoon(accessibilityPage)
        );

        console.log("[audit] Running accessibility audit");
        return await withTimeout(
          "Accessibility audit",
          45000,
          runAccessibilityAudit(accessibilityPage),
          () => accessibilityPage && closePageSoon(accessibilityPage)
        );
      } finally {
        if (accessibilityPage) closePageSoon(accessibilityPage);
      }
    })().catch((error) => {
      if (error instanceof AuditCancelledError) throw error;
      console.error("[audit] Accessibility audit failed", error);
      return {
        score: 0,
        issues: [
          scannerFailureIssue("ACCESSIBILITY", "Accessibility audit failed", error),
        ],
      };
    });
    console.log("[audit] Accessibility audit completed");

    await checkpoint(scanId);
    await updateScanProgress(scanId, "seo", { url, host });
    console.log("[audit] Running SEO audit");

    const seo = await withTimeout("SEO audit", 45000, runSeoAudit(normalizedUrl, html)).catch(
      (error) => {
        if (error instanceof AuditCancelledError) throw error;
        console.error("[audit] SEO audit failed", error);
        return {
          score: 0,
          issues: [scannerFailureIssue("SEO", "SEO audit failed", error)],
        };
      }
    );
    console.log("[audit] SEO audit completed");

    console.log("[audit] Waiting for security audit");
    const security = await securityPromise.catch((error) => {
      console.error("[audit] Security audit failed", error);
      return {
        score: 0,
        issues: [scannerFailureIssue("SECURITY", "Security audit failed", error)],
      };
    });
    console.log("[audit] Security audit completed");

    await checkpoint(scanId);
    await updateScanProgress(scanId, "finalizing", { url, host });

    const securityScore =
      performance.engine === "lighthouse" && performance.bestPracticesScore > 0
        ? Math.round((security.score + performance.bestPracticesScore) / 2)
        : security.score;

    const overallScore = Math.round(
      (performance.score + accessibility.score + seo.score + securityScore) / 4
    );

    return {
      performanceScore: performance.score,
      accessibilityScore: accessibility.score,
      seoScore: seo.score,
      securityScore,
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
  } catch (error) {
    if (error instanceof AuditCancelledError) {
      throw error;
    }
    throw error;
  } finally {
    console.log("[audit] Closing browser");
    await closeBrowserWithTimeout(browser);
  }
}
