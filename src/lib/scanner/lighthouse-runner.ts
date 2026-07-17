import type { Browser, Page } from "puppeteer";
import type {
  LighthouseAuditGroup,
  LighthouseMetricTag,
  PerformanceIssueKind,
  PerformanceIssueMetadata,
  PerformanceIssueOffender,
  ScanIssueInput,
} from "./types";
import { lighthouseSubstepMessage } from "./audit-phases";
import { ensureLighthouseLocales } from "./lighthouse-locales";

export interface PerformanceAuditResult {
  score: number;
  accessibilityScore: number;
  seoScore: number;
  bestPracticesScore: number;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
  issues: ScanIssueInput[];
  engine: "lighthouse" | "failed";
  failureReason: string | null;
  /** Compact LHR JSON string for optional artifact upload (null when failed). */
  lhrJson: string | null;
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
    headings?: Array<{ key?: string; text?: string; valueType?: string }> | unknown;
    items?: unknown;
    debugData?: Record<string, unknown>;
  };
};

type LighthouseCategoryRef = {
  id: string;
  weight?: number;
  group?: string;
  acronym?: string;
};

type LighthouseResult = {
  audits: Record<string, LighthouseAudit>;
  categories: Record<
    string,
    {
      score?: number | null;
      auditRefs: LighthouseCategoryRef[];
    }
  >;
  finalUrl?: string;
  requestedUrl?: string;
  fetchTime?: string;
  lighthouseVersion?: string;
  configSettings?: Record<string, unknown>;
};

const OFFENDER_LIMIT = 40;

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
  "unminified-css": {
    kind: "resource-waste",
    headline: "CSS payloads are larger than they need to be.",
    impact: "Unminified stylesheets waste bandwidth and delay rendering.",
    primaryAction: "Minify stylesheets in production builds.",
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
  "uses-responsive-images": {
    kind: "image-delivery",
    headline: "Images are larger than their displayed size.",
    impact: "Serving oversized images wastes bandwidth and delays LCP.",
    primaryAction: "Serve responsive image sizes that match displayed dimensions.",
  },
  "modern-image-formats": {
    kind: "image-delivery",
    headline: "Images are not using modern formats.",
    impact: "WebP/AVIF can dramatically reduce download size versus PNG/JPEG.",
    primaryAction: "Convert high-impact images to WebP or AVIF.",
  },
  "image-delivery-insight": {
    kind: "image-delivery",
    headline: "Image delivery can be improved to reduce download cost.",
    impact: "Reducing image download time improves perceived load time and LCP.",
    primaryAction: "Use modern formats, compression, and correctly sized images for the largest offenders.",
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
  "lcp-breakdown-insight": {
    kind: "metric",
    headline: "LCP breakdown shows where time is being spent.",
    impact: "Understanding LCP phases helps prioritize the highest-latency step.",
    primaryAction: "Focus on the slowest LCP sub-part: TTFB, resource load delay, load duration, or render delay.",
  },
  "lcp-discovery-insight": {
    kind: "metric",
    headline: "LCP request discovery can be improved.",
    impact: "Late discovery of the LCP resource delays the largest paint.",
    primaryAction: "Preload the LCP resource or ensure it is discoverable in the initial HTML.",
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
    primaryAction: "Use font-display: swap or optional on the listed fonts so text appears immediately.",
  },
  "font-display-insight": {
    kind: "font",
    headline: "Font display settings are delaying visible text.",
    impact: "Missing font-display can block text visibility during font load.",
    primaryAction: "Set font-display to swap or optional and consider font metric overrides.",
  },
  "forced-reflow": {
    kind: "layout",
    headline: "JavaScript-triggered layout recalculations are blocking smooth rendering.",
    impact: "Forced reflows can stall the main thread and make the page feel janky or slow to respond.",
    primaryAction: "Audit the listed scripts and reduce layout-thrashing reads after DOM writes.",
  },
  "forced-reflow-insight": {
    kind: "layout",
    headline: "Forced reflow is slowing rendering.",
    impact: "Forced synchronous layouts block the main thread.",
    primaryAction: "Batch DOM writes and avoid reading layout properties immediately afterward.",
  },
  "uses-long-cache-ttl": {
    kind: "cache",
    headline: "Static assets are not cached long enough.",
    impact: "Short cache lifetimes force repeat visitors to re-download expensive resources.",
    primaryAction: "Increase cache lifetimes on the largest static assets, especially scripts, styles, fonts, and images.",
  },
  "cache-insight": {
    kind: "cache",
    headline: "Efficient cache lifetimes can save significant bandwidth.",
    impact: "Poor caching forces repeat downloads of static assets.",
    primaryAction: "Lengthen Cache-Control / TTL on the largest cacheable offenders.",
  },
  "render-blocking-resources": {
    kind: "render-blocking",
    headline: "Render-blocking requests are delaying first paint.",
    impact: "CSS and synchronous scripts in the critical path delay FCP and LCP.",
    primaryAction: "Defer non-critical CSS/JS and inline critical styles where practical.",
  },
  "render-blocking-insight": {
    kind: "render-blocking",
    headline: "Render-blocking requests are delaying first paint.",
    impact: "Critical-path CSS/JS delay FCP and LCP.",
    primaryAction: "Reduce or defer render-blocking resources on the critical path.",
  },
  "network-dependency-tree-insight": {
    kind: "network",
    headline: "Critical request chains are lengthening page load.",
    impact: "Long dependency chains delay discovery of important resources.",
    primaryAction: "Shorten chains, reduce sizes, or defer non-critical resources; add preconnect for key origins.",
  },
  "prioritize-lcp-image": {
    kind: "metric",
    headline: "The LCP image is not prioritized early enough.",
    impact: "Late LCP image fetch delays the largest contentful paint.",
    primaryAction: "Preload the LCP image and avoid lazy-loading above-the-fold heroes.",
  },
  "total-byte-weight": {
    kind: "resource-waste",
    headline: "The total network payload is very large.",
    impact: "Enormous payloads slow page load on constrained networks.",
    primaryAction: "Reduce the largest transfer sizes first — images, scripts, and fonts.",
  },
  "long-tasks": {
    kind: "layout",
    headline: "Long main-thread tasks are blocking interactivity.",
    impact: "Long tasks increase Total Blocking Time and hurt responsiveness.",
    primaryAction: "Break up expensive JavaScript work into smaller tasks.",
  },
  "bootup-time": {
    kind: "resource-waste",
    headline: "JavaScript boot-up time is high.",
    impact: "Heavy script evaluation delays interactivity.",
    primaryAction: "Reduce unused JS and defer non-critical scripts.",
  },
  "dom-size": {
    kind: "layout",
    headline: "The DOM is larger than recommended.",
    impact: "Large DOMs increase style/layout cost and memory use.",
    primaryAction: "Simplify markup and avoid deeply nested or excessive nodes.",
  },
  "third-parties-insight": {
    kind: "network",
    headline: "Third-party code is affecting page performance.",
    impact: "Third parties can delay LCP and block the main thread.",
    primaryAction: "Audit third-party scripts and load non-critical ones asynchronously.",
  },
  "layout-shifts": {
    kind: "layout",
    headline: "Layout shifts are degrading visual stability.",
    impact: "Unexpected movement frustrates users and worsens CLS.",
    primaryAction: "Reserve space for images/embeds and avoid inserting content above existing content.",
  },
  "cls-culprits-insight": {
    kind: "layout",
    headline: "Layout shift culprits were detected.",
    impact: "Specific elements are causing cumulative layout shift.",
    primaryAction: "Fix size attributes and avoid late-loading content that pushes the page.",
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

function severityFromScore(score: number): ScanIssueInput["severity"] {
  if (score < 0.25) return "CRITICAL";
  if (score < 0.5) return "MAJOR";
  if (score < 0.9) return "MINOR";
  return "INFO";
}

function severityFromSavings(ms: number, bytes: number): ScanIssueInput["severity"] {
  if (ms >= 2000 || bytes >= 1_000_000) return "CRITICAL";
  if (ms >= 1000 || bytes >= 500_000) return "MAJOR";
  if (ms >= 300 || bytes >= 100_000) return "MINOR";
  return "INFO";
}

function normalizeAuditDetailItems(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null && !Array.isArray(item)
    );
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const values = Object.values(record);
    if (
      values.length > 0 &&
      values.every((entry) => typeof entry === "object" && entry !== null && !Array.isArray(entry))
    ) {
      return values as Array<Record<string, unknown>>;
    }

    if (
      "url" in record ||
      "label" in record ||
      "sourceURL" in record ||
      "node" in record ||
      "wastedBytes" in record ||
      "children" in record
    ) {
      return [record];
    }
  }

  return [];
}

function normalizeAuditHeadings(
  value: unknown
): Array<{ key?: string; text?: string; valueType?: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (heading): heading is { key?: string; text?: string; valueType?: string } =>
      typeof heading === "object" && heading !== null
  );
}

function stripMarkdownLinks(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
}

function extractLearnMoreUrl(description: string | null | undefined): string | null {
  if (!description) return null;
  const match = description.match(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/);
  return match?.[1] ?? null;
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getPerformanceIssueKind(auditId: string | undefined): PerformanceIssueKind {
  if (!auditId) return "general";
  if (PERFORMANCE_AUDIT_COPY[auditId]) return PERFORMANCE_AUDIT_COPY[auditId].kind;
  if (auditId.includes("image")) return "image-delivery";
  if (auditId.includes("font")) return "font";
  if (auditId.includes("cache")) return "cache";
  if (auditId.includes("render-blocking")) return "render-blocking";
  if (auditId.includes("network") || auditId.includes("third-part")) return "network";
  if (auditId.includes("layout") || auditId.includes("cls") || auditId.includes("reflow")) {
    return "layout";
  }
  if (auditId.includes("unused") || auditId.includes("byte") || auditId.includes("minify")) {
    return "resource-waste";
  }
  if (auditId.includes("lcp") || auditId.includes("fcp") || auditId.includes("paint")) {
    return "metric";
  }
  return "general";
}

function resolveAuditGroup(
  audit: LighthouseAudit,
  groupHint: string | undefined
): LighthouseAuditGroup {
  const mode = audit.scoreDisplayMode ?? "";
  if (mode === "manual") return "manual";
  if (mode === "notApplicable") return "notApplicable";
  if (groupHint === "metrics" || mode === "numeric") return "metrics";
  // Internal data audits (Tasks, Screenshot Thumbnails, Metrics, Diagnostics)
  // that the Lighthouse report itself never renders.
  if (groupHint === "hidden") return "notApplicable";

  const isInsight =
    (audit.id ?? "").endsWith("-insight") ||
    groupHint === "insights" ||
    mode === "metricSavings";

  if (audit.score === 1) return "passed";
  if (isInsight) return "insights";
  return "diagnostics";
}

function metricTagsForAudit(
  auditId: string,
  acronyms: string[],
  scoreDisplayMode: string | null
): LighthouseMetricTag[] {
  const tags = new Set<LighthouseMetricTag>();
  for (const acronym of acronyms) {
    const upper = acronym.toUpperCase();
    if (upper === "FCP" || upper === "LCP" || upper === "TBT" || upper === "CLS" || upper === "INP") {
      tags.add(upper);
    }
  }

  const id = auditId.toLowerCase();
  if (id.includes("fcp") || id.includes("first-contentful")) tags.add("FCP");
  if (id.includes("lcp") || id.includes("largest-contentful")) tags.add("LCP");
  if (id.includes("tbt") || id.includes("blocking")) tags.add("TBT");
  if (id.includes("cls") || id.includes("layout-shift")) tags.add("CLS");
  if (id.includes("inp") || id.includes("interaction")) tags.add("INP");

  if (tags.size === 0 && (scoreDisplayMode === "informative" || scoreDisplayMode === "manual")) {
    tags.add("Unscored");
  }

  return Array.from(tags);
}

function shouldIncludeAudit(audit: LighthouseAudit, group: LighthouseAuditGroup): boolean {
  if (!audit.id || !audit.title) return false;
  if (group === "notApplicable" || group === "manual") return false;
  if (group === "passed") return false;
  if (group === "metrics") {
    // Metrics are shown as scorecards; only surface failing metric audits as issues.
    if (audit.score !== null && audit.score !== undefined) {
      return audit.score < 0.9;
    }
    return false;
  }

  const items = normalizeAuditDetailItems(audit.details?.items);
  const savingsMs = audit.details?.overallSavingsMs ?? 0;
  const savingsBytes = audit.details?.overallSavingsBytes ?? 0;

  if (audit.scoreDisplayMode === "informative") {
    return items.length > 0 || savingsMs > 0 || savingsBytes > 0 || Boolean(audit.displayValue);
  }

  if (audit.scoreDisplayMode === "metricSavings") {
    return savingsMs > 0 || savingsBytes > 0 || items.length > 0;
  }

  if (audit.score !== null && audit.score !== undefined) {
    return audit.score < 0.9;
  }

  if (audit.scoreDisplayMode === "binary") {
    return audit.score != null && audit.score < 1;
  }

  return items.length > 0 || savingsMs > 0 || savingsBytes > 0;
}

function buildIssueDescription(audit: LighthouseAudit): string {
  const description = stripMarkdownLinks(audit.description);
  if (audit.displayValue) {
    return description ? `${description} (${audit.displayValue})` : audit.displayValue;
  }
  return description || audit.title || "Lighthouse flagged this item.";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function pickOffenderLabel(item: Record<string, unknown>): string {
  const node = asRecord(item.node);
  const extra = asRecord(item.extra);
  const sourceLocation = asRecord(item.sourceLocation);
  // `source` can be a plain string, a source-location, or a { type: text, value } object.
  const sourceRecord = asRecord(item.source);
  const sourceLabel =
    toStringValue(item.source) ??
    toStringValue(sourceRecord?.url) ??
    toStringValue(sourceRecord?.value);
  // third-party-summary entities can be plain strings or { text, url } objects.
  const entityLabel =
    toStringValue(item.entity) ?? toStringValue(asRecord(item.entity)?.text);

  return (
    toStringValue(item.label) ??
    toStringValue(item.url) ??
    toStringValue(item.groupLabel) ??
    toStringValue(item.origin) ??
    toStringValue(item.phase) ??
    toStringValue(item.reason) ??
    toStringValue(item.issueType) ??
    toStringValue(item.cause) ??
    toStringValue(item.href) ??
    toStringValue(item.text) ??
    entityLabel ??
    toStringValue(item.statistic) ??
    toStringValue(item.name) ??
    toStringValue(item.description) ??
    toStringValue(sourceLocation?.url) ??
    toStringValue(item.sourceURL) ??
    toStringValue(item.scriptUrl) ??
    toStringValue(item.nodeLabel) ??
    toStringValue(node?.nodeLabel) ??
    toStringValue(node?.value) ??
    toStringValue(item.selector) ??
    toStringValue(node?.selector) ??
    toStringValue(extra?.nodeLabel) ??
    toStringValue(extra?.value) ??
    sourceLabel ??
    "Affected resource"
  );
}

function pickOffenderUrl(item: Record<string, unknown>): string | null {
  const sourceLocation = asRecord(item.sourceLocation);
  const extra = asRecord(item.extra);
  const candidate =
    toStringValue(item.url) ??
    toStringValue(item.origin) ??
    toStringValue(item.href) ??
    toStringValue(item.frameUrl) ??
    toStringValue(sourceLocation?.url) ??
    toStringValue(item.sourceURL) ??
    toStringValue(item.scriptUrl) ??
    (extra?.type === "url" ? toStringValue(extra.value) : null) ??
    null;
  // Some audits put non-URL markers here (e.g. "network" in errors-in-console).
  return candidate && /^https?:\/\//i.test(candidate) ? candidate : null;
}

function extractSubItems(item: Record<string, unknown>): PerformanceIssueOffender["subItems"] {
  const sub = item.subItems;
  if (!sub || typeof sub !== "object") return [];
  const subRecord = sub as Record<string, unknown>;
  const items = normalizeAuditDetailItems(subRecord.items);
  return items.slice(0, 8).map((entry) => ({
    label: pickOffenderLabel(entry),
    wastedBytes: toNumber(entry.wastedBytes) ?? toNumber(entry.totalBytes),
    wastedMs: toNumber(entry.wastedMs) ?? toNumber(entry.duration),
  }));
}

function flattenTreeItems(
  items: Array<Record<string, unknown>>,
  depth = 0
): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  for (const item of items) {
    out.push({ ...item, __depth: depth });
    const children = childRecords(item.children ?? item.chains);
    if (children.length > 0) {
      out.push(...flattenTreeItems(children, depth + 1));
    }
  }
  return out;
}

/** Children/chains can be arrays or objects keyed by request id. */
function childRecords(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter(
      (child): child is Record<string, unknown> => typeof child === "object" && child !== null
    );
  }
  const record = asRecord(value);
  if (record) {
    return Object.values(record).filter(
      (child): child is Record<string, unknown> => typeof child === "object" && child !== null
    );
  }
  return [];
}

/**
 * Insight audits nest structured content: `checklist` pass/fail checks,
 * `network-tree` request chains, and `list-section` wrappers with nested
 * tables. Expand each into readable rows.
 */
function expandStructuredItems(
  items: Array<Record<string, unknown>>,
  depth = 0
): Array<Record<string, unknown>> {
  if (depth > 3) return items;
  const out: Array<Record<string, unknown>> = [];
  for (const item of items) {
    if (item.type === "table" || item.type === "list") {
      out.push(...expandStructuredItems(normalizeAuditDetailItems(item.items), depth + 1));
      continue;
    }

    if (item.type === "checklist") {
      const checklist = asRecord(item.items);
      for (const entry of Object.values(checklist ?? {})) {
        const check = asRecord(entry);
        const label = toStringValue(check?.label);
        if (!label) continue;
        out.push({ label: `${check?.value === true ? "Passed" : "Failed"}: ${label}` });
      }
      continue;
    }

    if (item.type === "network-tree") {
      out.push(...flattenTreeItems(childRecords(item.chains)));
      continue;
    }

    if (item.type === "list-section") {
      const title = toStringValue(item.title) ?? "Details";
      const value = asRecord(item.value);
      if (value?.type === "network-tree") {
        out.push(...flattenTreeItems(childRecords(value.chains)));
        continue;
      }
      const nested = normalizeAuditDetailItems(value?.items);
      if (nested.length > 0) {
        out.push({ label: title, subItems: { items: nested } });
      } else {
        const text =
          toStringValue(value?.value) ?? stripMarkdownLinks(toStringValue(item.description));
        out.push({ label: text ? `${title}: ${text}` : title });
      }
      continue;
    }

    out.push(item);
  }
  return out;
}

function extractTopOffenders(audit: LighthouseAudit): PerformanceIssueOffender[] {
  // Debug data powers Lighthouse internals and has no user-facing resource rows.
  if (audit.details?.type === "debugdata") return [];

  let items = normalizeAuditDetailItems(audit.details?.items);

  // Network dependency trees and similar nested structures.
  if (
    items.some((item) => Array.isArray(item.children) || Array.isArray(item.chains)) ||
    audit.details?.type === "opportunity" && (audit.id ?? "").includes("network")
  ) {
    items = flattenTreeItems(items);
  }

  items = expandStructuredItems(items);

  return items
    .map((item) => {
      const node =
        typeof item.node === "object" && item.node !== null
          ? (item.node as Record<string, unknown>)
          : null;
      const depth = toNumber(item.__depth) ?? 0;
      const indent = depth > 0 ? `${"—".repeat(Math.min(depth, 4))} ` : "";

      const entity = toStringValue(item.entity) ?? toStringValue(item.sessionTargetType);
      let party: "1st" | "3rd" | null = null;
      if (entity) {
        const lower = entity.toLowerCase();
        if (lower.includes("1st") || lower.includes("first")) party = "1st";
        else if (lower.includes("3rd") || lower.includes("third")) party = "3rd";
      }

      return {
        label: `${indent}${pickOffenderLabel(item)}`,
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
          toNumber(item.responseTime) ??
          toNumber(item.serverResponseTime) ??
          toNumber(item.blockingTime) ??
          toNumber(item.mainThreadTime) ??
          toNumber(item.navStartToEndTime) ??
          toNumber(item.timing) ??
          null,
        transferSize: toNumber(item.transferSize),
        totalBytes: toNumber(item.totalBytes),
        snippet:
          toStringValue(node?.snippet) ??
          toStringValue(item.snippet) ??
          toStringValue(item.nodeLabel) ??
          toStringValue(item.selector) ??
          null,
        selector:
          toStringValue(node?.selector) ??
          toStringValue(item.selector) ??
          toStringValue(item.nodeLabel) ??
          null,
        party,
        thumbnail:
          toStringValue(item.data) ??
          toStringValue(item.thumbnail) ??
          toStringValue(node?.lhId) ??
          null,
        displayedWidth: toNumber(item.displayedWidth) ?? toNumber(item.width),
        displayedHeight: toNumber(item.displayedHeight) ?? toNumber(item.height),
        naturalWidth: toNumber(item.naturalWidth) ?? toNumber(item.intrinsicWidth),
        naturalHeight: toNumber(item.naturalHeight) ?? toNumber(item.intrinsicHeight),
        subItems: extractSubItems(item),
      } satisfies PerformanceIssueOffender;
    })
    .sort((a, b) => {
      const aWeight = (a.wastedBytes ?? 0) + (a.wastedMs ?? 0) * 1024;
      const bWeight = (b.wastedBytes ?? 0) + (b.wastedMs ?? 0) * 1024;
      return bWeight - aWeight;
    })
    .slice(0, OFFENDER_LIMIT);
}

function buildPerformanceMetadata(
  audit: LighthouseAudit,
  url: string,
  options: {
    lighthouseCategory: string;
    group: LighthouseAuditGroup;
    metricTags: LighthouseMetricTag[];
  }
): PerformanceIssueMetadata {
  const auditId = audit.id ?? null;
  const customCopy = auditId ? PERFORMANCE_AUDIT_COPY[auditId] : null;
  const summary = firstNonEmpty(
    customCopy?.headline,
    stripMarkdownLinks(audit.description),
    stripMarkdownLinks(audit.title),
    "Lighthouse flagged a performance issue that needs review."
  )!;
  const headings = normalizeAuditHeadings(audit.details?.headings)
    .map((heading) => stripMarkdownLinks(heading.text))
    .filter(Boolean);

  const debug = audit.details?.debugData;
  const criticalPathLatencyMs =
    debug && typeof debug === "object"
      ? toNumber((debug as Record<string, unknown>).maxCriticalPathLatency) ??
        toNumber((debug as Record<string, unknown>).criticalPathLatency)
      : null;

  return {
    version: 2,
    source: "lighthouse",
    lighthouseAuditId: auditId,
    lighthouseCategory: options.lighthouseCategory,
    kind: getPerformanceIssueKind(audit.id),
    group: options.group,
    metricTags: options.metricTags,
    score: audit.score ?? null,
    scoreDisplayMode: audit.scoreDisplayMode ?? null,
    displayValue: stripMarkdownLinks(audit.displayValue) || null,
    numericValue: audit.numericValue ?? null,
    estimatedSavingsMs: audit.details?.overallSavingsMs ?? null,
    estimatedSavingsBytes: audit.details?.overallSavingsBytes ?? null,
    summary,
    impact: firstNonEmpty(customCopy?.impact, stripMarkdownLinks(audit.explanation)),
    primaryAction: firstNonEmpty(customCopy?.primaryAction, stripMarkdownLinks(audit.description)),
    learnMoreUrl: extractLearnMoreUrl(audit.description),
    headings,
    topOffenders: extractTopOffenders(audit),
    url,
    criticalPathLatencyMs,
  };
}

function categoryToIssueCategory(
  lighthouseCategory: string
): ScanIssueInput["category"] {
  switch (lighthouseCategory) {
    case "accessibility":
      return "ACCESSIBILITY";
    case "seo":
      return "SEO";
    case "best-practices":
      return "SECURITY";
    default:
      return "PERFORMANCE";
  }
}

function issuesFromLighthouseCategory(
  audits: Record<string, LighthouseAudit>,
  refs: LighthouseCategoryRef[],
  lighthouseCategory: string,
  url: string
): ScanIssueInput[] {
  const issues: ScanIssueInput[] = [];
  const acronymByAudit = new Map<string, string[]>();

  for (const ref of refs) {
    const existing = acronymByAudit.get(ref.id) ?? [];
    if (ref.acronym) existing.push(ref.acronym);
    acronymByAudit.set(ref.id, existing);
  }

  for (const ref of refs) {
    const audit = audits[ref.id];
    if (!audit) continue;
    const group = resolveAuditGroup(audit, ref.group);
    if (!shouldIncludeAudit(audit, group)) continue;

    const metricTags = metricTagsForAudit(
      ref.id,
      acronymByAudit.get(ref.id) ?? [],
      audit.scoreDisplayMode ?? null
    );
    const performanceMetadata = buildPerformanceMetadata(audit, url, {
      lighthouseCategory,
      group,
      metricTags,
    });

    let severity: ScanIssueInput["severity"] = "INFO";
    if (audit.score !== null && audit.score !== undefined) {
      severity = severityFromScore(audit.score);
    } else {
      const savingsMs = audit.numericValue ?? audit.details?.overallSavingsMs ?? 0;
      const savingsBytes = audit.details?.overallSavingsBytes ?? 0;
      severity = severityFromSavings(savingsMs, savingsBytes);
    }

    const firstOffender = performanceMetadata.topOffenders[0];

    issues.push({
      category: categoryToIssueCategory(lighthouseCategory),
      severity,
      title: audit.title ?? audit.id ?? "Lighthouse audit",
      description: buildIssueDescription(audit),
      recommendation:
        performanceMetadata.primaryAction ??
        "Review the main offenders and address the highest-impact resources first.",
      selector: firstOffender?.selector ?? null,
      url: firstOffender?.url ?? null,
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

function compactLhr(lhr: LighthouseResult): string {
  const compact = {
    lighthouseVersion: lhr.lighthouseVersion,
    requestedUrl: lhr.requestedUrl,
    finalUrl: lhr.finalUrl,
    fetchTime: lhr.fetchTime,
    configSettings: lhr.configSettings,
    categories: Object.fromEntries(
      Object.entries(lhr.categories).map(([key, value]) => [
        key,
        {
          score: value.score,
          auditRefs: value.auditRefs.map((ref) => ({
            id: ref.id,
            weight: ref.weight,
            group: ref.group,
            acronym: ref.acronym,
          })),
        },
      ])
    ),
    audits: lhr.audits,
  };
  return JSON.stringify(compact);
}

function labFailedResult(reason: string, url: string): PerformanceAuditResult {
  const metadata: PerformanceIssueMetadata = {
    version: 2,
    source: "lab-failed",
    lighthouseAuditId: null,
    lighthouseCategory: "performance",
    kind: "general",
    group: "diagnostics",
    metricTags: ["Unscored"],
    score: null,
    scoreDisplayMode: null,
    displayValue: null,
    numericValue: null,
    estimatedSavingsMs: null,
    estimatedSavingsBytes: null,
    summary: "The Lighthouse lab did not complete successfully.",
    impact:
      "Without a completed lab run, Issue Center cannot show the same opportunities Chrome Lighthouse would report.",
    primaryAction:
      "Retry the audit. If it keeps failing, check whether the page blocks headless browsers or takes too long to become idle.",
    learnMoreUrl: null,
    headings: [],
    topOffenders: [],
    url,
  };

  return {
    score: 0,
    accessibilityScore: 0,
    seoScore: 0,
    bestPracticesScore: 0,
    fcp: null,
    lcp: null,
    cls: null,
    inp: null,
    tbt: null,
    issues: [
      {
        category: "PERFORMANCE",
        severity: "CRITICAL",
        title: "Lighthouse lab incomplete",
        description: reason,
        recommendation: metadata.primaryAction,
        metadata: metadata as unknown as Record<string, unknown>,
      },
    ],
    engine: "failed",
    failureReason: reason,
    lhrJson: null,
  };
}

/** @deprecated superseded by LighthouseDevice; kept for older imports. */
export type LighthousePreset = "fast" | "accurate";

/**
 * Emulation target, mirroring the Device toggle in Chrome DevTools Lighthouse.
 * Desktop: no CPU throttling, fast network. Mobile: slow 4G + 4x CPU slowdown.
 */
export type LighthouseDevice = "desktop" | "mobile";

export async function runLighthousePerformanceAudit(
  browser: Browser,
  _page: Page,
  url: string,
  onSubstep?: (message: string) => Promise<void>,
  device: LighthouseDevice = "desktop"
): Promise<PerformanceAuditResult> {
  const port = getBrowserPort(browser);

  const logLighthouse = async (message: string) => {
    console.log(`[lighthouse] ${message}`);
    await onSubstep?.(lighthouseSubstepMessage(message));
  };

  await logLighthouse("Initializing Lighthouse");

  ensureLighthouseLocales();
  const lighthouse = await importLighthouseWithTimeout(45000);

  const mobile = device === "mobile";
  await logLighthouse(
    mobile
      ? "Running mobile Lighthouse lab (Performance, Accessibility, Best Practices, SEO)…"
      : "Running desktop Lighthouse lab (Performance, Accessibility, Best Practices, SEO)…"
  );
  console.log(`[lighthouse] Starting audit for ${url} on port ${port} (${device})`);

  const runnerResult = await lighthouse(
    url,
    {
      port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
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

  const lhr = runnerResult?.lhr as LighthouseResult | undefined;
  if (!lhr?.categories?.performance) {
    throw new Error("Lighthouse did not return performance results.");
  }

  await logLighthouse("Analyzing metrics, insights, and diagnostics");

  const audits = lhr.audits;
  const score = clampScore((lhr.categories.performance.score ?? 0) * 100);
  const accessibilityScore = clampScore((lhr.categories.accessibility?.score ?? 0) * 100);
  const seoScore = clampScore((lhr.categories.seo?.score ?? 0) * 100);
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

  const issues = [
    ...issuesFromLighthouseCategory(
      audits,
      lhr.categories.performance.auditRefs,
      "performance",
      url
    ),
    ...issuesFromLighthouseCategory(
      audits,
      lhr.categories.accessibility?.auditRefs ?? [],
      "accessibility",
      url
    ),
    ...issuesFromLighthouseCategory(
      audits,
      lhr.categories["best-practices"]?.auditRefs ?? [],
      "best-practices",
      url
    ),
    ...issuesFromLighthouseCategory(
      audits,
      lhr.categories.seo?.auditRefs ?? [],
      "seo",
      url
    ),
  ];

  if (lcp !== null && lcp > 2500) {
    const alreadyHasLcp = issues.some(
      (i) =>
        String((i.metadata as Record<string, unknown>)?.lighthouseAuditId ?? "") ===
        "largest-contentful-paint"
    );
    if (!alreadyHasLcp) {
      issues.push({
        category: "PERFORMANCE",
        severity: lcp > 4000 ? "CRITICAL" : "MAJOR",
        title: "Largest Contentful Paint needs improvement",
        description: `LCP was ${lcp} ms under mobile throttling.`,
        recommendation:
          "Optimize the largest above-the-fold element — compress images, preload hero assets, reduce server latency.",
        metadata: {
          version: 2,
          source: "lighthouse",
          kind: "metric",
          group: "metrics",
          metricTags: ["LCP"],
          lighthouseAuditId: "largest-contentful-paint",
          lighthouseCategory: "performance",
          score: null,
          scoreDisplayMode: "numeric",
          displayValue: `${lcp} ms`,
          numericValue: lcp,
          estimatedSavingsMs: null,
          estimatedSavingsBytes: null,
          summary: "The page's largest visible element is appearing too late.",
          impact:
            "A slow LCP makes the page feel sluggish even when some assets are already visible.",
          primaryAction:
            "Optimize the largest above-the-fold element first — compress images, preload hero assets, and reduce server latency.",
          learnMoreUrl: null,
          headings: [],
          topOffenders: [],
          url,
        } satisfies PerformanceIssueMetadata as unknown as Record<string, unknown>,
      });
    }
  }

  return {
    score,
    accessibilityScore,
    seoScore,
    bestPracticesScore,
    fcp,
    lcp,
    cls,
    inp,
    tbt,
    issues,
    engine: "lighthouse",
    failureReason: null,
    lhrJson: compactLhr(lhr),
  };
}

/**
 * Runs Lighthouse; on failure returns an explicit lab-failed result (never a silent healthy score).
 */
export async function runPerformanceAuditWithFallback(
  browser: Browser,
  page: Page,
  url: string,
  onSubstep?: (message: string) => Promise<void>,
  device: LighthouseDevice = "desktop"
): Promise<PerformanceAuditResult> {
  try {
    return await runLighthousePerformanceAudit(browser, page, url, onSubstep, device);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Lighthouse failed unexpectedly";
    console.warn("[audit] Lighthouse failed — recording lab incomplete:", reason);
    await onSubstep?.("Lighthouse could not finish — recording lab failure…");
    return labFailedResult(reason, url);
  }
}
