"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  startBrokenLinkScanAction,
  getBrokenLinkScanStatusAction,
  getBrokenLinkResultsAction,
  cancelBrokenLinkScanAction,
  getSitemapEstimateAction,
} from "@/actions/broken-links";
import { groupBrokenLinkFindings, type GroupedBrokenLink } from "@/broken-links/group-results";
import { toast } from "@/lib/toast";
import type { BrokenLinkScanMode } from "@prisma/client";
import {
  ALL_LINK_RESOURCE_TYPES,
  type LinkResourceType,
} from "@/lib/scanner/link-resource-types";
import {
  BrokenLinksActionButtons,
  BrokenLinksMetricsGrid,
  BrokenLinksPageShell,
  BrokenLinksProgressPanel,
  BrokenLinksResultsPanel,
  BrokenLinksSetupPanel,
  BrokenLinksStatusAlerts,
  type Severity,
  type SeverityFilter,
} from "@/components/websites/broken-links-sections";

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
  /** When true, fetches sitemap estimate after mount instead of blocking the page. */
  deferSitemapEstimate?: boolean;
}

function coverageHint(approx: number | null | undefined, crawled: number): string | null {
  if (approx == null || approx <= 0) return null;
  const pct = Math.min(100, Math.round((crawled / approx) * 100));
  return `~${pct}% of sitemap estimate`;
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
  sitemapApproxUrls: initialSitemapApproxUrls = null,
  deferSitemapEstimate = false,
}: BrokenLinksClientProps) {
  const [sitemapApproxUrls, setSitemapApproxUrls] = useState<number | null | undefined>(
    deferSitemapEstimate ? undefined : initialSitemapApproxUrls
  );
  const [activeScan, setActiveScan] = useState<SerializedScan | null>(initialScan);
  const [liveResults, setLiveResults] = useState<SerializedResult[]>(initialResults);
  const [selectedTypes, setSelectedTypes] = useState<LinkResourceType[]>([...ALL_LINK_RESOURCE_TYPES]);
  const [scanMode, setScanMode] = useState<BrokenLinkScanMode>(
    initialScan?.mode ?? "INTERNAL"
  );
  const [isStarting, setIsStarting] = useState(false);
  const [isHalting, setIsHalting] = useState(false);
  const [pdfLoadingAction, setPdfLoadingAction] = useState<"view" | "download" | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [resultSearch, setResultSearch] = useState("");
  const [stopRequested, setStopRequested] = useState(false);
  // Prefer results first when a prior scan exists; open config only for first run.
  const [showConfig, setShowConfig] = useState(
    !initialResults.length && initialScan?.status !== "COMPLETED"
  );
  const [pollingId, setPollingId] = useState<string | null>(
    initialScan?.status === "RUNNING" ? initialScan.id : null
  );
  const [now, setNow] = useState(() => Date.now());
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
      if (finished && res.data.phase === "cancelled") {
        setStopRequested(false);
      }
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
    if (!deferSitemapEstimate || sitemapApproxUrls !== undefined) return;

    let cancelled = false;
    void getSitemapEstimateAction(websiteUrl).then((res) => {
      if (cancelled) return;
      setSitemapApproxUrls(
        res.success ? (res.estimate.approxUrlCount ?? null) : null
      );
    });

    return () => {
      cancelled = true;
    };
  }, [deferSitemapEstimate, sitemapApproxUrls, websiteUrl]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  useEffect(() => {
    if (!pollingId) return;
    const timeout = setTimeout(() => {
      void pollScan(pollingId);
    }, 0);
    const interval = setInterval(async () => {
      const status = await pollScan(pollingId);
      if (status !== "RUNNING" && status !== "PENDING") setPollingId(null);
    }, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [pollingId, pollScan]);

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isScanning]);

  useEffect(() => {
    if (!showConfig) return;
    const panel = document.getElementById("broken-links-setup-panel");
    const focusPanel = () => {
      if (panel instanceof HTMLElement) {
        panel.focus({ preventScroll: true });
      }
    };

    const main = document.querySelector("main");
    if (main instanceof HTMLElement) {
      main.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      const timeout = window.setTimeout(focusPanel, 250);
      return () => window.clearTimeout(timeout);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    const timeout = window.setTimeout(focusPanel, 250);
    return () => window.clearTimeout(timeout);
  }, [showConfig]);

  const toggleResourceType = (type: LinkResourceType) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );
  };

  const handleStartScan = async () => {
    if (selectedTypes.length === 0) {
      toast.error("Select at least one link type.");
      return;
    }

    setIsStarting(true);
    setStopRequested(false);
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
        toast.error(res.error ?? "Failed to start scan.");
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
          if (!response.ok) toast.error(data.error ?? "Scan failed.");
          await loadFullResults(scanId);
          await pollScan(scanId);
        })
        .catch(() => toast.error("Lost connection. Refresh and try again."))
        .finally(async () => {
          await pollScan(scanId);
          setPollingId(null);
          setIsStarting(false);
        });
    } catch {
      toast.error("Something went wrong starting the scan.");
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
    setStopRequested(true);

    setActiveScan((prev) =>
      prev
        ? {
            ...prev,
            statusMessage: "Stopping scan... waiting for the crawler to halt.",
          }
        : prev
    );
    setIsStarting(false);

    try {
      const res = await cancelBrokenLinkScanAction(scanId);
      if (!res.success) {
        setStopRequested(false);
        toast.error(res.error ?? "Failed to stop scan.");
        await pollScan(scanId);
        return;
      }
      setPollingId(scanId);
      await pollScan(scanId);
    } catch {
      setStopRequested(false);
      toast.error("Something went wrong stopping the scan.");
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
      toast.error(err instanceof Error ? err.message : "Failed to open PDF.");
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
      toast.error(err instanceof Error ? err.message : "Failed to download PDF.");
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

  const hasResults = groupedResults.length > 0;
  const showResultsPanel = Boolean(scanComplete || hasResults) && !showProgress;
  const showSetup = !showProgress && (showConfig || !scanComplete);
  const hasSitemapEstimate = sitemapApproxUrls != null && sitemapApproxUrls > 0;
  const elapsedMs =
    isScanning && activeScan?.createdAt
      ? Math.max(0, now - new Date(activeScan.createdAt).getTime())
      : 0;
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
      <BrokenLinksPageShell
        websiteId={websiteId}
        websiteName={websiteName}
        websiteUrl={websiteUrl}
        lastScanned={activeScan?.completedAt ?? null}
        scanComplete={Boolean(scanComplete)}
        activeMode={scanMode}
        selectedTypeCount={selectedTypes.length}
        actions={
          !showProgress ? (
            <BrokenLinksActionButtons
              showNewCheck={Boolean(scanComplete && !showConfig)}
              onNewCheck={() => setShowConfig(true)}
              canExportPdf={Boolean(canExportPdf)}
              pdfLoadingAction={pdfLoadingAction}
              onViewPdf={() => void handleViewPdf()}
              onDownloadPdf={() => void handleDownloadPdf()}
            />
          ) : null
        }
      />

      {scanComplete && activeScan && !showProgress ? (
        <BrokenLinksMetricsGrid
          brokenCount={brokenCount}
          occurrenceCount={occurrenceCount}
          linksChecked={activeScan.linksChecked}
          pagesCrawled={activeScan.pagesCrawled}
          crawlCoverage={crawlCoverage}
        />
      ) : null}

      <BrokenLinksStatusAlerts
        activeScan={activeScan}
        hasResults={hasResults}
      />

      {showProgress && activeScan ? (
        <BrokenLinksProgressPanel
          activeScan={activeScan}
          elapsedMs={elapsedMs}
          linksTotal={linksTotal}
          checkRate={checkRate}
          hasSitemapEstimate={hasSitemapEstimate}
          sitemapApproxUrls={sitemapApproxUrls ?? null}
          crawlCoverage={crawlCoverage}
          isHalting={isHalting || stopRequested}
          onStop={() => void handleHaltScan()}
        />
      ) : null}

      {showSetup ? (
        <BrokenLinksSetupPanel
          scanComplete={Boolean(scanComplete)}
          scanMode={scanMode}
          selectedTypes={selectedTypes}
          isScanning={isScanning}
          hasSitemapEstimate={hasSitemapEstimate}
          sitemapApproxUrls={sitemapApproxUrls ?? null}
          onModeChange={setScanMode}
          onToggleResourceType={toggleResourceType}
          onSelectAll={() => setSelectedTypes([...ALL_LINK_RESOURCE_TYPES])}
          onSelectPagesOnly={() => setSelectedTypes(["pages"])}
          onStart={() => void handleStartScan()}
          onClose={() => setShowConfig(false)}
          isStarting={isStarting}
        />
      ) : null}

      {showResultsPanel ? (
        <BrokenLinksResultsPanel
          groups={groupedResults}
          filteredGroups={filteredGroups}
          occurrenceCount={occurrenceCount}
          linksChecked={activeScan?.linksChecked ?? 0}
          severityFilter={severityFilter}
          severityCounts={groupedSeverityCounts}
          resultSearch={resultSearch}
          onSearchChange={setResultSearch}
          onSeverityChange={setSeverityFilter}
        />
      ) : null}
    </div>
  );
}
