"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelScanAction,
  getScanStatusAction,
  startScanAction,
} from "@/actions/scans";
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

function isTerminalStatus(status: string): boolean {
  return status === "COMPLETED" || status === "FAILED";
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
  const [error, setError] = useState<string | null>(null);
  const [completedScan, setCompletedScan] = useState<CompletedScanSnapshot | null>(null);
  const [progress, setProgress] = useState<AuditProgressState>(
    initialProgress ?? EMPTY_PROGRESS
  );

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      router.refresh();
    }, 500);
  }, [router]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // Sync with server props, but don't resurrect a scan the user just halted locally.
  useEffect(() => {
    if (initialRunningScanId) {
      if (!haltedLocallyRef.current) {
        setPollingId(initialRunningScanId);
        if (initialProgress) setProgress(initialProgress);
      }
      return;
    }

    haltedLocallyRef.current = false;
    setPollingId(null);
    setIsStarting(false);
  }, [initialRunningScanId, initialProgress]);

  const pollScan = useCallback(async (scanId: string) => {
    const res = await getScanStatusAction(scanId);
    if (res.success && res.data) {
      setProgress({
        phase: res.data.phase,
        statusMessage: res.data.statusMessage,
        progressPercent: res.data.progressPercent ?? 0,
        startedAt: res.data.startedAt,
      });

      if (res.data.status === "COMPLETED") {
        setCompletedScan({
          id: res.data.id,
          status: res.data.status,
          overallScore: res.data.overallScore,
          performanceScore: res.data.performanceScore,
          accessibilityScore: res.data.accessibilityScore,
          seoScore: res.data.seoScore,
          securityScore: res.data.securityScore,
          fcp: res.data.fcp,
          lcp: res.data.lcp,
          cls: res.data.cls,
          inp: res.data.inp,
          tbt: res.data.tbt,
          completedAt: res.data.completedAt,
          createdAt: res.data.createdAt,
          issueCount: res.data.issueCount,
          criticalCount: res.data.criticalCount,
        });
      }

      if (res.data.phase === "cancelled" || res.data.status === "FAILED") {
        haltedLocallyRef.current = false;
      }

      return res.data.status;
    }
    return "FAILED";
  }, []);

  const finishPolling = useCallback(() => {
    setPollingId(null);
    setIsStarting(false);
    scheduleRefresh();
  }, [scheduleRefresh]);

  useEffect(() => {
    if (!pollingId || haltedLocallyRef.current) return;

    void pollScan(pollingId);

    const interval = setInterval(async () => {
      const status = await pollScan(pollingId);
      if (isTerminalStatus(status)) {
        finishPolling();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [pollingId, pollScan, finishPolling]);

  const startScan = useCallback(async () => {
    setError(null);
    setIsStarting(true);
    haltedLocallyRef.current = false;
    setCompletedScan(null);
    setProgress(EMPTY_PROGRESS);

    try {
      const res = await startScanAction(websiteId);
      if (!res.success) {
        if (res.data?.scanId) {
          setPollingId(res.data.scanId);
          setIsStarting(false);
          return;
        }
        setError(res.error ?? "Failed to start audit.");
        setIsStarting(false);
        return;
      }

      if (!res.data?.scanId) {
        setError("Failed to start audit.");
        setIsStarting(false);
        return;
      }

      const scanId = res.data.scanId;
      setPollingId(scanId);
      setIsStarting(false);

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
            setError(
              typeof data.error === "string"
                ? data.error
                : "Audit failed to start. You can stop and try again."
            );
          }
          await pollScan(scanId);
        })
        .catch((err) => {
          console.error("Audit execute request failed:", err);
          setError("Lost connection to the audit runner. Stop the scan or refresh and try again.");
        });
    } catch (err) {
      console.error(err);
      setError("Something went wrong starting the audit.");
      setIsStarting(false);
    }
  }, [websiteId, pollScan, scheduleRefresh]);

  const cancelScan = useCallback(async () => {
    const scanId = pollingId ?? initialRunningScanId;
    if (!scanId) return;

    setIsCancelling(true);
    setError(null);
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
        setError(res.error ?? "Failed to stop audit.");
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
      setError("Something went wrong stopping the audit.");
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
    error,
    pollingId,
    progress,
    completedScan,
  };
}
