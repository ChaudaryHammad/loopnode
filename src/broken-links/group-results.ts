import type { BrokenLinkFinding } from "./types";

const SEVERITY_RANK: Record<string, number> = {
  CRITICAL: 0,
  MAJOR: 1,
  MINOR: 2,
  INFO: 3,
};

export interface GroupedBrokenLinkOccurrence {
  sourcePageUrl: string;
  elementTag: string | null;
  elementId: string | null;
  elementClass: string | null;
  elementText: string | null;
  selector: string | null;
  attribute: string | null;
}

export interface GroupedBrokenLink {
  href: string;
  statusCode: number | null;
  errorMessage: string | null;
  severity: string;
  occurrences: GroupedBrokenLinkOccurrence[];
}

export function countUniqueBrokenHrefs(findings: Pick<BrokenLinkFinding, "href">[]): number {
  return new Set(findings.map((f) => f.href)).size;
}

export function groupBrokenLinkFindings(
  findings: BrokenLinkFinding[]
): GroupedBrokenLink[] {
  const map = new Map<string, GroupedBrokenLink>();

  for (const finding of findings) {
    let group = map.get(finding.href);
    if (!group) {
      group = {
        href: finding.href,
        statusCode: finding.statusCode,
        errorMessage: finding.errorMessage,
        severity: finding.severity,
        occurrences: [],
      };
      map.set(finding.href, group);
    }

    const rank = SEVERITY_RANK[finding.severity] ?? 9;
    const currentRank = SEVERITY_RANK[group.severity] ?? 9;
    if (rank < currentRank) {
      group.severity = finding.severity;
    }

    group.occurrences.push({
      sourcePageUrl: finding.sourcePageUrl,
      elementTag: finding.elementTag,
      elementId: finding.elementId ?? null,
      elementClass: finding.elementClass ?? null,
      elementText: finding.elementText ?? null,
      selector: finding.selector,
      attribute: finding.attribute,
    });
  }

  return [...map.values()].sort((a, b) => {
    const sev = (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9);
    if (sev !== 0) return sev;
    return a.href.localeCompare(b.href);
  });
}
