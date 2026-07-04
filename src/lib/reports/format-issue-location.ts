import { parseElementSnippet } from "@/lib/parse-element-snippet";
import type { Issue } from "@prisma/client";
import { escapeHtml } from "@/lib/reports/report-html-shared";

type IssueMetadata = {
  html?: string;
  axeId?: string;
  elementId?: string;
  elementClass?: string;
  elementTag?: string;
  parentTag?: string;
  parentId?: string;
  parentClass?: string;
  src?: string;
};

export { parseElementSnippet };

function formatClassHint(className: string) {
  const classes = className.trim().split(/\s+/).filter(Boolean);
  if (classes.length === 0) return null;
  if (classes.length === 1) return `.${classes[0]}`;
  return `.${classes.slice(0, 3).join(".")}${classes.length > 3 ? " …" : ""}`;
}

function elementHints(meta: IssueMetadata, fromHtml: ReturnType<typeof parseElementSnippet>) {
  const tag = meta.elementTag ?? fromHtml.elementTag;
  const id = meta.elementId ?? fromHtml.elementId;
  const className = meta.elementClass ?? fromHtml.elementClass;

  const hints: string[] = [];
  if (tag) hints.push(`<${tag}>`);
  if (id) hints.push(`#${id}`);
  const classHint = className ? formatClassHint(className) : null;
  if (classHint) hints.push(classHint);
  return hints;
}

function parentHints(meta: IssueMetadata) {
  if (!meta.parentTag && !meta.parentId && !meta.parentClass) return null;

  const hints: string[] = [];
  if (meta.parentTag) hints.push(`<${meta.parentTag}>`);
  if (meta.parentId) hints.push(`#${meta.parentId}`);
  const parentClass = meta.parentClass ? formatClassHint(meta.parentClass) : null;
  if (parentClass) hints.push(parentClass);

  return hints.length > 0 ? hints.join(" ") : null;
}

/** Plain-text location for CSV or logs. */
export function formatIssueLocation(issue: Issue): string {
  return formatIssueLocationLines(issue).join(" · ") || "—";
}

function formatIssueLocationLines(issue: Issue): string[] {
  const meta = (issue.metadata ?? {}) as IssueMetadata;
  const fromHtml = parseElementSnippet(meta.html);
  const lines: string[] = [];

  if (issue.selector) {
    lines.push(`Selector: ${issue.selector}`);
  }

  const hints = elementHints(meta, fromHtml);
  if (hints.length > 0) {
    lines.push(`Element: ${hints.join(" ")}`);
  }

  const parent = parentHints(meta);
  if (parent) {
    lines.push(`Parent: ${parent}`);
  }

  if (hints.length === 0 && !parent && meta.src) {
    lines.push(`Src: ${meta.src}`);
  }

  if (issue.url) {
    lines.push(`URL: ${issue.url}`);
  }

  return lines;
}

/** HTML location cell with line breaks — id/class help devs find the node quickly. */
export function formatIssueLocationHtml(issue: Issue): string {
  const lines = formatIssueLocationLines(issue);
  if (lines.length === 0) return "—";
  return lines.map((line) => escapeHtml(line)).join("<br/>");
}

export function dedupeIssuesByTitle(issues: Issue[]) {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = issue.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
