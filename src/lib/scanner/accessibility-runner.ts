import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { createRequire } from "module";
import path from "path";
import type { Page } from "puppeteer";
import type { ScanIssueInput } from "./types";

const AXE_TIMEOUT_MS = 30000;
const require = createRequire(import.meta.url);

let axeSourceCache: string | undefined;

const IMPACT_TO_SEVERITY: Record<string, ScanIssueInput["severity"]> = {
  critical: "CRITICAL",
  serious: "MAJOR",
  moderate: "MINOR",
  minor: "INFO",
};

type AxeWindow = Window & {
  axe: {
    run: (
      context: Document,
      options: {
        runOnly: { type: "tag"; values: string[] };
        resultTypes: string[];
      }
    ) => Promise<{
      violations: Array<{
        id: string;
        impact?: string;
        help: string;
        description: string;
        helpUrl: string;
        nodes: Array<{
          target: string[];
          html: string;
          failureSummary?: string;
        }>;
      }>;
    }>;
  };
};

async function loadAxeSource(): Promise<string> {
  if (axeSourceCache) return axeSourceCache;

  const copiedAssetPath = path.join(
    process.cwd(),
    "node_modules",
    "axe-core",
    "axe.min.js"
  );
  const axePath = existsSync(copiedAssetPath)
    ? copiedAssetPath
    : require.resolve("axe-core/axe.min.js");

  axeSourceCache = await readFile(axePath, "utf8");
  return axeSourceCache;
}

async function injectAxe(page: Page): Promise<void> {
  const axeSource = await loadAxeSource();
  await page.addScriptTag({ content: axeSource });

  const hasAxe = await page.evaluate(() => {
    return typeof (window as unknown as Partial<AxeWindow>).axe?.run === "function";
  });

  if (hasAxe) return;

  await page.evaluate((axeSource) => {
    window.eval(axeSource);
  }, axeSource);

  const hasFallbackAxe = await page.evaluate(() => {
    return typeof (window as unknown as Partial<AxeWindow>).axe?.run === "function";
  });

  if (!hasFallbackAxe) {
    throw new Error("axe-core failed to initialize in the browser page");
  }
}

export async function runAccessibilityAudit(page: Page): Promise<{
  score: number;
  issues: ScanIssueInput[];
}> {
  await injectAxe(page);
  const results = await page.evaluate(async (timeoutMs) => {
    const timeout = new Promise<never>((_, reject) => {
      window.setTimeout(
        () => reject(new Error("axe-core timed out")),
        timeoutMs
      );
    });

    return await Promise.race([
      (window as unknown as AxeWindow).axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] },
        resultTypes: ["violations"],
      }),
      timeout,
    ]);
  }, AXE_TIMEOUT_MS);

  const issues: ScanIssueInput[] = results.violations.map((v: {
    id: string;
    impact?: string;
    help: string;
    description: string;
    helpUrl: string;
    nodes: Array<{
      target: string[];
      html: string;
      failureSummary?: string;
    }>;
  }) => {
    const node = v.nodes[0];
    const selector = node?.target?.join(" > ") ?? null;
    return {
      category: "ACCESSIBILITY" as const,
      severity: IMPACT_TO_SEVERITY[v.impact ?? "moderate"] ?? "MINOR",
      title: v.help,
      description: node?.failureSummary
        ? `${v.description} — ${node.failureSummary}`
        : v.description,
      selector,
      recommendation: `See ${v.helpUrl} for remediation guidance.`,
      metadata: { axeId: v.id, html: node?.html?.slice(0, 200) },
    };
  });

  const violationPenalty = results.violations.reduce(
    (sum: number, v: { impact?: string }) => {
      const weights: Record<string, number> = {
        critical: 15,
        serious: 10,
        moderate: 5,
        minor: 2,
      };
      return sum + (weights[v.impact ?? "moderate"] ?? 5);
    },
    0
  );

  const score = Math.max(0, Math.round(100 - violationPenalty));

  return { score, issues };
}
