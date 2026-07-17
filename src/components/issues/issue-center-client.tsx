"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Gauge,
  Globe,
  Info,
  RotateCcw,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import {
  bulkDeleteIssuesAction,
  bulkUpdateIssueStatusAction,
  deleteIssueAction,
  updateIssueStatusAction,
  type PortfolioIssue,
} from "@/actions/issues";
import { CATEGORY_LABELS } from "@/lib/issues";
import { formatDateTime } from "@/lib/utils";
import {
  SeverityIcon,
  severityBadgeClass,
  type IssueSeverity,
} from "@/components/websites/audit-shared";
import {
  formatSavingsBytes,
  formatSavingsMs,
  parsePerformanceIssueMetadata,
} from "@/lib/audit/performance-issue-metadata";
import { toast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SerializedPortfolioIssue = Omit<
  PortfolioIssue,
  "createdAt" | "acknowledgedAt" | "scanCompletedAt"
> & {
  createdAt: string;
  acknowledgedAt: string | null;
  scanCompletedAt: string | null;
  metadata?: unknown;
};

interface IssueCenterClientProps {
  websites: { id: string; name: string; url: string }[];
  issues: SerializedPortfolioIssue[];
}

type StatusFilter = "ALL" | "OPEN" | "ACKNOWLEDGED";
type CategoryFilter = PortfolioIssue["category"] | "ALL";
type SeverityFilter = IssueSeverity | "ALL";

const SEVERITIES: IssueSeverity[] = ["CRITICAL", "MAJOR", "MINOR", "INFO"];
const CATEGORIES = ["PERFORMANCE", "ACCESSIBILITY", "SEO", "SECURITY", "BROKEN_LINKS"] as const;
const PAGE_SIZE = 20;

function CategoryIcon({ category }: { category: PortfolioIssue["category"] }) {
  const className = "size-3.5";
  switch (category) {
    case "PERFORMANCE":
      return <Gauge className={className} />;
    case "ACCESSIBILITY":
      return <Eye className={className} />;
    case "SEO":
      return <Search className={className} />;
    case "SECURITY":
      return <Shield className={className} />;
    default:
      return <Globe className={className} />;
  }
}

function exportIssuesCsv(issues: SerializedPortfolioIssue[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = [
    "Website",
    "Category",
    "Severity",
    "Status",
    "Title",
    "Description",
    "Recommendation",
    "Selector",
    "URL",
    "Last scan",
  ];
  const rows = issues.map((issue) =>
    [
      issue.websiteName,
      CATEGORY_LABELS[issue.category],
      issue.severity,
      issue.status,
      issue.title,
      issue.description,
      issue.recommendation ?? "",
      issue.selector ?? "",
      issue.url ?? "",
      issue.scanCompletedAt ? formatDateTime(issue.scanCompletedAt) : "",
    ]
      .map(escape)
      .join(",")
  );

  const blob = new Blob([[header.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `loopnode-issues-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function IssueCenterClient({ websites, issues: initialIssues }: IssueCenterClientProps) {
  const router = useRouter();
  const [issues, setIssues] = useState(initialIssues);
  const [search, setSearch] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("OPEN");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIssues(initialIssues);
  }, [initialIssues]);

  const stats = useMemo(() => {
    const active = issues.filter((i) => i.status !== "RESOLVED");
    return {
      total: active.length,
      critical: active.filter((i) => i.severity === "CRITICAL").length,
      major: active.filter((i) => i.severity === "MAJOR").length,
      open: active.filter((i) => i.status === "OPEN").length,
      acknowledged: active.filter((i) => i.status === "ACKNOWLEDGED").length,
      byCategory: CATEGORIES.reduce(
        (acc, cat) => {
          acc[cat] = active.filter((i) => i.category === cat).length;
          return acc;
        },
        {} as Record<(typeof CATEGORIES)[number], number>
      ),
    };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();

    return issues.filter((issue) => {
      if (issue.status === "RESOLVED") return false;
      if (statusFilter !== "ALL" && issue.status !== statusFilter) return false;
      if (websiteFilter !== "ALL" && issue.websiteId !== websiteFilter) return false;
      if (categoryFilter !== "ALL" && issue.category !== categoryFilter) return false;
      if (severityFilter !== "ALL" && issue.severity !== severityFilter) return false;

      if (!query) return true;

      return (
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query) ||
        issue.websiteName.toLowerCase().includes(query) ||
        (issue.selector?.toLowerCase().includes(query) ?? false) ||
        (issue.url?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [issues, search, websiteFilter, categoryFilter, severityFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredIssues.length / PAGE_SIZE));
  const paginatedIssues = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredIssues.slice(start, start + PAGE_SIZE);
  }, [filteredIssues, page]);

  useEffect(() => {
    setPage(1);
  }, [search, websiteFilter, categoryFilter, severityFilter, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageStart = filteredIssues.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, filteredIssues.length);

  const allPageSelected =
    paginatedIssues.length > 0 && paginatedIssues.every((i) => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedIssues.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedIssues.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateLocalStatus = (ids: string[], status: "OPEN" | "ACKNOWLEDGED") => {
    setIssues((prev) =>
      prev.map((issue) =>
        ids.includes(issue.id)
          ? {
              ...issue,
              status,
              acknowledgedAt: status === "ACKNOWLEDGED" ? new Date().toISOString() : null,
            }
          : issue
      )
    );
    setSelectedIds(new Set());
  };

  const removeLocalIssues = (ids: string[]) => {
    setIssues((prev) => prev.filter((issue) => !ids.includes(issue.id)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    if (expandedId && ids.includes(expandedId)) {
      setExpandedId(null);
    }
  };

  const handleDismiss = (issueId: string, title: string) => {
    if (!confirm(`Dismiss "${title}"? It will be permanently removed from your issue list.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteIssueAction(issueId);
      if (res.success) {
        removeLocalIssues([issueId]);
        toast.fromAction(res, { success: "Issue dismissed." });
        router.refresh();
      } else {
        toast.fromAction(res, { error: "Failed to dismiss issue." });
      }
    });
  };

  const handleBulkDismiss = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (
      !confirm(
        `Dismiss ${ids.length} selected issue${ids.length === 1 ? "" : "s"}? They will be permanently removed.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await bulkDeleteIssuesAction(ids);
      if (res.success) {
        removeLocalIssues(ids);
        toast.fromAction(res, { success: "Issues dismissed." });
        router.refresh();
      } else {
        toast.fromAction(res, { error: "Failed to dismiss issues." });
      }
    });
  };

  const handleStatusUpdate = (issueId: string, status: "OPEN" | "ACKNOWLEDGED") => {
    startTransition(async () => {
      const res = await updateIssueStatusAction(issueId, status);
      if (res.success) {
        updateLocalStatus([issueId], status);
        toast.fromAction(res, { success: "Issue updated." });
        router.refresh();
      } else {
        toast.fromAction(res, { error: "Failed to update issue." });
      }
    });
  };

  const handleBulkAcknowledge = (status: "OPEN" | "ACKNOWLEDGED") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      const res = await bulkUpdateIssueStatusAction(ids, status);
      if (res.success) {
        updateLocalStatus(ids, status);
        toast.fromAction(res, { success: "Issues updated." });
        router.refresh();
      } else {
        toast.fromAction(res, { error: "Failed to update issues." });
      }
    });
  };

  const hasWebsites = websites.length > 0;
  const hasAnyIssues = issues.some((i) => i.status !== "RESOLVED");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Open findings from your latest audits across all connected websites.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-border/30">
          <CardHeader className="pb-2">
            <CardDescription>Total active</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-rose-500/20 bg-rose-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-rose-500">
              <AlertOctagon className="size-3.5" />
              Critical
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums text-rose-500">{stats.critical}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-amber-500">
              <AlertTriangle className="size-3.5" />
              Major
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums text-amber-500">{stats.major}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-border/30">
          <CardHeader className="pb-2">
            <CardDescription>Open / acknowledged</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {stats.open}
              <span className="text-lg font-normal text-muted-foreground"> / {stats.acknowledged}</span>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {hasAnyIssues && (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const count = stats.byCategory[cat];
            if (count === 0) return null;
            return (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "secondary" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(categoryFilter === cat ? "ALL" : cat)}
              >
                <CategoryIcon category={cat} />
                {CATEGORY_LABELS[cat]} ({count})
              </Button>
            );
          })}
        </div>
      )}

      <Card className="rounded-2xl border-border/30">
        <CardHeader className="gap-4 border-b border-border/30 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issues, sites, selectors…"
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filteredIssues.length === 0}
                onClick={() => exportIssuesCsv(filteredIssues)}
              >
                <Download />
                Export CSV
              </Button>
              {selectedIds.size > 0 && (
                <>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleBulkAcknowledge("ACKNOWLEDGED")}
                  >
                    <CheckCheck />
                    Acknowledge ({selectedIds.size})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleBulkAcknowledge("OPEN")}
                  >
                    <RotateCcw />
                    Reopen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={handleBulkDismiss}
                    className="text-rose-500 hover:text-rose-500"
                  >
                    <Trash2 />
                    Dismiss ({selectedIds.size})
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === "OPEN" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("OPEN")}
            >
              Open ({stats.open})
            </Button>
            <Button
              variant={statusFilter === "ACKNOWLEDGED" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("ACKNOWLEDGED")}
            >
              Acknowledged ({stats.acknowledged})
            </Button>
            <Button
              variant={statusFilter === "ALL" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("ALL")}
            >
              <Filter />
              All active
            </Button>

            {SEVERITIES.map((sev) => (
              <Button
                key={sev}
                variant={severityFilter === sev ? "secondary" : "outline"}
                size="sm"
                className={severityFilter === sev ? severityBadgeClass(sev) : undefined}
                onClick={() => setSeverityFilter(severityFilter === sev ? "ALL" : sev)}
              >
                <SeverityIcon severity={sev} />
                {sev.charAt(0) + sev.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>

          {hasWebsites && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={websiteFilter === "ALL" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setWebsiteFilter("ALL")}
              >
                All sites
              </Button>
              {websites.map((site) => (
                <Button
                  key={site.id}
                  variant={websiteFilter === site.id ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setWebsiteFilter(websiteFilter === site.id ? "ALL" : site.id)}
                >
                  <Globe className="size-3.5" />
                  {site.name}
                </Button>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {!hasWebsites ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Globe className="size-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">No websites connected</CardTitle>
                <CardDescription>
                  Connect a website and run an audit to populate your issue inbox.
                </CardDescription>
              </div>
              <ButtonLink href="/dashboard/websites">Go to websites</ButtonLink>
            </div>
          ) : !hasAnyIssues ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <CheckCheck className="size-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">No open issues</CardTitle>
                <CardDescription>
                  Your latest audits look clean. Run new scans anytime to catch regressions.
                </CardDescription>
              </div>
              <ButtonLink href="/dashboard/websites" variant="outline">
                View websites
              </ButtonLink>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <Info className="size-8 text-muted-foreground" />
              <CardTitle className="text-base">No issues match your filters</CardTitle>
              <CardDescription>Try clearing search or changing severity/site filters.</CardDescription>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setWebsiteFilter("ALL");
                  setCategoryFilter("ALL");
                  setSeverityFilter("ALL");
                  setStatusFilter("OPEN");
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all issues on this page"
                    />
                  </TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead className="hidden md:table-cell">Website</TableHead>
                  <TableHead className="hidden lg:table-cell">Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedIssues.map((issue) => {
                  const isExpanded = expandedId === issue.id;
                  return (
                    <React.Fragment key={issue.id}>
                      <TableRow className="group">
                        <TableCell className="pl-4">
                          <Checkbox
                            checked={selectedIds.has(issue.id)}
                            onCheckedChange={() => toggleSelect(issue.id)}
                            aria-label={`Select ${issue.title}`}
                          />
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <button
                            type="button"
                            className="w-full text-left"
                            onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                          >
                            <p className="truncate text-sm font-medium text-foreground">
                              {issue.title}
                            </p>
                            {(() => {
                              const meta = parsePerformanceIssueMetadata(issue.metadata);
                              const savings = [
                                formatSavingsBytes(meta?.estimatedSavingsBytes),
                                formatSavingsMs(meta?.estimatedSavingsMs),
                              ]
                                .filter(Boolean)
                                .join(" / ");
                              if (!savings && !meta?.metricTags?.length) {
                                return (
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground md:hidden">
                                    {issue.websiteName}
                                  </p>
                                );
                              }
                              return (
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {savings ? (
                                    <span className="text-[11px] font-medium text-rose-400">
                                      Est savings {savings}
                                    </span>
                                  ) : null}
                                  {meta?.metricTags?.slice(0, 3).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-[9px] border-border/30 text-muted-foreground"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {(meta?.topOffenders.length ?? 0) > 0 ? (
                                    <span className="text-[11px] text-muted-foreground">
                                      {meta?.topOffenders.length} offenders
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })()}
                            <p className="mt-0.5 truncate text-xs text-muted-foreground md:hidden">
                              {issue.websiteName}
                            </p>
                          </button>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Link
                            href={`/dashboard/websites/${issue.websiteId}`}
                            className="text-sm font-medium hover:text-primary hover:underline"
                          >
                            {issue.websiteName}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline" className="gap-1">
                            <CategoryIcon category={issue.category} />
                            {CATEGORY_LABELS[issue.category]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${severityBadgeClass(issue.severity)}`}
                          >
                            <SeverityIcon severity={issue.severity} />
                            {issue.severity.charAt(0) + issue.severity.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={issue.status === "OPEN" ? "secondary" : "outline"}>
                            {issue.status === "OPEN" ? "Open" : "Acknowledged"}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={isExpanded ? "Collapse" : "Expand"}
                              onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                            >
                              {isExpanded ? <ChevronUp /> : <ChevronDown />}
                            </Button>
                            <ButtonLink
                              href={issue.auditPath}
                              variant="ghost"
                              size="icon-sm"
                              title="View in audit"
                            >
                              <ExternalLink />
                            </ButtonLink>
                            {issue.status === "OPEN" ? (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Acknowledge"
                                disabled={isPending}
                                onClick={() => handleStatusUpdate(issue.id, "ACKNOWLEDGED")}
                              >
                                <CheckCheck />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Reopen"
                                disabled={isPending}
                                onClick={() => handleStatusUpdate(issue.id, "OPEN")}
                              >
                                <RotateCcw />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Dismiss"
                              disabled={isPending}
                              className="text-muted-foreground hover:text-rose-500"
                              onClick={() => handleDismiss(issue.id, issue.title)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={7} className="px-4 py-4">
                            {(() => {
                              const meta = parsePerformanceIssueMetadata(issue.metadata);
                              const offenders = meta?.topOffenders ?? [];
                              return (
                                <div className="space-y-3 text-sm">
                                  <p className="leading-relaxed text-muted-foreground">
                                    {issue.description}
                                  </p>
                                  {meta?.impact ? (
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                      {meta.impact}
                                    </p>
                                  ) : null}
                                  {issue.recommendation && (
                                    <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                                      <p className="mb-1 text-xs font-semibold text-primary">
                                        Recommendation
                                      </p>
                                      <p className="text-xs leading-relaxed text-muted-foreground">
                                        {issue.recommendation}
                                      </p>
                                    </div>
                                  )}
                                  {(meta?.estimatedSavingsBytes != null ||
                                    meta?.estimatedSavingsMs != null) && (
                                    <div className="flex flex-wrap gap-3 text-xs">
                                      {meta.estimatedSavingsBytes != null ? (
                                        <span>
                                          Byte savings:{" "}
                                          <strong>
                                            {formatSavingsBytes(meta.estimatedSavingsBytes)}
                                          </strong>
                                        </span>
                                      ) : null}
                                      {meta.estimatedSavingsMs != null ? (
                                        <span>
                                          Time savings:{" "}
                                          <strong>
                                            {formatSavingsMs(meta.estimatedSavingsMs)}
                                          </strong>
                                        </span>
                                      ) : null}
                                    </div>
                                  )}
                                  {offenders.length > 0 ? (
                                    <div className="rounded-xl border border-border/30 overflow-hidden">
                                      <div className="border-b border-border/30 bg-secondary/20 px-3 py-2 text-xs font-semibold">
                                        Top offenders ({offenders.length})
                                      </div>
                                      <div className="divide-y divide-border/20">
                                        {offenders.slice(0, 8).map((offender, index) => (
                                          <div
                                            key={`${offender.label}-${index}`}
                                            className="flex items-start justify-between gap-3 px-3 py-2 text-xs"
                                          >
                                            <div className="min-w-0">
                                              <p className="truncate font-medium">
                                                {offender.url ?? offender.label}
                                              </p>
                                              {offender.selector ? (
                                                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                                                  {offender.selector}
                                                </p>
                                              ) : null}
                                            </div>
                                            <span className="shrink-0 tabular-nums text-rose-400">
                                              {formatSavingsBytes(offender.wastedBytes) ??
                                                formatSavingsMs(offender.wastedMs) ??
                                                "—"}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                  {(issue.selector || issue.url) && (
                                    <div className="space-y-1 font-mono text-xs text-muted-foreground">
                                      {issue.selector && <p>Selector: {issue.selector}</p>}
                                      {issue.url && <p>URL: {issue.url}</p>}
                                    </div>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    Last seen in audit:{" "}
                                    {issue.scanCompletedAt
                                      ? formatDateTime(issue.scanCompletedAt)
                                      : "—"}
                                  </p>
                                </div>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-border/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {pageStart}–{pageEnd} of {filteredIssues.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
