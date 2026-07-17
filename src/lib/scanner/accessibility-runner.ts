import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { createRequire } from "module";
import path from "path";
import { parseElementSnippet } from "@/lib/parse-element-snippet";
import type { Page } from "puppeteer";
import type { ScanIssueInput } from "./types";

const AXE_TIMEOUT_MS = 30000;
const MAX_NODES_PER_RULE = 25;
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
        tags?: string[];
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

function axeGroup(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return "BEST PRACTICES";
  if (tags.some((t) => t.includes("color-contrast") || t === "cat.color")) return "CONTRAST";
  if (tags.some((t) => t.includes("name") || t.includes("label") || t === "cat.name-role-value")) {
    return "NAMES AND LABELS";
  }
  if (tags.some((t) => t.includes("landmark") || t.includes("structure"))) return "BEST PRACTICES";
  if (tags.some((t) => t.startsWith("wcag"))) return "WCAG";
  return "BEST PRACTICES";
}

export async function runAccessibilityAudit(page: Page): Promise<{
  score: number;
  issues: ScanIssueInput[];
}> {
  await injectAxe(page);
  const results = await page.evaluate(async (timeoutMs) => {
    const timeout = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("axe-core timed out")), timeoutMs);
    });

    return await Promise.race([
      (window as unknown as AxeWindow).axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "best-practice"] },
        resultTypes: ["violations"],
      }),
      timeout,
    ]);
  }, AXE_TIMEOUT_MS);

  const issues: ScanIssueInput[] = [];

  for (const v of results.violations) {
    const nodes = v.nodes.slice(0, MAX_NODES_PER_RULE);
    const severity = IMPACT_TO_SEVERITY[v.impact ?? "moderate"] ?? "MINOR";
    const group = axeGroup(v.tags);

    if (nodes.length === 0) {
      issues.push({
        category: "ACCESSIBILITY",
        severity,
        title: v.help,
        description: v.description,
        recommendation: `See ${v.helpUrl} for remediation guidance.`,
        metadata: {
          version: 2,
          source: "axe",
          axeId: v.id,
          group,
          learnMoreUrl: v.helpUrl,
          failingElements: [],
        },
      });
      continue;
    }

    // One issue per rule with all failing elements in metadata (Lighthouse-style).
    const failingElements = nodes.map((node) => {
      const selector = node.target?.join(" > ") ?? null;
      const htmlSnippet = node.html?.slice(0, 400) ?? null;
      const element = parseElementSnippet(htmlSnippet ?? undefined);
      return {
        selector,
        html: htmlSnippet,
        failureSummary: node.failureSummary ?? null,
        elementTag: element.elementTag ?? "element",
        elementId: element.elementId,
        elementClass: element.elementClass,
      };
    });

    const primary = failingElements[0];
    issues.push({
      category: "ACCESSIBILITY",
      severity,
      title: v.help,
      description: primary?.failureSummary
        ? `${v.description} — ${primary.failureSummary}`
        : v.description,
      selector: primary?.selector ?? null,
      recommendation: `See ${v.helpUrl} for remediation guidance.`,
      metadata: {
        version: 2,
        source: "axe",
        axeId: v.id,
        group,
        learnMoreUrl: v.helpUrl,
        impact: v.impact ?? null,
        failingElements,
        html: primary?.html ?? null,
        elementTag: primary?.elementTag ?? "element",
        elementId: primary?.elementId,
        elementClass: primary?.elementClass,
      },
    });
  }

  const violationPenalty = results.violations.reduce((sum: number, v: { impact?: string }) => {
    const weights: Record<string, number> = {
      critical: 15,
      serious: 10,
      moderate: 5,
      minor: 2,
    };
    return sum + (weights[v.impact ?? "moderate"] ?? 5);
  }, 0);

  const score = Math.max(0, Math.round(100 - violationPenalty));

  return { score, issues };
}
