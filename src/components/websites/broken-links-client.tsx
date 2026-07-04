"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  Filter,
  Search,
  Unlink,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  startBrokenLinkScanAction,
  getBrokenLinkScanStatusAction,
  cancelBrokenLinkScanAction,
  generateBrokenLinksPdfAction,
} from "@/actions/broken-links";
import { formatDateTime, formatNumber, cn } from "@/lib/utils";
import type { BrokenLinkScanMode } from "@prisma/client";
import {
  ALL_LINK_RESOURCE_TYPES,
  LINK_RESOURCE_OPTIONS,
  type LinkResourceType,
  formatResourceTypes,
} from "@/lib/scanner/link-resource-types";
import { SeverityIcon, severityBadgeClass } from "@/components/websites/audit-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
}

function truncateUrl(url: string, max = 56) {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

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

function Metric({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: "good" | "bad" }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/60 px-4 py-3 text-center min-w-[88px]">
      <p
        className={cn(
          "text-2xl font-bold tabular-nums leading-none",
          highlight === "good" && "text-emerald-400",
          highlight === "bad" && "text-rose-400",
          !highlight && "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1.5">{label}</p>
    </div>
  );
}

function ResultRow({ result }: { result: SerializedResult }) {
  const [open, setOpen] = useState(false);
  const statusLabel =
    result.statusCode !== null ? String(result.statusCode) : "ERR";

  return (
    <>
      <TableRow className="group">
        <TableCell className="w-[72px]">
          <Badge
            variant="outline"
            className={cn(
              "tabular-nums font-mono text-[11px]",
              result.statusCode === null || result.statusCode >= 400
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-secondary/40 border-border/30 text-muted-foreground"
            )}
          >
            {statusLabel}
          </Badge>
        </TableCell>
        <TableCell className="max-w-[240px]">
          <a
            href={result.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline break-all line-clamp-2"
            title={result.href}
          >
            {truncateUrl(result.href, 48)}
          </a>
        </TableCell>
        <TableCell className="max-w-[200px] hidden md:table-cell">
          <a
            href={result.sourcePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground break-all line-clamp-1"
            title={result.sourcePageUrl}
          >
            {truncateUrl(result.sourcePageUrl, 40)}
          </a>
        </TableCell>
        <TableCell className="w-[100px]">
          <Badge variant="outline" className={cn("text-[10px]", severityBadgeClass(result.severity))}>
            {result.severity.charAt(0) + result.severity.slice(1).toLowerCase()}
          </Badge>
        </TableCell>
        <TableCell className="w-[88px] text-right">
          <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100">
            <CopyIconButton text={result.href} label="broken URL" />
            <Button variant="ghost" size="icon-sm" onClick={() => setOpen((v) => !v)} title="Details">
              {open ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {open ? (
        <TableRow className="bg-secondary/5 hover:bg-secondary/5">
          <TableCell colSpan={5} className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Broken URL</p>
                <p className="font-mono text-muted-foreground break-all">{result.href}</p>
                {result.errorMessage ? (
                  <p className="text-muted-foreground">{result.errorMessage}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Source page</p>
                <p className="font-mono text-muted-foreground break-all">{result.sourcePageUrl}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="font-medium text-foreground">Element</p>
                <div className="font-mono text-muted-foreground space-y-0.5">
                  <p>
                    &lt;{result.elementTag ?? "a"}&gt;
                    {result.attribute ? ` [${result.attribute}]` : ""}
                  </p>
                  {result.selector ? <p>selector: {result.selector}</p> : null}
                  {result.elementId ? <p>id: {result.elementId}</p> : null}
                  {result.elementClass ? <p>class: {result.elementClass}</p> : null}
                  {result.elementText ? <p>text: &quot;{result.elementText}&quot;</p> : null}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
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
  completedAt: Date | null;
  createdAt: Date;
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
    completedAt: scan.completedAt?.toISOString() ?? null,
    createdAt: scan.createdAt.toISOString(),
  };
}

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function BrokenLinksClient({
  websiteId,
  websiteName,
  websiteUrl,
  initialScan,
}: BrokenLinksClientProps) {
  const [activeScan, setActiveScan] = useState<SerializedScan | null>(initialScan);
  const [liveResults, setLiveResults] = useState<SerializedResult[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<LinkResourceType[]>([...ALL_LINK_RESOURCE_TYPES]);
  const [scanMode, setScanMode] = useState<BrokenLinkScanMode>("INTERNAL");
  const [isStarting, setIsStarting] = useState(false);
  const [isHalting, setIsHalting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoadingAction, setPdfLoadingAction] = useState<"view" | "download" | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [resultSearch, setResultSearch] = useState("");
  const [showConfig, setShowConfig] = useState(true);
  const [pollingId, setPollingId] = useState<string | null>(
    initialScan?.status === "RUNNING" ? initialScan.id : null
  );

  const overviewHref = `/dashboard/websites/${websiteId}`;
  const isRunning = activeScan?.status === "RUNNING" || activeScan?.status === "PENDING";
  const isScanning = isRunning || isStarting;
  const showProgress = isScanning || activeScan?.status === "RUNNING";

  const pollScan = useCallback(async (scanId: string) => {
    const res = await getBrokenLinkScanStatusAction(scanId);
    if (res.success && res.data) {
      setActiveScan((prev) => ({
        ...serializeScan(res.data),
        resourceTypes: prev?.resourceTypes ?? [...ALL_LINK_RESOURCE_TYPES],
      }));
      return res.data.status;
    }
    return "FAILED";
  }, []);

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
    if (liveResults.length > 0) setShowConfig(false);
  }, [liveResults.length]);

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
          else if (Array.isArray(data.findings)) setLiveResults(findingsToResults(data.findings));
          await pollScan(scanId);
        })
        .catch(() => setError("Lost connection. Refresh and try again."))
        .finally(() => setPollingId(null));
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
    setIsHalting(true);
    setError(null);
    try {
      const res = await cancelBrokenLinkScanAction(activeScan.id);
      if (!res.success) setError(res.error ?? "Failed to stop scan.");
      else {
        await pollScan(activeScan.id);
        setPollingId(null);
      }
    } catch {
      setError("Something went wrong stopping the scan.");
    } finally {
      setIsHalting(false);
    }
  };

  const ensurePdfReady = async (action: "view" | "download") => {
    if (pdfBlobUrl && pdfFilename) return { blobUrl: pdfBlobUrl, filename: pdfFilename };
    if (!activeScan || (activeScan.status !== "COMPLETED" && activeScan.phase !== "cancelled")) {
      throw new Error("Run a check first.");
    }

    setPdfLoadingAction(action);
    setError(null);
    try {
      const res = await generateBrokenLinksPdfAction({
        websiteId,
        websiteName,
        websiteUrl,
        mode: activeScan.mode,
        resourceTypes: activeScan.resourceTypes,
        completedAt: activeScan.completedAt,
        pagesCrawled: activeScan.pagesCrawled,
        linksChecked: activeScan.linksChecked,
        brokenCount: activeScan.brokenCount,
        findings: liveResults.map((result) => ({
          href: result.href,
          sourcePageUrl: result.sourcePageUrl,
          statusCode: result.statusCode,
          errorMessage: result.errorMessage,
          elementTag: result.elementTag,
          elementId: result.elementId,
          elementClass: result.elementClass,
          elementText: result.elementText,
          selector: result.selector,
          attribute: result.attribute,
          severity: result.severity,
        })),
      });
      if (!res.success || !res.data) throw new Error(res.error ?? "Failed to generate PDF.");
      const blob = base64ToBlob(res.data.fileBase64, "application/pdf");
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);
      setPdfFilename(res.data.filename);
      return { blobUrl, filename: res.data.filename };
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
  const severityCounts = useMemo(
    () =>
      SEVERITIES.reduce(
        (acc, severity) => {
          acc[severity] = results.filter((r) => r.severity === severity).length;
          return acc;
        },
        {} as Record<Severity, number>
      ),
    [results]
  );

  const filteredResults = useMemo(() => {
    const query = resultSearch.trim().toLowerCase();
    return results.filter((result) => {
      if (severityFilter !== "ALL" && result.severity !== severityFilter) return false;
      if (!query) return true;
      return (
        result.href.toLowerCase().includes(query) ||
        result.sourcePageUrl.toLowerCase().includes(query) ||
        (result.statusCode?.toString().includes(query) ?? false)
      );
    });
  }, [results, severityFilter, resultSearch]);

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Button variant="link" size="sm" className="h-auto p-0" render={<Link href="/dashboard/websites" />} nativeButton={false}>
          Websites
        </Button>
        <span>/</span>
        <Button variant="link" size="sm" className="h-auto p-0" render={<Link href={overviewHref} />} nativeButton={false}>
          {websiteName}
        </Button>
        <span>/</span>
        <span className="text-foreground">Broken links</span>
      </div>

      <Card className="rounded-2xl border-border/30 bg-gradient-to-br from-card via-card to-secondary/10 overflow-hidden py-0 gap-0">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl border border-border/40 bg-secondary/30 text-primary shrink-0">
                <Unlink className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-xl md:text-2xl">Broken link checker</CardTitle>
                <CardDescription className="text-sm">
                  Crawl and validate links on{" "}
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                </CardDescription>
                {scanComplete && activeScan?.completedAt ? (
                  <CardDescription>
                    Last run {formatDateTime(activeScan.completedAt)} ·{" "}
                    <span className="capitalize">{activeScan.mode.toLowerCase()}</span>
                  </CardDescription>
                ) : (
                  <CardDescription>
                    Standalone check — not part of the full audit. Results are session-only.
                  </CardDescription>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {scanComplete && activeScan ? (
                <>
                  <Metric
                    label="Broken"
                    value={formatNumber(activeScan.brokenCount)}
                    highlight={activeScan.brokenCount > 0 ? "bad" : "good"}
                  />
                  <Metric label="Checked" value={formatNumber(activeScan.linksChecked)} />
                  <Metric label="Pages" value={formatNumber(activeScan.pagesCrawled)} />
                </>
              ) : null}
              <ButtonLink href={overviewHref} variant="outline" size="sm">
                <ArrowLeft />
                Overview
              </ButtonLink>
            </div>
          </div>
        </CardContent>

        {showProgress && activeScan?.status === "RUNNING" ? (
          <div className="border-t border-border/30 bg-secondary/5 px-6 md:px-8 py-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {activeScan.statusMessage ?? "Scan in progress…"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {phaseLabel[activeScan.phase ?? ""] ?? "Working"} ·{" "}
                  {activeScan.mode === "INTERNAL" ? "Internal crawl" : "External check"}
                </p>
              </div>
              <p className="text-xl font-bold tabular-nums shrink-0">
                {Math.round(activeScan.progressPercent)}%
              </p>
            </div>
            <Progress value={Math.min(100, activeScan.progressPercent)} className="h-2" />
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {activeScan.pagesCrawled} pages · {activeScan.linksChecked} links checked
              </span>
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
          </div>
        ) : null}
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {activeScan?.phase === "cancelled" ? (
        <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-400">
          <AlertDescription>Scan stopped early. Partial results are shown below.</AlertDescription>
        </Alert>
      ) : null}

      {activeScan?.status === "FAILED" && activeScan.phase !== "cancelled" ? (
        <Alert variant="destructive">
          <AlertDescription>Scan failed: {activeScan.errorMessage ?? "Unknown error"}</AlertDescription>
        </Alert>
      ) : null}

      {(showConfig || !scanComplete) && !showProgress ? (
        <Card className="rounded-2xl border-border/30">
          <CardHeader className="border-b border-border/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Configure check</CardTitle>
                <CardDescription>Choose crawl mode and which link types to validate</CardDescription>
              </div>
              {scanComplete ? (
                <Button variant="ghost" size="sm" onClick={() => setShowConfig(false)}>
                  Hide
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Crawl mode</p>
              <Tabs
                value={scanMode}
                onValueChange={(v) => setScanMode(v as BrokenLinkScanMode)}
              >
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="INTERNAL" disabled={isScanning} className="gap-1.5 px-4">
                    <Home className="size-3.5" />
                    Internal
                  </TabsTrigger>
                  <TabsTrigger value="EXTERNAL" disabled={isScanning} className="gap-1.5 px-4">
                    <ExternalLink className="size-3.5" />
                    External
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {scanMode === "INTERNAL"
                  ? "Crawls your site and tests links that stay on your domain."
                  : "Crawls your site and tests outbound links to other websites."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">Link types</p>
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    className="text-primary hover:underline disabled:opacity-50"
                    disabled={isScanning}
                    onClick={() => setSelectedTypes([...ALL_LINK_RESOURCE_TYPES])}
                  >
                    All
                  </button>
                  <span className="text-muted-foreground">·</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    disabled={isScanning}
                    onClick={() => setSelectedTypes(["pages"])}
                  >
                    Pages
                  </button>
                  <span className="text-muted-foreground">·</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    disabled={isScanning}
                    onClick={() =>
                      setSelectedTypes(["images", "stylesheets", "scripts", "documents", "media"])
                    }
                  >
                    Assets
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
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                        active
                          ? "border-primary/40 bg-primary text-primary-foreground"
                          : "border-border/40 bg-secondary/20 text-muted-foreground hover:text-foreground hover:border-border/60"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full sm:w-auto gap-2"
              onClick={() => void handleStartScan()}
              disabled={isScanning || selectedTypes.length === 0}
            >
              {isStarting ? (
                <Loader2 className="animate-spin" />
              ) : scanComplete ? (
                <RotateCcw />
              ) : (
                <Play />
              )}
              {isStarting ? "Starting…" : scanComplete ? "Run new check" : "Start check"}
            </Button>
          </CardContent>
        </Card>
      ) : scanComplete && !showConfig ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowConfig(true)} className="gap-1.5">
            <RotateCcw className="size-3.5" />
            New check
          </Button>
        </div>
      ) : null}

      {results.length > 0 ? (
        <Card className="rounded-2xl border-border/30 overflow-hidden py-0 gap-0">
          <CardHeader className="border-b border-border/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  Results
                  <span className="text-muted-foreground font-normal ml-2">
                    {filteredResults.length}
                    {filteredResults.length !== results.length ? ` of ${results.length}` : ""}
                  </span>
                </CardTitle>
                {activeScan ? (
                  <CardDescription>{formatResourceTypes(activeScan.resourceTypes)}</CardDescription>
                ) : null}
              </div>
              {canExportPdf ? (
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewPdf}
                    disabled={pdfLoadingAction !== null}
                  >
                    {pdfLoadingAction === "view" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Eye />
                    )}
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadPdf}
                    disabled={pdfLoadingAction !== null}
                  >
                    {pdfLoadingAction === "download" ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Download />
                    )}
                    Download
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={resultSearch}
                  onChange={(e) => setResultSearch(e.target.value)}
                  placeholder="Search URLs…"
                  className="pl-9 h-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant={severityFilter === "ALL" ? "secondary" : "outline"}
                  size="sm"
                  className="h-9"
                  onClick={() => setSeverityFilter("ALL")}
                >
                  <Filter className="size-3.5" />
                  All
                </Button>
                {SEVERITIES.map((severity) => {
                  const count = severityCounts[severity];
                  if (count === 0) return null;
                  return (
                    <Button
                      key={severity}
                      variant={severityFilter === severity ? "secondary" : "outline"}
                      size="sm"
                      className={cn("h-9", severityFilter === severity && severityBadgeClass(severity))}
                      onClick={() => setSeverityFilter(severityFilter === severity ? "ALL" : severity)}
                    >
                      <SeverityIcon severity={severity} />
                      {count}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredResults.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No links match your filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4">Status</TableHead>
                    <TableHead>Broken URL</TableHead>
                    <TableHead className="hidden md:table-cell">Source page</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="pr-4 text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <ResultRow key={result.id} result={result} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : scanComplete && !showProgress ? (
        <Card className="rounded-2xl border-border/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <CardTitle className="text-base mb-1">No broken links found</CardTitle>
            <CardDescription className="max-w-sm">
              All {activeScan?.linksChecked ?? 0} checked links returned successful responses.
            </CardDescription>
            {canExportPdf ? (
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewPdf}
                  disabled={pdfLoadingAction !== null}
                >
                  {pdfLoadingAction === "view" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Eye />
                  )}
                  View
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : !showProgress && !showConfig ? null : !showProgress ? (
        <Card className="rounded-2xl border-dashed border-border/40 bg-transparent shadow-none">
          <CardContent className="py-12 text-center">
            <CardDescription>
              Configure options above and click <strong className="text-foreground">Start check</strong> to begin.
            </CardDescription>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
