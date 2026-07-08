import type { AuditIssue } from "@/components/websites/audit-shared";
import type {
  PerformanceIssueMetadata,
  PerformanceIssueOffender,
  PerformanceIssueKind,
} from "@/lib/scanner/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isKind(value: unknown): value is PerformanceIssueKind {
  return (
    value === "resource-waste" ||
    value === "image-delivery" ||
    value === "render-blocking" ||
    value === "metric" ||
    value === "font" ||
    value === "layout" ||
    value === "cache" ||
    value === "network" ||
    value === "general"
  );
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseOffender(value: unknown): PerformanceIssueOffender | null {
  if (!isRecord(value)) return null;
  const label = toNullableString(value.label);
  if (!label) return null;

  return {
    label,
    url: toNullableString(value.url),
    wastedBytes: toNullableNumber(value.wastedBytes),
    wastedMs: toNullableNumber(value.wastedMs),
    transferSize: toNullableNumber(value.transferSize),
    totalBytes: toNullableNumber(value.totalBytes),
    snippet: toNullableString(value.snippet),
  };
}

export function parsePerformanceIssueMetadata(
  metadata: unknown
): PerformanceIssueMetadata | null {
  if (!isRecord(metadata)) return null;
  if (metadata.version !== 1 || !isKind(metadata.kind)) return null;

  const headings = Array.isArray(metadata.headings)
    ? metadata.headings.map(toNullableString).filter((value): value is string => Boolean(value))
    : [];
  const topOffenders = Array.isArray(metadata.topOffenders)
    ? metadata.topOffenders
        .map(parseOffender)
        .filter((offender): offender is PerformanceIssueOffender => Boolean(offender))
    : [];

  const summary = toNullableString(metadata.summary);
  if (!summary) return null;

  return {
    version: 1,
    source: metadata.source === "fallback" ? "fallback" : "lighthouse",
    lighthouseAuditId: toNullableString(metadata.lighthouseAuditId),
    lighthouseCategory: toNullableString(metadata.lighthouseCategory),
    kind: metadata.kind,
    score: toNullableNumber(metadata.score),
    scoreDisplayMode: toNullableString(metadata.scoreDisplayMode),
    displayValue: toNullableString(metadata.displayValue),
    numericValue: toNullableNumber(metadata.numericValue),
    estimatedSavingsMs: toNullableNumber(metadata.estimatedSavingsMs),
    estimatedSavingsBytes: toNullableNumber(metadata.estimatedSavingsBytes),
    summary,
    impact: toNullableString(metadata.impact),
    primaryAction: toNullableString(metadata.primaryAction),
    headings,
    topOffenders,
    url: toNullableString(metadata.url),
  };
}

export function getPerformanceIssuePriority(issue: AuditIssue): number {
  const metadata = parsePerformanceIssueMetadata(issue.metadata);
  const severityWeight = {
    CRITICAL: 5000,
    MAJOR: 3000,
    MINOR: 1000,
    INFO: 250,
  }[issue.severity];
  const kindWeight = metadata
    ? {
        "image-delivery": 900,
        "resource-waste": 800,
        metric: 700,
        "render-blocking": 600,
        font: 500,
        layout: 450,
        cache: 350,
        network: 300,
        general: 200,
      }[metadata.kind]
    : 0;

  return (
    severityWeight +
    kindWeight +
    (metadata?.estimatedSavingsBytes ?? 0) / 1024 +
    (metadata?.estimatedSavingsMs ?? 0) * 2 +
    (metadata?.topOffenders.length ?? 0)
  );
}

export function sortPerformanceIssues(issues: AuditIssue[]): AuditIssue[] {
  return [...issues].sort((a, b) => {
    const diff = getPerformanceIssuePriority(b) - getPerformanceIssuePriority(a);
    if (diff !== 0) return diff;
    return a.title.localeCompare(b.title);
  });
}
