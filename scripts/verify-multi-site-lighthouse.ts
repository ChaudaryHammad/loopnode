/**
 * Exercises the Lighthouse extractor against structurally different websites.
 * Run: npx tsx scripts/verify-multi-site-lighthouse.ts
 */
import { launchBrowser } from "../src/lib/scanner/launch-browser";
import { runLighthousePerformanceAudit } from "../src/lib/scanner/lighthouse-runner";

const DEFAULT_URLS = [
  "https://www.precisionpipelinellc.com/",
  "https://www.henkelslaw.com/",
  "https://masteccivil2.sdsol.dev/",
  "http://mastec.com/",
  "https://stag-henkel-mccoy.sdsol.com/",
];
const rawArgs = process.argv.slice(2);
const DEVICE: "desktop" | "mobile" = rawArgs.includes("mobile") ? "mobile" : "desktop";
const urlArgs = rawArgs.filter((arg) => arg !== "desktop" && arg !== "mobile");
const URLS = urlArgs.length > 0 ? urlArgs : DEFAULT_URLS;

type Offender = {
  label?: unknown;
  url?: unknown;
};

type IssueMetadata = {
  topOffenders?: Offender[];
};

async function main() {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  let failures = 0;

  try {
    for (const url of URLS) {
      const started = Date.now();
      try {
        const result = await runLighthousePerformanceAudit(
          browser,
          page,
          url,
          undefined,
          DEVICE
        );

        const categoryCounts = new Map<string, number>();
        const severityCounts = new Map<string, number>();
        const blankOffenders: Array<{ title: string; auditId: string | null }> = [];
        let offenderCount = 0;

        for (const issue of result.issues) {
          categoryCounts.set(issue.category, (categoryCounts.get(issue.category) ?? 0) + 1);
          severityCounts.set(issue.severity, (severityCounts.get(issue.severity) ?? 0) + 1);

          const metadata = issue.metadata as IssueMetadata | undefined;
          for (const offender of metadata?.topOffenders ?? []) {
            offenderCount += 1;
            const label = typeof offender.label === "string" ? offender.label.trim() : "";
            const offenderUrl = typeof offender.url === "string" ? offender.url.trim() : "";
            const auditId =
              typeof (issue.metadata as Record<string, unknown> | undefined)?.lighthouseAuditId ===
              "string"
                ? String(
                    (issue.metadata as Record<string, unknown> | undefined)?.lighthouseAuditId
                  )
                : null;
            if (!label && !offenderUrl) blankOffenders.push({ title: issue.title, auditId });
            if (label === "Affected resource" && !offenderUrl) {
              blankOffenders.push({ title: issue.title, auditId });
            }
          }
        }

        const elapsedSeconds = Math.round((Date.now() - started) / 1000);
        console.log(`\nSITE ${url} [${DEVICE}]`);
        console.log(
          `PASS ${elapsedSeconds}s score=${result.score} a11y=${result.accessibilityScore} seo=${result.seoScore} bestPractices=${result.bestPracticesScore}`
        );
        console.log(
          `vitals fcp=${result.fcp}ms lcp=${result.lcp}ms tbt=${result.tbt}ms cls=${result.cls}`
        );
        console.log(
          `issues=${result.issues.length} offenders=${offenderCount} blankOffenders=${blankOffenders.length}`
        );
        console.log(
          `categories=${JSON.stringify(Object.fromEntries(categoryCounts))} severities=${JSON.stringify(Object.fromEntries(severityCounts))}`
        );

        if (blankOffenders.length > 0) {
          failures += 1;
          const unique = [
            ...new Map(blankOffenders.map((item) => [item.auditId ?? item.title, item])).values(),
          ];
          console.log(`BLANK_ROWS ${JSON.stringify(unique)}`);
          const lhr = result.lhrJson
            ? (JSON.parse(result.lhrJson) as {
                audits?: Record<string, { details?: unknown }>;
              })
            : null;
          for (const item of unique) {
            const details = item.auditId ? lhr?.audits?.[item.auditId]?.details : null;
            console.log(
              `RAW_DETAILS ${item.auditId ?? item.title} ${JSON.stringify(details)?.slice(0, 5000)}`
            );
          }
        }
      } catch (error) {
        failures += 1;
        console.log(`\nSITE ${url}`);
        console.log(`FAIL ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } finally {
    await page.close();
    await browser.close();
  }

  console.log(`\nSUMMARY sites=${URLS.length} failures=${failures}`);
  if (failures > 0) process.exitCode = 1;
}

void main();
