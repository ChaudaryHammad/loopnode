"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Link2,
  Copy,
  Check,
  AlertOctagon,
  AlertTriangle,
  Info,
  Loader2,
  Home,
  ExternalLink,
  Square,
  Eye,
  Download,
  FileText,
  Filter,
  Search,
} from "lucide-react";
import {
  startBrokenLinkScanAction,
  getBrokenLinkScanStatusAction,
  getBrokenLinkScanResultsAction,
  cancelBrokenLinkScanAction,
  generateBrokenLinksPdfAction,
} from "@/actions/broken-links";
import { formatDateTime } from "@/lib/utils";
import type { BrokenLinkScanMode } from "@prisma/client";
import {
  ALL_LINK_RESOURCE_TYPES,
  LINK_RESOURCE_OPTIONS,
  type LinkResourceType,
  formatResourceTypes,
  parseResourceTypes,
} from "@/lib/scanner/link-resource-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

function SeverityIcon({ severity }: { severity: Severity }) {
  if (severity === "CRITICAL") return <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />;
  if (severity === "MAJOR") return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  return <Info className="w-3.5 h-3.5 text-blue-400" />;
}

function severityBadge(severity: Severity) {
  const map = {
    CRITICAL: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    MAJOR: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    MINOR: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    INFO: "bg-secondary/40 border-border/30 text-muted-foreground",
  };
  return map[severity];
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} title={`Copy ${label ?? "link"}`} className="text-[11px] h-7">
      {copied ? <Check className="text-emerald-400" /> : <Copy />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function BrokenLinkCard({ result }: { result: SerializedResult }) {
  const title =
    result.statusCode !== null
      ? `HTTP ${result.statusCode} — ${result.href}`
      : `Unreachable — ${result.href}`;

  return (
    <div className="border border-border/30 rounded-xl bg-card overflow-hidden hover:border-border/60 transition-colors">
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <SeverityIcon severity={result.severity} />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-foreground leading-snug break-all">
                {title}
              </p>
              <Badge variant="outline" className={`shrink-0 text-[10px] uppercase ${severityBadge(result.severity)}`}>
                {result.severity}
              </Badge>
            </div>

            {result.errorMessage && (
              <p className="text-xs text-muted-foreground">{result.errorMessage}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={result.href} label="broken link URL" />
              <CopyButton text={result.sourcePageUrl} label="source page URL" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/20">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Home className="w-3 h-3" />
              Found on page
            </p>
            <a
              href={result.sourcePageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline break-all"
            >
              {result.sourcePageUrl}
            </a>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Element details
            </p>
            <div className="text-xs text-muted-foreground space-y-0.5 font-mono">
              <p>
                &lt;{result.elementTag ?? "a"}&gt;
                {result.attribute && ` [${result.attribute}]`}
              </p>
              {result.elementId && <p>id: {result.elementId}</p>}
              {result.elementClass && (
                <p className="truncate">class: {result.elementClass}</p>
              )}
              {result.selector && <p className="truncate">selector: {result.selector}</p>}
              {result.elementText && (
                <p className="truncate text-foreground/80">
                  text: &quot;{result.elementText}&quot;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressPanel({
  scan,
  onHalt,
  isHalting,
}: {
  scan: SerializedScan;
  onHalt: () => void;
  isHalting: boolean;
}) {
  const phaseLabel: Record<string, string> = {
    initializing: "Initializing",
    crawling: "Crawling pages",
    collecting: "Collecting links",
    checking: "Checking links",
    completed: "Complete",
    failed: "Failed",
    cancelled: "Halted",
  };

  return (
    <Card className="border-primary/20 shadow-lg shadow-primary/5">
      <CardContent className="space-y-4 pt-6">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            {phaseLabel[scan.phase ?? ""] ?? "Scanning"}…
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {scan.statusMessage ?? "Working…"}
          </p>
        </div>
        <span className="text-lg font-extrabold tabular-nums text-primary shrink-0">
          {Math.round(scan.progressPercent)}%
        </span>
      </div>

      <Progress value={Math.min(100, scan.progressPercent)} className="h-2.5" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pages crawled", value: scan.pagesCrawled },
          { label: "Pages queued", value: Math.max(0, scan.pagesDiscovered - scan.pagesCrawled) },
          { label: "Links found", value: scan.linksFound },
          { label: "Links checked", value: scan.linksChecked },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-secondary/20 border border-border/20 rounded-xl p-3 text-center"
          >
            <p className="text-lg font-extrabold tabular-nums text-foreground">{stat.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-1">
        <Button variant="destructive" size="sm" onClick={onHalt} disabled={isHalting || scan.id === "pending"}>
          {isHalting ? <Loader2 className="animate-spin" /> : <Square className="fill-current" />}
          {isHalting ? "Halting…" : "Halt scan"}
        </Button>
      </div>
      </CardContent>
    </Card>
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
  const uniqueByHref = new Map<string, (typeof findings)[number]>();
  for (const finding of findings) {
    if (!uniqueByHref.has(finding.href)) {
      uniqueByHref.set(finding.href, finding);
    }
  }

  return [...uniqueByHref.values()].map((f, index) => ({
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
  const [isStarting, setIsStarting] = useState(false);
  const [startingMode, setStartingMode] = useState<BrokenLinkScanMode | null>(null);
  const [isHalting, setIsHalting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [resultSearch, setResultSearch] = useState("");
  const [pollingId, setPollingId] = useState<string | null>(
    initialScan?.status === "RUNNING" ? initialScan.id : null
  );

  const isRunning = activeScan?.status === "RUNNING" || activeScan?.status === "PENDING";
  const isScanning = isRunning || isStarting;

  const loadScanResults = useCallback(async (scanId: string) => {
    const res = await getBrokenLinkScanResultsAction(scanId);
    if (res.success && res.data) {
      setLiveResults(
        res.data.map((finding) => ({
          ...finding,
          severity: finding.severity as Severity,
        }))
      );
    }
  }, []);

  const pollScan = useCallback(async (scanId: string) => {
    const res = await getBrokenLinkScanStatusAction(scanId);
    if (res.success && res.data) {
      setActiveScan((prev) => ({
        ...serializeScan(res.data),
        resourceTypes: prev?.resourceTypes ?? [...ALL_LINK_RESOURCE_TYPES],
      }));
      return res.data;
    }
    return null;
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
      const scan = await pollScan(pollingId);
      if (!scan) {
        setPollingId(null);
        return;
      }

      if (scan.status === "COMPLETED" || scan.phase === "cancelled") {
        await loadScanResults(pollingId);
        setPollingId(null);
        return;
      }

      if (scan.status === "FAILED" && scan.phase !== "cancelled") {
        setPollingId(null);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [pollingId, pollScan, loadScanResults]);

  const toggleResourceType = (type: LinkResourceType) => {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type]
    );
  };

  const handleStartScan = async (scanMode: BrokenLinkScanMode) => {
    if (selectedTypes.length === 0) {
      setError("Select at least one link type to check.");
      return;
    }

    setError(null);
    setIsStarting(true);
    setStartingMode(scanMode);
    setLiveResults([]);
    setSeverityFilter("ALL");
    setResultSearch("");
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setPdfFilename(null);
    setActiveScan(createOptimisticScan(scanMode, selectedTypes));

    try {
      const res = await startBrokenLinkScanAction(websiteId, scanMode, selectedTypes);
      if (!res.success || !res.data?.scanId) {
        setError(res.error ?? "Failed to start scan.");
        setActiveScan(initialScan);
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
          if (!response.ok) {
            setError(data.error ?? "Scan failed.");
            setPollingId(null);
            return;
          }

          if (data.queued) {
            return;
          }

          if (Array.isArray(data.findings)) {
            setLiveResults(findingsToResults(data.findings));
          }

          await pollScan(scanId);
          if (!data.queued) {
            setPollingId(null);
          }
        })
        .catch((err) => {
          console.error(err);
          setError("Lost connection to the link checker. Refresh and try again.");
        });
    } catch (err) {
      console.error(err);
      setError("Something went wrong starting the scan.");
      setActiveScan(initialScan);
    } finally {
      setIsStarting(false);
      setStartingMode(null);
    }
  };

  const handleHaltScan = async () => {
    if (!activeScan || activeScan.id === "pending") return;

    setIsHalting(true);
    setError(null);

    try {
      const res = await cancelBrokenLinkScanAction(activeScan.id);
      if (!res.success) {
        setError(res.error ?? "Failed to halt scan.");
        return;
      }

      await pollScan(activeScan.id);
      setPollingId(null);
    } catch (err) {
      console.error(err);
      setError("Something went wrong halting the scan.");
    } finally {
      setIsHalting(false);
    }
  };

  const ensurePdfReady = async () => {
    if (pdfBlobUrl && pdfFilename) {
      return { blobUrl: pdfBlobUrl, filename: pdfFilename };
    }

    if (!activeScan || (activeScan.status !== "COMPLETED" && activeScan.phase !== "cancelled")) {
      throw new Error("Run a broken link check first.");
    }

    setIsGeneratingPdf(true);
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

      if (!res.success || !res.data) {
        throw new Error(res.error ?? "Failed to generate PDF.");
      }

      const blob = base64ToBlob(res.data.fileBase64, "application/pdf");
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);
      setPdfFilename(res.data.filename);
      return { blobUrl, filename: res.data.filename };
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleViewPdf = async () => {
    try {
      const { blobUrl } = await ensurePdfReady();
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open PDF.");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const { blobUrl, filename } = await ensurePdfReady();
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = filename;
      anchor.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF.");
    }
  };

  const results = liveResults;
  const severityCounts = useMemo(() => {
    return SEVERITIES.reduce(
      (acc, severity) => {
        acc[severity] = results.filter((r) => r.severity === severity).length;
        return acc;
      },
      {} as Record<Severity, number>
    );
  }, [results]);

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

  const hasActiveResultFilters = severityFilter !== "ALL" || resultSearch.trim().length > 0;
  const showProgress = isScanning || activeScan?.status === "RUNNING";

  const isModeBusy = (scanMode: BrokenLinkScanMode) =>
    isScanning && (activeScan?.mode === scanMode || startingMode === scanMode);

  const canExportPdf =
    activeScan &&
    activeScan.id !== "pending" &&
    !showProgress &&
    (activeScan.status === "COMPLETED" || activeScan.phase === "cancelled");

  return (
    <div className="space-y-6 select-none">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/dashboard/websites" className="hover:text-foreground transition-colors">
          Websites
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/websites/${websiteId}`}
          className="hover:text-foreground transition-colors"
        >
          {websiteName}
        </Link>
        <span>/</span>
        <span className="text-foreground">Broken Links</span>
      </div>

      <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-6 border-b border-border/20 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl border text-blue-400 bg-blue-500/10 border-blue-500/20">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Broken Link Checker</h1>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Globe className="w-3 h-3" />
                {websiteUrl.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl pt-2">
            Two separate checks — internal links on your site, or external links pointing out.
            Not part of the main health audit.
          </p>
        </div>

        <Link
          href={`/dashboard/websites/${websiteId}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl bg-secondary/40 border border-border/30 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Overview
        </Link>
      </div>

      <div className="bg-card border border-border/30 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-bold text-foreground">What to check</p>
        <p className="text-sm text-muted-foreground">
          Pick link types, run a check, and review results here. Results stay in this session only — not saved to the database.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {LINK_RESOURCE_OPTIONS.map((option) => {
            const checked = selectedTypes.includes(option.id);
            return (
              <label
                key={option.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  checked
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/40 bg-secondary/10 hover:border-border/70"
                } ${isScanning ? "opacity-60 pointer-events-none" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleResourceType(option.id)}
                  disabled={isScanning}
                  className="mt-0.5 accent-primary"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                  <span className="block text-[11px] text-muted-foreground leading-relaxed">{option.hint}</span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setSelectedTypes([...ALL_LINK_RESOURCE_TYPES])}
            disabled={isScanning}
            className="text-xs font-semibold text-primary hover:underline disabled:opacity-50 cursor-pointer"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypes(["pages"])}
            disabled={isScanning}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer"
          >
            Pages only
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypes(["images", "stylesheets", "scripts", "documents", "media"])}
            disabled={isScanning}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer"
          >
            Assets only
          </button>
        </div>

        <p className="text-sm font-bold text-foreground pt-2">Run check</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() => handleStartScan("INTERNAL")}
            disabled={isScanning}
            size="lg"
            className="h-auto flex-col items-start gap-2 px-5 py-4 text-left shadow-lg shadow-primary/20"
          >
            <span className="flex items-center gap-2">
              {isModeBusy("INTERNAL") ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Home className="w-4 h-4" />
              )}
              {isModeBusy("INTERNAL") ? "Checking internal links…" : "Check Internal Links"}
            </span>
            <span className="text-[11px] font-normal opacity-90 leading-relaxed">
              Crawls your whole site and tests every link that stays on your domain.
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleStartScan("EXTERNAL")}
            disabled={isScanning}
            size="lg"
            className="h-auto flex-col items-start gap-2 px-5 py-4 text-left"
          >
            <span className="flex items-center gap-2">
              {isModeBusy("EXTERNAL") ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {isModeBusy("EXTERNAL") ? "Checking external links…" : "Check External Links"}
            </span>
            <span className="text-[11px] font-normal text-muted-foreground leading-relaxed">
              Crawls your site and tests outbound links to other websites.
            </span>
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {showProgress && activeScan && activeScan.status === "RUNNING" && (
        <ProgressPanel scan={activeScan} onHalt={handleHaltScan} isHalting={isHalting} />
      )}

      {activeScan?.phase === "cancelled" && (
        <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-400">
          <AlertDescription>
            Scan halted. Partial results are shown below if any links were checked before stopping.
          </AlertDescription>
        </Alert>
      )}

      {activeScan?.status === "FAILED" && activeScan?.phase !== "cancelled" && (
        <Alert variant="destructive">
          <AlertDescription>
            Scan failed: {activeScan.errorMessage ?? "Unknown error"}
          </AlertDescription>
        </Alert>
      )}

      {canExportPdf && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary/40 border border-border/30 text-muted-foreground">
              Types: {formatResourceTypes(activeScan.resourceTypes)}
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary/40 border border-border/30 text-muted-foreground">
              Mode: {activeScan.mode.toLowerCase()}
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary/40 border border-border/30 text-muted-foreground">
              {activeScan.pagesCrawled} pages crawled
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-secondary/40 border border-border/30 text-muted-foreground">
              {activeScan.linksChecked} links checked
            </span>
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                activeScan.brokenCount > 0
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}
            >
              {activeScan.brokenCount} broken
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/30 bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FileText className="size-4 text-primary" />
              Export results
            </div>
            <p className="w-full text-xs text-muted-foreground sm:w-auto sm:flex-1">
              One-time PDF — not saved to your library or Cloudinary.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleViewPdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? <Loader2 className="animate-spin" /> : <Eye />}
              View PDF
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? <Loader2 className="animate-spin" /> : <Download />}
              Download PDF
            </Button>
          </div>
        </div>
      )}

      {results.length === 0 && !showProgress ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border/30 rounded-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
            <span className="text-xl">🔗</span>
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">
            {activeScan?.status === "COMPLETED"
              ? "No broken links found"
              : activeScan?.phase === "cancelled"
                ? "Scan was halted before finding broken links"
                : "Click a button above to check internal or external links"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {activeScan?.status === "COMPLETED"
              ? "All checked links returned successful responses."
              : activeScan?.phase === "cancelled"
                ? "Try running the check again when you're ready."
                : "Internal links stay on your site. External links go to other domains."}
          </p>
        </div>
      ) : (
        results.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-2xl border border-border/30 bg-card p-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={resultSearch}
                  onChange={(e) => setResultSearch(e.target.value)}
                  placeholder="Search URL or source page…"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={severityFilter === "ALL" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setSeverityFilter("ALL")}
                >
                  <Filter className="size-3.5" />
                  All ({results.length})
                </Button>
                {SEVERITIES.map((severity) => {
                  const count = severityCounts[severity];
                  if (count === 0) return null;
                  return (
                    <Button
                      key={severity}
                      variant={severityFilter === severity ? "secondary" : "outline"}
                      size="sm"
                      className={
                        severityFilter === severity ? severityBadge(severity) : undefined
                      }
                      onClick={() =>
                        setSeverityFilter(severityFilter === severity ? "ALL" : severity)
                      }
                    >
                      <SeverityIcon severity={severity} />
                      {severity.charAt(0) + severity.slice(1).toLowerCase()} ({count})
                    </Button>
                  );
                })}
                {hasActiveResultFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSeverityFilter("ALL");
                      setResultSearch("");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>

            <h2 className="text-base font-bold text-foreground">
              Broken links ({filteredResults.length}
              {filteredResults.length !== results.length ? ` of ${results.length}` : ""})
            </h2>

            {filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/30 bg-card py-12 text-center">
                <Info className="size-8 text-muted-foreground" />
                <h3 className="text-base font-bold text-foreground">No links match your filters</h3>
                <p className="text-sm text-muted-foreground">
                  Try a different severity or clear the search.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSeverityFilter("ALL");
                    setResultSearch("");
                  }}
                >
                  Reset filters
                </Button>
              </div>
            ) : (
              filteredResults.map((result) => (
                <BrokenLinkCard key={result.id} result={result} />
              ))
            )}
          </div>
        )
      )}

      {activeScan?.completedAt && !showProgress && (
        <p className="text-xs text-muted-foreground text-center">
          Last checked: {formatDateTime(activeScan.completedAt)}
        </p>
      )}
    </div>
  );
}
