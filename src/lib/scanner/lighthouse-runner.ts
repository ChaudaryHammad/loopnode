import type { Browser } from "puppeteer";
import type { ScanIssueInput } from "./types";

function metricValue(
  audits: Record<string, { numericValue?: number }>,
  id: string
): number | null {
  const val = audits[id]?.numericValue;
  return val !== undefined ? Math.round(val) : null;
}

export async function runPerformanceAudit(
  url: string,
  browser: Browser
): Promise<{
  score: number;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
  issues: ScanIssueInput[];
}> {
  const endpoint = browser.wsEndpoint();
  const port = Number(new URL(endpoint).port);
  const { default: lighthouse } = await import("lighthouse");

  const runnerResult = await lighthouse(url, {
    port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance"],
    formFactor: "desktop",
    screenEmulation: { disabled: true },
  });

  const lhr = runnerResult?.lhr;
  if (!lhr) {
    throw new Error("Lighthouse did not return results.");
  }

  const audits = lhr.audits as Record<
    string,
    {
      score: number | null;
      title: string;
      description: string;
      displayValue?: string;
    }
  >;

  const score = Math.round((lhr.categories.performance?.score ?? 0) * 100);

  const issues: ScanIssueInput[] = Object.entries(audits)
    .filter(([, audit]) => audit.score !== null && audit.score < 0.9)
    .filter(([id]) => !id.startsWith("metric-") && !id.startsWith("screenshot-"))
    .slice(0, 12)
    .map(([id, audit]) => {
      let severity: ScanIssueInput["severity"] = "MINOR";
      if (audit.score !== null && audit.score < 0.5) severity = "CRITICAL";
      else if (audit.score !== null && audit.score < 0.75) severity = "MAJOR";

      return {
        category: "PERFORMANCE" as const,
        severity,
        title: audit.title,
        description: audit.displayValue
          ? `${audit.description} (${audit.displayValue})`
          : audit.description,
        recommendation: `Address the Lighthouse audit "${id}" to improve performance.`,
        metadata: { auditId: id },
      };
    });

  return {
    score,
    fcp: metricValue(audits as Record<string, { numericValue?: number }>, "first-contentful-paint"),
    lcp: metricValue(audits as Record<string, { numericValue?: number }>, "largest-contentful-paint"),
    cls: audits["cumulative-layout-shift"]?.score !== null
      ? parseFloat(
          (
            (audits as Record<string, { numericValue?: number }>)["cumulative-layout-shift"]
              ?.numericValue ?? 0
          ).toFixed(3)
        )
      : null,
    inp: metricValue(audits as Record<string, { numericValue?: number }>, "interaction-to-next-paint"),
    tbt: metricValue(audits as Record<string, { numericValue?: number }>, "total-blocking-time"),
    issues,
  };
}
