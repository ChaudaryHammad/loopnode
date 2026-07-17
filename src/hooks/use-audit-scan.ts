"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelScanAction, startScanAction } from "@/actions/scans";
import { toast } from "@/lib/toast";
import type { AuditProgressState } from "@/components/websites/audit-progress-panel";

export interface CompletedScanSnapshot {
  id: string;
  status: string;
  overallScore: number | null;
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  securityScore: number | null;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  tbt: number | null;
  completedAt: Date | string | null;
  createdAt: Date | string;
  issueCount: number;
  criticalCount: number;
}

interface UseAuditScanOptions {
  websiteId: string;
  initialRunningScanId?: string | null;
  initialProgress?: AuditProgressState | null;
}

const EMPTY_PROGRESS: AuditProgressState = {
  phase: "queued",
  statusMessage: "Preparing audit…",
  progressPercent: 2,
  startedAt: null,
};

const POLL_MS = 1000;

function isTerminalStatus(status: string): boolean {
  return status === "COMPLETED" || status === "FAILED";
}

type ScanStatusPayload = CompletedScanSnapshot & {
  phase: string | null;
  statusMessage: string | null;
  progressPercent: number;
  startedAt: Date | string | null;
  errorMessage: string | null;
};

async function fetchScanStatus(scanId: string): Promise<{
  ok: boolean;
  status: string;
  data?: ScanStatusPayload;
}> {
  const response = await fetch(`/api/audits/${scanId}/status`, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
  });

  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    data?: ScanStatusPayload;
  };

  if (!response.ok || !body.success || !body.data) {
    return { ok: false, status: "FAILED" };
  }

  return { ok: true, status: body.data.status, data: body.data };
}

export function useAuditScan({
  websiteId,
  initialRunningScanId,
  initialProgress,
}: UseAuditScanOptions) {
  const router = useRouter();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const haltedLocallyRef = useRef(false);
  const [pollingId, setPollingId] = useState<string | null>(initialRunningScanId ?? null);
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [completedScan, setCompletedScan] = useState<CompletedScanSnapshot | null>(null);
  const [progress, setProgress] = useState<AuditProgressState>(
    initialProgress ?? EMPTY_PROGRESS
  );

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      router.refresh();
    }, 400);
  }, [router]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // Start polling when the server says a scan is running — never overwrite live progress from props.
  useEffect(() => {
    if (initialRunningScanId) {
      if (!haltedLocallyRef.current) {
        setPollingId((current) => current ?? initialRunningScanId);
      }
      return;
    }

    haltedLocallyRef.current = false;
    setPollingId(null);
    setIsStarting(false);
  }, [initialRunningScanId]);

  const applyScanPayload = useCallback((data: ScanStatusPayload) => {
    setProgress({
      phase: data.phase,
      statusMessage: data.statusMessage,
      progressPercent: data.progressPercent ?? 0,
      startedAt: data.startedAt,
    });

    if (data.status === "COMPLETED") {
      setCompletedScan({
        id: data.id,
        status: data.status,
        overallScore: data.overallScore,
        performanceScore: data.performanceScore,
        accessibilityScore: data.accessibilityScore,
        seoScore: data.seoScore,
        securityScore: data.securityScore,
        fcp: data.fcp,
        lcp: data.lcp,
        cls: data.cls,
        inp: data.inp,
        tbt: data.tbt,
        completedAt: data.completedAt,
        createdAt: data.createdAt,
        issueCount: data.issueCount,
        criticalCount: data.criticalCount,
      });
    }

    if (data.phase === "cancelled" || data.status === "FAILED") {
      haltedLocallyRef.current = false;
    }
  }, []);

  const pollScan = useCallback(
    async (scanId: string) => {
      const result = await fetchScanStatus(scanId);
      if (result.ok && result.data) {
        applyScanPayload(result.data);
        return result.status;
      }
      return "FAILED";
    },
    [applyScanPayload]
  );

  const finishPolling = useCallback(() => {
    setPollingId(null);
    setIsStarting(false);
    scheduleRefresh();
  }, [scheduleRefresh]);

  useEffect(() => {
    if (!pollingId || haltedLocallyRef.current) return;

    let cancelled = false;

    const runPoll = async () => {
      if (cancelled || haltedLocallyRef.current) return;
      const status = await pollScan(pollingId);
      if (cancelled) return;
      if (isTerminalStatus(status)) {
        finishPolling();
      }
    };

    void runPoll();
    const interval = setInterval(runPoll, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void runPoll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pollingId, pollScan, finishPolling]);

  const startScan = useCallback(async (device: "desktop" | "mobile" = "desktop") => {
    setIsStarting(true);
    haltedLocallyRef.current = false;
    setCompletedScan(null);
    setProgress(EMPTY_PROGRESS);

    try {
      const res = await startScanAction(websiteId, { device });
      if (!res.success) {
        if (res.data?.scanId) {
          setPollingId(res.data.scanId);
          setIsStarting(false);
          return;
        }
        toast.error(res.error ?? "Failed to start audit.");
        setIsStarting(false);
        return;
      }

      if (!res.data?.scanId) {
        toast.error("Failed to start audit.");
        setIsStarting(false);
        return;
      }

      const scanId = res.data.scanId;
      setPollingId(scanId);
      setIsStarting(false);
      toast.success("Audit started.");

      // Prefer server-side dispatch from startScanAction; keep execute as a safety net
      // for older clients / local recovery when the row was created without a run id.
      if (!res.data?.runId) {
        void fetch(`/api/audits/${scanId}/execute`, { method: "POST" })
          .then(async (response) => {
            const data = await response.json().catch(() => ({}));
            if (response.status === 409 || data.cancelled) {
              haltedLocallyRef.current = true;
              setPollingId(null);
              setProgress({
                phase: "cancelled",
                statusMessage: "Audit stopped.",
                progressPercent: 0,
                startedAt: null,
              });
              scheduleRefresh();
              return;
            }
            if (!response.ok) {
              toast.error(
                typeof data.error === "string"
                  ? data.error
                  : "Audit failed to start. You can stop and try again."
              );
            }
            await pollScan(scanId);
          })
          .catch((err) => {
            console.error("Audit execute request failed:", err);
            toast.error(
              "Lost connection to the audit runner. Stop the scan or refresh and try again."
            );
          });
      } else {
        await pollScan(scanId);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong starting the audit.");
      setIsStarting(false);
    }
  }, [websiteId, pollScan, scheduleRefresh]);

  const cancelScan = useCallback(async () => {
    const scanId = pollingId ?? initialRunningScanId;
    if (!scanId) return;

    setIsCancelling(true);
    haltedLocallyRef.current = true;
    setPollingId(null);
    setIsStarting(false);
    setProgress({
      phase: "cancelled",
      statusMessage: "Stopping audit…",
      progressPercent: 0,
      startedAt: null,
    });

    try {
      const res = await cancelScanAction(scanId);
      if (!res.success) {
        haltedLocallyRef.current = false;
        setPollingId(scanId);
        toast.error(res.error ?? "Failed to stop audit.");
        return;
      }

      setProgress({
        phase: "cancelled",
        statusMessage: "Audit stopped.",
        progressPercent: 0,
        startedAt: null,
      });
      scheduleRefresh();
    } catch (err) {
      console.error(err);
      haltedLocallyRef.current = false;
      setPollingId(scanId);
      toast.error("Something went wrong stopping the audit.");
    } finally {
      setIsCancelling(false);
    }
  }, [pollingId, initialRunningScanId, scheduleRefresh]);

  const isRunning =
    !haltedLocallyRef.current && (isStarting || pollingId !== null);

  return {
    startScan,
    cancelScan,
    isRunning,
    isCancelling,
    pollingId,
    progress,
    completedScan,
  };
}
