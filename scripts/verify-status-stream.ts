/**
 * Verifies that Lighthouse's internal status events stream to onSubstep.
 * Run: npx tsx scripts/verify-status-stream.ts [url]
 */
import { launchBrowser } from "../src/lib/scanner/launch-browser";
import { runLighthousePerformanceAudit } from "../src/lib/scanner/lighthouse-runner";

const url = process.argv[2] ?? "https://www.henkelslaw.com/";

async function main() {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  const statuses: string[] = [];

  try {
    const result = await runLighthousePerformanceAudit(
      browser,
      page,
      url,
      async (message) => {
        statuses.push(message);
        console.log(`STATUS ${message}`);
      },
      "desktop"
    );
    console.log(`\nDONE score=${result.score} statuses=${statuses.length}`);
    const streamed = statuses.filter(
      (s) =>
        s.includes("navigating") ||
        s.includes("gathering") ||
        s.includes("computing") ||
        s.includes("auditing")
    );
    console.log(`STREAMED_LH_STATUSES ${streamed.length}`);
    if (streamed.length === 0) process.exitCode = 1;
  } finally {
    await page.close();
    await browser.close();
  }
}

void main();
