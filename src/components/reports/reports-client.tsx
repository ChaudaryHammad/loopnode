"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Copy,
  Check,
  Trash2,
  X,
  Link2,
} from "lucide-react";
import {
  deleteReportAction,
  generateReportAction,
  getWebsiteScansForReportsAction,
  setReportShareAction,
} from "@/actions/reports";
import { REPORT_TYPE_LABELS, REPORT_TYPE_GROUPS, REPORT_TYPE_STYLES, buildReportTitle } from "@/lib/reports/types";
import { getReportShareUrl } from "@/lib/reports/share";
import { cn, formatDateTime } from "@/lib/utils";
import type { ReportType } from "@prisma/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SerializedReport = {
  id: string;
  title: string;
  type: ReportType;
  format: string;
  previewUrl: string;
  downloadUrl: string;
  fileSize: number | null;
  scanId: string | null;
  websiteId: string;
  websiteName: string;
  createdAt: string;
  shareEnabled: boolean;
  shareToken: string | null;
  scanCompletedAt: string | null;
};

interface ReportsClientProps {
  websites: { id: string; name: string; url: string }[];
  reports: SerializedReport[];
}

type ScanOption = {
  id: string;
  completedAt: Date | string | null;
  overallScore: number | null;
  createdAt: Date | string;
};

const SURFACE = "rounded-2xl border border-border/40 bg-card";
const ALL_REPORT_TYPES = REPORT_TYPE_GROUPS.flatMap((g) => g.types);

function formatFileSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatScanLabel(scan: ScanOption) {
  if (scan.completedAt) {
    return `${formatDateTime(scan.completedAt)} · ${scan.overallScore ?? "—"}/100`;
  }
  return formatDateTime(scan.createdAt);
}

function formatWebsiteUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function sanitizeFilename(name: string) {
  return name.replace(/[<>:"/\\|?*]/g, "-").slice(0, 120);
}

function reportMimeType(format: string) {
  return format === "csv" ? "text/csv" : "application/pdf";
}

function triggerDownload(base64: string, filename: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ReportTypeBadge({ type }: { type: ReportType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        REPORT_TYPE_STYLES[type]
      )}
    >
      {REPORT_TYPE_LABELS[type]}
    </span>
  );
}

function ReportActions({
  report,
  isPending,
  onShare,
  onDelete,
}: {
  report: SerializedReport;
  isPending: boolean;
  onShare: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {report.format === "pdf" ? (
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-8 px-2.5 text-xs sm:inline-flex"
          nativeButton={false}
          render={
            <a href={report.previewUrl} target="_blank" rel="noopener noreferrer">
              <Eye />
              Preview
            </a>
          }
        />
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2.5 text-xs"
        nativeButton={false}
        render={
          <a href={report.downloadUrl} target="_blank" rel="noopener noreferrer">
            <Download />
            Download
          </a>
        }
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="size-8">
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          {report.format === "pdf" ? (
            <>
              <DropdownMenuItem onClick={onShare}>
                <Share2 />
                Share link
              </DropdownMenuItem>
              <DropdownMenuItem
                nativeButton={false}
                render={
                  <a href={report.previewUrl} target="_blank" rel="noopener noreferrer">
                    <Eye />
                    Open preview
                  </a>
                }
              />
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem
            variant="destructive"
            disabled={isPending}
            onClick={onDelete}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ReportsClient({ websites, reports: initialReports }: ReportsClientProps) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [search, setSearch] = useState("");
  const [websiteFilter, setWebsiteFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<ReportType | "ALL">("ALL");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState("");
  const [selectedScanId, setSelectedScanId] = useState("");
  const [selectedType, setSelectedType] = useState<ReportType>("FULL_AUDIT");
  const [customTitle, setCustomTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [shareDialogReport, setShareDialogReport] = useState<SerializedReport | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareUpdating, setShareUpdating] = useState(false);
  const [scans, setScans] = useState<ScanOption[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, startGenerateTransition] = useTransition();

  useEffect(() => {
    setReports(initialReports);
  }, [initialReports]);

  useEffect(() => {
    if (!selectedWebsiteId) {
      setScans([]);
      setSelectedScanId("");
      return;
    }

    setLoadingScans(true);
    getWebsiteScansForReportsAction(selectedWebsiteId).then((res) => {
      if (res.success) {
        setScans(res.data);
        setSelectedScanId(res.data[0]?.id ?? "");
      } else {
        setScans([]);
        setSelectedScanId("");
      }
      setLoadingScans(false);
    });
  }, [selectedWebsiteId]);

  const selectedWebsite = websites.find((site) => site.id === selectedWebsiteId);
  const selectedScan = scans.find((scan) => scan.id === selectedScanId);

  useEffect(() => {
    if (!selectedWebsite || !selectedScan || titleTouched) return;
    setCustomTitle(
      buildReportTitle(
        selectedType,
        selectedWebsite.name,
        selectedScan.completedAt ? new Date(selectedScan.completedAt) : null
      )
    );
  }, [selectedWebsite, selectedScan, selectedType, titleTouched]);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((report) => {
      if (websiteFilter !== "ALL" && report.websiteId !== websiteFilter) return false;
      if (typeFilter !== "ALL" && report.type !== typeFilter) return false;
      if (!query) return true;
      return (
        report.title.toLowerCase().includes(query) ||
        report.websiteName.toLowerCase().includes(query) ||
        REPORT_TYPE_LABELS[report.type].toLowerCase().includes(query)
      );
    });
  }, [reports, search, websiteFilter, typeFilter]);

  const hasActiveFilters =
    search.trim().length > 0 || websiteFilter !== "ALL" || typeFilter !== "ALL";

  const openGenerateDialog = () => {
    setError(null);
    setMessage(null);
    setSelectedWebsiteId(websites[0]?.id ?? "");
    setSelectedType("FULL_AUDIT");
    setCustomTitle("");
    setTitleTouched(false);
    setSaveToLibrary(true);
    setDialogOpen(true);
  };

  const handleGenerate = () => {
    if (!selectedWebsiteId || !selectedScanId) {
      setError("Select a website and scan.");
      return;
    }

    setError(null);
    startGenerateTransition(async () => {
      const res = await generateReportAction({
        websiteId: selectedWebsiteId,
        scanId: selectedScanId,
        type: selectedType,
        customTitle: customTitle.trim() || undefined,
        saveToLibrary,
      });

      if (res.success && res.data) {
        const data = res.data;
        setDialogOpen(false);

        if (data.saved) {
          const savedReport: SerializedReport = {
            id: data.id,
            title: data.title,
            type: data.type,
            format: data.format,
            previewUrl: data.previewUrl,
            downloadUrl: data.downloadUrl,
            fileSize: data.fileSize,
            scanId: data.scanId,
            websiteId: data.websiteId,
            websiteName: data.websiteName,
            createdAt: data.createdAt,
            shareEnabled: data.shareEnabled ?? false,
            shareToken: data.shareToken ?? null,
            scanCompletedAt: data.scanCompletedAt ?? null,
          };
          setReports((prev) => [savedReport, ...prev]);
          setMessage(res.message ?? "Report saved.");
          router.refresh();
        } else {
          triggerDownload(
            data.fileBase64,
            `${sanitizeFilename(data.title)}.${data.format}`,
            reportMimeType(data.format)
          );
          setMessage(res.message ?? "Report downloaded.");
        }
      } else {
        setError(res.error ?? "Failed to generate report.");
      }
    });
  };

  const openShareDialog = (report: SerializedReport) => {
    setShareDialogReport(report);
    setShareCopied(false);
    setShareUrl(
      report.shareEnabled && report.shareToken ? getReportShareUrl(report.shareToken) : null
    );
  };

  const handleShareToggle = async (enabled: boolean) => {
    if (!shareDialogReport) return;
    setShareUpdating(true);
    setError(null);
    const res = await setReportShareAction(shareDialogReport.id, enabled);
    setShareUpdating(false);
    if (!res.success) {
      setError(res.error ?? "Failed to update sharing.");
      return;
    }
    const url = res.data?.shareUrl ?? null;
    setShareUrl(url);
    setReports((prev) =>
      prev.map((r) =>
        r.id === shareDialogReport.id
          ? { ...r, shareEnabled: enabled, shareToken: res.data?.shareToken ?? r.shareToken }
          : r
      )
    );
    setShareDialogReport((prev) => (prev ? { ...prev, shareEnabled: enabled } : prev));
    setMessage(res.message ?? (enabled ? "Share link enabled." : "Share link disabled."));
    router.refresh();
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleDelete = (reportId: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;

    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await deleteReportAction(reportId);
      if (res.success) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setMessage(res.message ?? "Report deleted.");
        router.refresh();
      } else {
        setError(res.error ?? "Failed to delete report.");
      }
    });
  };

  const clearFilters = () => {
    setSearch("");
    setWebsiteFilter("ALL");
    setTypeFilter("ALL");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {(error || message) && (
        <Alert variant={error ? "destructive" : "default"} className="py-2.5">
          <AlertDescription className="flex items-center justify-between gap-3 text-sm">
            {error ?? message}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setError(null);
                setMessage(null);
              }}
            >
              <X />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section className={cn(SURFACE, "overflow-hidden")}>
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {reports.length} saved · {websites.length} website{websites.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button onClick={openGenerateDialog} disabled={websites.length === 0}>
            <Plus />
            New report
          </Button>
        </div>

        {/* Toolbar */}
        {reports.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-border/40 px-6 py-4 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, site, or issue…"
                className="h-9 pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={websiteFilter}
                onValueChange={(value) => setWebsiteFilter(value ?? "ALL")}
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <span className="truncate text-sm">
                    {websiteFilter === "ALL"
                      ? "All sites"
                      : (websites.find((w) => w.id === websiteFilter)?.name ?? "Site")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All sites</SelectItem>
                  {websites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter((value as ReportType | "ALL") ?? "ALL")}
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <span className="truncate text-sm">
                    {typeFilter === "ALL" ? "All types" : REPORT_TYPE_LABELS[typeFilter]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {ALL_REPORT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {REPORT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters ? (
                <Button variant="ghost" size="sm" className="h-9" onClick={clearFilters}>
                  Reset
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {/* Content */}
        {websites.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border border-border/40 bg-secondary/20">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No websites connected</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a site and run an audit first.
              </p>
            </div>
            <ButtonLink href="/dashboard/websites" size="sm">
              Go to websites
            </ButtonLink>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border border-border/40 bg-secondary/20">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No reports yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate a PDF from any completed scan.
              </p>
            </div>
            <Button onClick={openGenerateDialog} size="sm">
              <Plus />
              New report
            </Button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">No reports match your filters.</p>
            <Button variant="link" size="sm" className="mt-2 h-auto p-0" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 w-[34%]">Report</TableHead>
                <TableHead className="w-[16%]">Type</TableHead>
                <TableHead className="hidden md:table-cell w-[18%]">Website</TableHead>
                <TableHead className="hidden sm:table-cell w-[14%]">Created</TableHead>
                <TableHead className="pr-6 text-right w-[18%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => {
                const size = formatFileSize(report.fileSize);
                return (
                  <TableRow key={report.id} className="group">
                    <TableCell className="pl-6 align-middle">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium">{report.title}</p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {report.websiteName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.format.toUpperCase()}
                          {size ? ` · ${size}` : ""}
                          {report.shareEnabled ? (
                            <span className="inline-flex items-center gap-1">
                              {" · "}
                              <Link2 className="size-3" />
                              Shared
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <ReportTypeBadge type={report.type} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell align-middle">
                      <Link
                        href={`/dashboard/websites/${report.websiteId}`}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {report.websiteName}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell align-middle text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(report.createdAt)}
                    </TableCell>
                    <TableCell className="pr-6 align-middle">
                      <ReportActions
                        report={report}
                        isPending={isPending}
                        onShare={() => openShareDialog(report)}
                        onDelete={() => handleDelete(report.id, report.title)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Generate */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border/40 px-6 py-5">
            <DialogTitle>New report</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Website</Label>
                <Select
                  value={selectedWebsiteId}
                  onValueChange={(value) => setSelectedWebsiteId(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <span className="truncate">{selectedWebsite?.name ?? "Select website"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {websites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        <span className="flex flex-col items-start gap-0.5">
                          <span>{site.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatWebsiteUrl(site.url)}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Scan</Label>
                <Select
                  value={selectedScanId}
                  onValueChange={(value) => setSelectedScanId(value ?? "")}
                  disabled={loadingScans || scans.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <span className="truncate text-sm">
                      {loadingScans
                        ? "Loading scans…"
                        : scans.length === 0
                          ? "No completed scans"
                          : selectedScan
                            ? formatScanLabel(selectedScan)
                            : "Select scan"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {scans.map((scan) => (
                      <SelectItem key={scan.id} value={scan.id}>
                        {formatScanLabel(scan)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => value && setSelectedType(value as ReportType)}
                >
                  <SelectTrigger className="w-full">
                    <span>{REPORT_TYPE_LABELS[selectedType]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPE_GROUPS.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.types.map((type) => (
                          <SelectItem key={type} value={type}>
                            {REPORT_TYPE_LABELS[type]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="report-name" className="text-xs text-muted-foreground">
                  Name <span className="font-normal">(optional)</span>
                </Label>
                <Input
                  id="report-name"
                  value={customTitle}
                  onChange={(e) => {
                    setTitleTouched(true);
                    setCustomTitle(e.target.value);
                  }}
                  placeholder="Auto-generated from scan"
                  maxLength={120}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-secondary/10 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Save to library</p>
                <p className="text-xs text-muted-foreground">
                  {saveToLibrary ? "Stored and shareable" : "Download only"}
                </p>
              </div>
              <Switch checked={saveToLibrary} onCheckedChange={setSaveToLibrary} />
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 px-6 py-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedScanId || loadingScans}
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : null}
              {saveToLibrary ? "Generate" : "Download"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share */}
      <Dialog
        open={!!shareDialogReport}
        onOpenChange={(open) => !open && setShareDialogReport(null)}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border/40 px-6 py-5">
            <DialogTitle>Share report</DialogTitle>
          </DialogHeader>

          {shareDialogReport ? (
            <div className="space-y-5 px-6 py-5">
              <p className="truncate text-sm text-muted-foreground">{shareDialogReport.title}</p>

              <div className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Public link</p>
                  <p className="text-xs text-muted-foreground">
                    {shareDialogReport.shareEnabled ? "Anyone with the link" : "Disabled"}
                  </p>
                </div>
                <Switch
                  checked={shareDialogReport.shareEnabled}
                  disabled={shareUpdating}
                  onCheckedChange={(checked) => void handleShareToggle(checked)}
                />
              </div>

              {shareUrl && shareDialogReport.shareEnabled ? (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Link</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={shareUrl} className="h-9 text-xs" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="size-9 shrink-0"
                      onClick={() => void copyShareLink()}
                    >
                      {shareCopied ? <Check className="text-emerald-500" /> : <Copy />}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="border-t border-border/40 px-6 py-4">
            <Button variant="outline" onClick={() => setShareDialogReport(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
