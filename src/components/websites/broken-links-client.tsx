"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ReliableLink } from "@/components/ui/reliable-link";
import {
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Home,
  ExternalLink,
  Square,
  Eye,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  startBrokenLinkScanAction,
  getBrokenLinkScanStatusAction,
  getBrokenLinkResultsAction,
  cancelBrokenLinkScanAction,
} from "@/actions/broken-links";
import { groupBrokenLinkFindings, type GroupedBrokenLink } from "@/broken-links/group-results";
import { formatDateTime, formatNumber, cn } from "@/lib/utils";
import type { BrokenLinkScanMode } from "@prisma/client";
import {
  ALL_LINK_RESOURCE_TYPES,
  LINK_RESOURCE_OPTIONS,
  type LinkResourceType,
} from "@/lib/scanner/link-resource-types";
import { SeverityIcon, severityBadgeClass } from "@/components/websites/audit-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

type Severity = "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
type SeverityFilter = Severity | "ALL";

const SEVERITIES: Severity[] = ["CRITICAL", "MAJOR", "MINOR", "INFO"];

interface SerializedResult {
  id: string;
  href: string;
  sourcePageUrl: string;
  statusCode: number | null;
  errorMessage: string | null;
  elementTag: string | null;
  elementId: string | null;
  elementClass: string | null;
  elementText: string | null;
  selector: string | null;
  attribute: string | null;
  severity: Severity;
}

interface SerializedScan {
  id: string;
  status: string;
  mode: BrokenLinkScanMode;
  resourceTypes: LinkResourceType[];
  phase: string | null;
  statusMessage: string | null;
  pagesDiscovered: number;
  pagesCrawled: number;
  linksFound: number;
  linksChecked: number;
  brokenCount: number;
  progressPercent: number;
  errorMessage: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface BrokenLinksClientProps {
  websiteId: string;
  websiteName: string;
  websiteUrl: string;
  initialScan: SerializedScan | null;
  initialResults?: SerializedResult[];
  /** Approximate URL count from sitemap.xml (guidance only). */
  sitemapApproxUrls?: number | null;
}

const PROGRESS_STEPS = [
  { id: "crawl", label: "Crawl", phases: ["initializing", "crawling"] },
  { id: "collect", label: "Collect", phases: ["collecting"] },
  { id: "check", label: "Verify", phases: ["checking"] },
  { id: "done", label: "Report", phases: ["completed", "cancelled", "failed"] },
] as const;

function CopyIconButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      title={`Copy ${label}`}
      className="shrink-0"
    >
      {copied ? <Check className="text-emerald-400" /> : <Copy />}
    </Button>
  );
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function Metric({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  highlight?: "good" | "bad";
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/60 px-4 py-3.5 min-w-0">
      <p className="text-[11px] text-muted-foreground mb-1.5 truncate">{label}</p>
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums leading-none tracking-tight",
          highlight === "good" && "text-emerald-400",
          highlight === "bad" && "text-rose-400",
          !highlight && "text-foreground"
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{hint}</p> : null}
    </div>
  );
}

function coverageHint(approx: number | null | undefined, crawled: number): string | null {
  if (approx == null || approx <= 0) return null;
  const pct = Math.min(100, Math.round((crawled / approx) * 100));
  return `~${pct}% of sitemap estimate`;
}

function ModeToggle({
  value,
  disabled,
  onChange,
}: {
  value: BrokenLinkScanMode;
  disabled?: boolean;
  onChange: (mode: BrokenLinkScanMode) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border/40 bg-secondary/15 p-1 gap-1">
      {(
        [
          { id: "INTERNAL" as const, label: "Internal", icon: Home },
          { id: "EXTERNAL" as const, label: "External", icon: ExternalLink },
        ] as const
      ).map((option) => {
        const active = value === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function GroupedResultCard({ group }: { group: GroupedBrokenLink }) {
  const [open, setOpen] = useState(false);
  const statusLabel =
    group.statusCode !== null ? `HTTP ${group.statusCode}` : "Unreachable";
  const primary = group.occurrences[0];

  return (
    <article className="group rounded-xl border border-border/35 bg-card px-4 py-3.5 hover:border-border/60 transition-colors">
      <div className="flex items-start gap-3">
        <div className="pt-0.5 shrink-0 space-y-1.5">
          <Badge
            variant="outline"
            className={cn(
              "tabular-nums font-mono text-[11px]",
              group.statusCode === null || group.statusCode >= 400
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-secondary/40 border-border/30 text-muted-foreground"
            )}
          >
            {statusLabel}
          </Badge>
          <Badge variant="outline" className={cn("text-[10px]", severityBadgeClass(group.severity as Severity))}>
            {group.severity.charAt(0) + group.severity.slice(1).toLowerCase()}
          </Badge>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <a
            href={group.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-foreground hover:text-primary break-all leading-snug font-medium"
          >
            {group.href}
          </a>
          <p className="text-xs text-muted-foreground">
            Found on{" "}
            <span className="font-medium text-foreground tabular-nums">
              {group.occurrences.length}
            </span>{" "}
            page{group.occurrences.length === 1 ? "" : "s"}
            {!open && group.occurrences.length === 1 ? (
              <>
                {" · "}
                <a
                  href={group.occurrences[0]!.sourcePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground break-all"
                >
                  {group.occurrences[0]!.sourcePageUrl}
                </a>
              </>
            ) : null}
          </p>
          {open ? (
            <div className="pt-2 space-y-3 text-xs text-muted-foreground">
              {group.errorMessage ? <p>{group.errorMessage}</p> : null}
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Source pages
                </p>
                <ul className="space-y-1.5">
                  {group.occurrences.map((occurrence) => (
                    <li key={occurrence.sourcePageUrl} className="rounded-lg border border-border/25 px-3 py-2">
                      <a
                        href={occurrence.sourcePageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:text-foreground break-all text-foreground/90"
                      >
                        {occurrence.sourcePageUrl}
                      </a>
                      <div className="font-mono break-all space-y-0.5 opacity-90 mt-1.5">
                        <p>
                          &lt;{occurrence.elementTag ?? "a"}&gt;
                          {occurrence.attribute ? ` [${occurrence.attribute}]` : ""}
                        </p>
                        {occurrence.selector ? <p>{occurrence.selector}</p> : null}
                        {occurrence.elementText ? <p>&quot;{occurrence.elementText}&quot;</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {primary ? (
                <div className="font-mono break-all space-y-0.5 opacity-75">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    First match element
                  </p>
                  <p>
                    &lt;{primary.elementTag ?? "a"}&gt;
                    {primary.attribute ? ` [${primary.attribute}]` : ""}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100">
          <CopyIconButton text={group.href} label="broken URL" />
          <Button variant="ghost" size="icon-sm" onClick={() => setOpen((v) => !v)} title="Source pages">
            {open ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </div>
    </article>
  );
}

function serializedResultsToGrouped(results: SerializedResult[]): GroupedBrokenLink[] {
  return groupBrokenLinkFindings(
    results.map((r) => ({
      href: r.href,
      sourcePageUrl: r.sourcePageUrl,
      statusCode: r.statusCode,
      errorMessage: r.errorMessage,
      elementTag: r.elementTag ?? "a",
      elementId: r.elementId ?? undefined,
      elementClass: r.elementClass ?? undefined,
      elementText: r.elementText ?? undefined,
      selector: r.selector ?? "",
      attribute: r.attribute ?? "href",
      severity: r.severity,
    }))
  );
}

function createOptimisticScan(mode: BrokenLinkScanMode, resourceTypes: LinkResourceType[]): SerializedScan {
  return {
    id: "pending",
    status: "RUNNING",
    mode,
    resourceTypes,
    phase: "initializing",
    statusMessage: "Starting scan…",
    pagesDiscovered: 0,
    pagesCrawled: 0,
    linksFound: 0,
    linksChecked: 0,
    brokenCount: 0,
    progressPercent: 0,
    errorMessage: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
}

function findingsToResults(
  findings: Array<{
    href: string;
    sourcePageUrl: string;
    statusCode: number | null;
    errorMessage: string | null;
    elementTag: string;
    elementId?: string | null;
    elementClass?: string | null;
    elementText?: string | null;
    selector: string;
    attribute: string;
    severity: string;
  }>
): SerializedResult[] {
  return findings.map((f, index) => ({
    id: `${index}-${f.href.slice(0, 40)}`,
    href: f.href,
    sourcePageUrl: f.sourcePageUrl,
    statusCode: f.statusCode,
    errorMessage: f.errorMessage,
    elementTag: f.elementTag,
    elementId: f.elementId ?? null,
    elementClass: f.elementClass ?? null,
    elementText: f.elementText ?? null,
    selector: f.selector,
    attribute: f.attribute,
    severity: f.severity as Severity,
  }));
}

function serializeScan(scan: {
  id: string;
  status: string;
  mode: BrokenLinkScanMode;
  phase: string | null;
  statusMessage: string | null;
  pagesDiscovered: number;
  pagesCrawled: number;
  linksFound: number;
  linksChecked: number;
  brokenCount: number;
  progressPercent: number;
  errorMessage: string | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
}): SerializedScan {
  return {
    id: scan.id,
    status: scan.status,
    mode: scan.mode,
    resourceTypes: [...ALL_LINK_RESOURCE_TYPES],
    phase: scan.phase,
    statusMessage: scan.statusMessage,
    pagesDiscovered: scan.pagesDiscovered,
    pagesCrawled: scan.pagesCrawled,
    linksFound: scan.linksFound,
    linksChecked: scan.linksChecked,
    brokenCount: scan.brokenCount,
    progressPercent: scan.progressPercent,
    errorMessage: scan.errorMessage,
    completedAt:
      typeof scan.completedAt === "string"
        ? scan.completedAt
        : scan.completedAt?.toISOString() ?? null,
    createdAt:
      typeof scan.createdAt === "string"
        ? scan.createdAt
        : scan.createdAt.toISOString(),
  };
}

function dbResultsToSerialized(
  results: Array<{
    id: string;
    href: string;
    sourcePageUrl: string;
    statusCode: number | null;
    errorMessage: string | null;
    elementTag: string | null;
    elementId: string | null;
    elementClass: string | null;
    elementText: string | null;
    selector: string | null;
    attribute: string | null;
    severity: string;
  }>
): SerializedResult[] {
  return results.map((r) => ({
    id: r.id,
    href: r.href,
    sourcePageUrl: r.sourcePageUrl,
    statusCode: r.statusCode,
    errorMessage: r.errorMessage,
    elementTag: r.elementTag,
    elementId: r.elementId,
    elementClass: r.elementClass,
    elementText: r.elementText,
    selector: r.selector,
    attribute: r.attribute,
    severity: r.severity as Severity,
  }));
}

function progressStepStatus(
  stepId: (typeof PROGRESS_STEPS)[number]["id"],
  phase: string | null,
  percent: number
): "done" | "active" | "upcoming" {
  if (percent >= 100 || phase === "completed") return "done";
  const activeIdx = PROGRESS_STEPS.findIndex((s) =>
    s.phases.includes((phase ?? "initializing") as never)
  );
  const idx = PROGRESS_STEPS.findIndex((s) => s.id === stepId);
  const resolvedActive = activeIdx >= 0 ? activeIdx : 0;
  if (idx < resolvedActive) return "done";
  if (idx === resolvedActive) return "active";
  return "upcoming";
}

function parsePdfFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const match = /filename="([^"]+)"/i.exec(contentDisposition);
  return match?.[1] ?? null;
}

export function BrokenLinksClient({
  websiteId,
  websiteName,
  websiteUrl,
  initialScan,
  initialResults = [],
  sitemapApproxUrls = null,
}: BrokenLinksClientProps) {
  const [activeScan, setActiveScan] = useState<SerializedScan | null>(initialScan);
  const [liveResults, setLiveResults] = useState<SerializedResult[]>(initialResults);
  const [selectedTypes, setSelectedTypes] = useState<LinkResourceType[]>([...ALL_LINK_RESOURCE_TYPES]);
  const [scanMode, setScanMode] = useState<BrokenLinkScanMode>(
    initialScan?.mode ?? "INTERNAL"
  );
  const [isStarting, setIsStarting] = useState(false);
  const [isHalting, setIsHalting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoadingAction, setPdfLoadingAction] = useState<"view" | "download" | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [resultSearch, setResultSearch] = useState("");
  // Prefer results first when a prior scan exists; open config only for first run.
  const [showConfig, setShowConfig] = useState(
    !initialResults.length && initialScan?.status !== "COMPLETED"
  );
  const [pollingId, setPollingId] = useState<string | null>(
    initialScan?.status === "RUNNING" ? initialScan.id : null
  );
  const [elapsedMs, setElapsedMs] = useState(0);

  const overviewHref = `/dashboard/websites/${websiteId}`;
  const isRunning =
    activeScan?.status === "RUNNING" || activeScan?.status === "PENDING";
  const isScanning = isRunning || isStarting;
  const showProgress = isScanning;

  const loadFullResults = useCallback(async (scanId: string) => {
    const res = await getBrokenLinkResultsAction(scanId);
    if (res.success && Array.isArray(res.data)) {
      setLiveResults(dbResultsToSerialized(res.data));
    }
  }, []);

  const pollScan = useCallback(async (scanId: string) => {
    const res = await getBrokenLinkScanStatusAction(scanId);
    if (res.success && res.data) {
      setActiveScan((prev) => ({
        ...serializeScan(res.data),
        resourceTypes: prev?.resourceTypes ?? [...ALL_LINK_RESOURCE_TYPES],
      }));
      const status = res.data.status;
      const finished =
        status !== "RUNNING" &&
        status !== "PENDING" &&
        (status === "COMPLETED" || res.data.phase === "cancelled");
      if (finished) {
        await loadFullResults(scanId);
      } else if (Array.isArray(res.data.results) && res.data.results.length > 0) {
        setLiveResults(dbResultsToSerialized(res.data.results));
      }
      return status;
    }
    return "FAILED";
  }, [loadFullResults]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  useEffect(() => {
    if (!pollingId) return;
    void pollScan(pollingId);
    const interval = setInterval(async () => {
      const status = await pollScan(pollingId);
      if (status !== "RUNNING" && status !== "PENDING") setPollingId(null);
    }, 1000);
    return () => clearInterval(interval);
  }, [pollingId, pollScan]);

  useEffect(() => {
    if (!isScanning || !activeScan?.createdAt) {
      setElapsedMs(0);
      return;
    }
    const started = new Date(activeScan.createdAt).getTime();
    const tick = () => setElapsedMs(Math.max(0, Date.now() - started));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isScanning, activeScan?.createdAt, activeScan?.id]);

  const toggleResourceType = (type: LinkResourceType) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );
  };

  const handleStartScan = async () => {
    if (selectedTypes.length === 0) {
      setError("Select at least one link type.");
      return;
    }

    setError(null);
    setIsStarting(true);
    setLiveResults([]);
    setSeverityFilter("ALL");
    setResultSearch("");
    setShowConfig(false);
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setPdfFilename(null);
    setActiveScan(createOptimisticScan(scanMode, selectedTypes));

    try {
      const res = await startBrokenLinkScanAction(websiteId, scanMode, selectedTypes);
      if (!res.success || !res.data?.scanId) {
        setError(res.error ?? "Failed to start scan.");
        setActiveScan(initialScan);
        setShowConfig(true);
        return;
      }

      const scanId = res.data.scanId;
      setPollingId(scanId);
      await pollScan(scanId);

      void fetch(`/api/broken-links/${scanId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceTypes: selectedTypes }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) setError(data.error ?? "Scan failed.");
          await loadFullResults(scanId);
          await pollScan(scanId);
        })
        .catch(() => setError("Lost connection. Refresh and try again."))
        .finally(async () => {
          await pollScan(scanId);
          setPollingId(null);
          setIsStarting(false);
        });
    } catch {
      setError("Something went wrong starting the scan.");
      setActiveScan(initialScan);
      setShowConfig(true);
    } finally {
      setIsStarting(false);
    }
  };

  const handleHaltScan = async () => {
    if (!activeScan || activeScan.id === "pending") return;
    const scanId = activeScan.id;
    setIsHalting(true);
    setError(null);

    // Optimistic UI — don't wait on poll/refresh if the server action succeeds.
    setActiveScan((prev) =>
      prev
        ? {
            ...prev,
            status: "FAILED",
            phase: "cancelled",
            statusMessage: "Scan stopped",
            errorMessage: "Halted by user",
            completedAt: new Date().toISOString(),
          }
        : prev
    );
    setPollingId(null);
    setIsStarting(false);

    try {
      const res = await cancelBrokenLinkScanAction(scanId);
      if (!res.success) {
        setError(res.error ?? "Failed to stop scan.");
        await pollScan(scanId);
        return;
      }
      await pollScan(scanId);
    } catch {
      setError("Something went wrong stopping the scan.");
      await pollScan(scanId);
    } finally {
      setIsHalting(false);
    }
  };

  const ensurePdfReady = async (action: "view" | "download") => {
    if (pdfBlobUrl && pdfFilename) return { blobUrl: pdfBlobUrl, filename: pdfFilename };
    if (!activeScan || activeScan.id === "pending") {
      throw new Error("Run a check first.");
    }
    if (activeScan.status !== "COMPLETED" && activeScan.phase !== "cancelled") {
      throw new Error("Finish the check before generating a report.");
    }

    setPdfLoadingAction(action);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);

      const response = await fetch("/api/broken-links/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          scanId: activeScan.id,
          websiteId,
        }),
      }).finally(() => clearTimeout(timeout));

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to generate PDF."
        );
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const filename =
        parsePdfFilename(response.headers.get("Content-Disposition")) ??
        `broken-links-${websiteName.replace(/[<>:"/\\|?*]/g, "-").slice(0, 60)}.pdf`;
      setPdfBlobUrl(blobUrl);
      setPdfFilename(filename);
      return { blobUrl, filename };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("PDF generation timed out. Try again in a moment.");
      }
      throw err;
    } finally {
      setPdfLoadingAction(null);
    }
  };

  const handleViewPdf = async () => {
    try {
      const { blobUrl } = await ensurePdfReady("view");
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open PDF.");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const { blobUrl, filename } = await ensurePdfReady("download");
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = filename;
      anchor.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF.");
    }
  };

  const results = liveResults;
  const groupedResults = useMemo(() => serializedResultsToGrouped(results), [results]);
  const occurrenceCount = results.length;
  const brokenCount = activeScan?.brokenCount ?? groupedResults.length;

  const canExportPdf =
    activeScan &&
    activeScan.id !== "pending" &&
    !showProgress &&
    (activeScan.status === "COMPLETED" || activeScan.phase === "cancelled");

  const scanComplete =
    activeScan &&
    !showProgress &&
    (activeScan.status === "COMPLETED" || activeScan.phase === "cancelled");

  const phaseLabel: Record<string, string> = {
    initializing: "Initializing",
    crawling: "Crawling pages",
    collecting: "Collecting links",
    checking: "Checking links",
    completed: "Complete",
    failed: "Failed",
    cancelled: "Stopped",
  };

  const host = websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const hasResults = groupedResults.length > 0;
  const showResultsPanel = Boolean(scanComplete || hasResults) && !showProgress;
  const showSetup = !showProgress && (showConfig || !scanComplete);
  const hasSitemapEstimate = sitemapApproxUrls != null && sitemapApproxUrls > 0;
  const crawlCoverage = activeScan
    ? coverageHint(sitemapApproxUrls, activeScan.pagesCrawled)
    : null;
  const linksTotal = Math.max(
    activeScan?.linksFound ?? 0,
    activeScan?.linksChecked ?? 0
  );
  const checkRate =
    elapsedMs > 0 && (activeScan?.linksChecked ?? 0) > 0
      ? Math.round(((activeScan?.linksChecked ?? 0) / elapsedMs) * 1000)
      : null;

  const groupedSeverityCounts = useMemo(
    () =>
      SEVERITIES.reduce(
        (acc, severity) => {
          acc[severity] = groupedResults.filter((r) => r.severity === severity).length;
          return acc;
        },
        {} as Record<Severity, number>
      ),
    [groupedResults]
  );

  const filteredGroups = useMemo(() => {
    const query = resultSearch.trim().toLowerCase();
    return groupedResults.filter((group) => {
      if (severityFilter !== "ALL" && group.severity !== severityFilter) return false;
      if (!query) return true;
      return (
        group.href.toLowerCase().includes(query) ||
        group.occurrences.some((o) => o.sourcePageUrl.toLowerCase().includes(query)) ||
        (group.statusCode?.toString().includes(query) ?? false)
      );
    });
  }, [groupedResults, severityFilter, resultSearch]);

  return (
    <div className="space-y-8 w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <ReliableLink
          href={overviewHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          {websiteName}
        </ReliableLink>
        {!showProgress ? (
          <div className="flex items-center gap-2">
            {scanComplete && !showConfig ? (
              <Button variant="outline" size="sm" onClick={() => setShowConfig(true)} className="gap-1.5">
                <RotateCcw className="size-3.5" />
                New check
              </Button>
            ) : null}
            {canExportPdf ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewPdf}
                  disabled={pdfLoadingAction !== null}
                  className="gap-1.5"
                >
                  {pdfLoadingAction === "view" ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
                  Report
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoadingAction !== null}
                  className="gap-1.5"
                >
                  {pdfLoadingAction === "download" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  PDF
                </Button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Hero */}
      <header className="space-y-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Broken links</h1>
          <p className="text-sm text-muted-foreground">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/80 hover:text-primary transition-colors"
            >
              {host}
            </a>
            {scanComplete && activeScan?.completedAt ? (
              <>
                {" · "}
                Last checked {formatDateTime(activeScan.completedAt)}
              </>
            ) : (
              <> · Find and fix 404s, redirects, and dead assets</>
            )}
            {hasSitemapEstimate ? (
              <> · ~{formatNumber(sitemapApproxUrls!)} URLs in sitemap (optional estimate)</>
            ) : null}
          </p>
        </div>

        {scanComplete && activeScan && !showProgress ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric
              label="Broken URLs"
              value={formatNumber(brokenCount)}
              highlight={brokenCount > 0 ? "bad" : "good"}
            />
            <Metric
              label="Page occurrences"
              value={formatNumber(occurrenceCount)}
              hint={occurrenceCount > brokenCount ? "Same URL on multiple pages" : undefined}
            />
            <Metric label="Links checked" value={formatNumber(activeScan.linksChecked)} />
            <Metric
              label="Pages crawled"
              value={formatNumber(activeScan.pagesCrawled)}
              hint={crawlCoverage ?? "Entire domain"}
            />
          </div>
        ) : null}
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {activeScan?.phase === "cancelled" ? (
        <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-200">
          <AlertDescription>Scan stopped early. Showing what we found before you stopped.</AlertDescription>
        </Alert>
      ) : null}

      {activeScan?.status === "FAILED" && activeScan.phase !== "cancelled" ? (
        <Alert variant="destructive">
          <AlertDescription>{activeScan.errorMessage ?? "Scan failed. Try again."}</AlertDescription>
        </Alert>
      ) : null}

      {/* Live progress */}
      {showProgress && activeScan ? (
        <section className="rounded-2xl border border-border/40 bg-card p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                <span className="text-xs font-medium text-primary">Scanning</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatElapsed(elapsedMs)}
                </span>
              </div>
              <p className="text-base font-medium text-foreground leading-snug break-all">
                {activeScan.statusMessage ?? "Scan in progress…"}
              </p>
              <p className="text-xs text-muted-foreground">
                {phaseLabel[activeScan.phase ?? ""] ?? "Working"} ·{" "}
                {activeScan.mode === "INTERNAL" ? "Internal links" : "External links"}
                {hasSitemapEstimate
                  ? ` · sitemap ~${formatNumber(sitemapApproxUrls!)} URLs (estimate only)`
                  : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-4xl font-semibold tabular-nums tracking-tight text-foreground">
                {Math.round(activeScan.progressPercent)}
                <span className="text-xl text-muted-foreground">%</span>
              </p>
            </div>
          </div>

          <Progress value={Math.min(100, activeScan.progressPercent)} className="h-2" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Metric
              label="Pages crawled"
              value={formatNumber(activeScan.pagesCrawled)}
              hint={crawlCoverage ?? "Entire domain"}
            />
            <Metric
              label="Pages discovered"
              value={formatNumber(activeScan.pagesDiscovered)}
            />
            <Metric
              label="Links checked"
              value={`${formatNumber(activeScan.linksChecked)}/${formatNumber(linksTotal || activeScan.linksChecked)}`}
            />
            <Metric label="Links found" value={formatNumber(activeScan.linksFound)} />
            <Metric
              label="Broken URLs"
              value={formatNumber(activeScan.brokenCount)}
              highlight={activeScan.brokenCount > 0 ? "bad" : "good"}
            />
            <Metric
              label="Pace"
              value={checkRate != null ? `${checkRate}/s` : "—"}
              hint="Links / second"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Crawling entire domain · all internal link levels
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleHaltScan}
              disabled={isHalting || activeScan.id === "pending"}
            >
              {isHalting ? <Loader2 className="animate-spin" /> : <Square className="fill-current" />}
              Stop
            </Button>
          </div>

          <div className="flex gap-2 pt-1">
            {PROGRESS_STEPS.map((step) => {
              const status = progressStepStatus(
                step.id,
                activeScan.phase,
                activeScan.progressPercent
              );
              return (
                <div key={step.id} className="flex-1 space-y-1.5 min-w-0">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      status === "done" && "bg-primary",
                      status === "active" && "bg-primary/60",
                      status === "upcoming" && "bg-muted"
                    )}
                  />
                  <p
                    className={cn(
                      "text-[10px] truncate",
                      status === "upcoming" ? "text-muted-foreground/60" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Results first when available */}
      {showResultsPanel ? (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {hasResults ? "Issues found" : "All clear"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {hasResults
                  ? `${filteredGroups.length} shown${
                      filteredGroups.length !== groupedResults.length
                        ? ` of ${groupedResults.length}`
                        : ""
                    } broken URLs · ${formatNumber(occurrenceCount)} page occurrence${occurrenceCount === 1 ? "" : "s"}`
                  : `Checked ${activeScan?.linksChecked ?? 0} links — none broken`}
              </p>
            </div>
          </div>

          {hasResults ? (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={resultSearch}
                    onChange={(e) => setResultSearch(e.target.value)}
                    placeholder="Filter by URL…"
                    className="pl-9 h-10 bg-card"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={severityFilter === "ALL" ? "secondary" : "outline"}
                    size="sm"
                    className="h-10"
                    onClick={() => setSeverityFilter("ALL")}
                  >
                    All
                  </Button>
                  {SEVERITIES.map((severity) => {
                    const count = groupedSeverityCounts[severity];
                    if (count === 0) return null;
                    return (
                      <Button
                        key={severity}
                        variant={severityFilter === severity ? "secondary" : "outline"}
                        size="sm"
                        className={cn(
                          "h-10",
                          severityFilter === severity && severityBadgeClass(severity)
                        )}
                        onClick={() =>
                          setSeverityFilter(severityFilter === severity ? "ALL" : severity)
                        }
                      >
                        <SeverityIcon severity={severity} />
                        {count}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {filteredGroups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/40 py-14 text-center text-sm text-muted-foreground">
                  No links match your filters.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredGroups.map((group) => (
                    <GroupedResultCard key={group.href} group={group} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-border/40 bg-card px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <Check className="size-5" />
              </div>
              <p className="text-base font-medium text-foreground">No broken links</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Everything we checked responded successfully.
              </p>
            </div>
          )}
        </section>
      ) : null}

      {/* Compact setup */}
      {showSetup ? (
        <section className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="px-6 md:px-8 py-5 flex items-center justify-between gap-4 border-b border-border/30">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {scanComplete ? "Run another check" : "Start a check"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {scanMode === "INTERNAL"
                  ? "Same-domain pages and assets"
                  : "Outbound links from your site"}
              </p>
            </div>
            {scanComplete ? (
              <Button variant="ghost" size="sm" onClick={() => setShowConfig(false)}>
                Cancel
              </Button>
            ) : null}
          </div>

          <div className="px-6 md:px-8 py-6 space-y-6">
            {hasSitemapEstimate ? (
              <div className="rounded-xl border border-border/30 bg-secondary/15 px-4 py-3">
                <p className="text-sm text-foreground">
                  Sitemap suggests about{" "}
                  <span className="font-medium tabular-nums">
                    {formatNumber(sitemapApproxUrls!)}
                  </span>{" "}
                  URLs (optional estimate)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Crawl covers the full domain — no page or link cap. Sitemap is not required.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Crawls the entire domain and checks every discovered link. No sitemap required.
              </p>
            )}

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Mode
              </p>
              <ModeToggle
                value={scanMode}
                disabled={isScanning}
                onChange={setScanMode}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Include
                </p>
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    className="text-primary hover:underline disabled:opacity-50"
                    disabled={isScanning}
                    onClick={() => setSelectedTypes([...ALL_LINK_RESOURCE_TYPES])}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    disabled={isScanning}
                    onClick={() => setSelectedTypes(["pages"])}
                  >
                    Pages only
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {LINK_RESOURCE_OPTIONS.map((option) => {
                  const active = selectedTypes.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      title={option.hint}
                      disabled={isScanning}
                      onClick={() => toggleResourceType(option.id)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                        active
                          ? "border-primary/50 bg-primary text-primary-foreground"
                          : "border-border/50 bg-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 min-w-[160px]"
                onClick={() => void handleStartScan()}
                disabled={isScanning || selectedTypes.length === 0}
              >
                {isStarting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Play className="size-4 fill-current" />
                )}
                {isStarting ? "Starting…" : "Start check"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Full-domain crawl · every broken URL with all source pages listed
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
