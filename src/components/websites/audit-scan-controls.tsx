"use client";

import { RefreshCw, Square, Zap } from "lucide-react";
import { useAuditScan } from "@/hooks/use-audit-scan";
import { AuditProgressPanel, type AuditProgressState } from "@/components/websites/audit-progress-panel";
import { Button } from "@/components/ui/button";

interface AuditScanControlsProps {
  websiteId: string;
  runningScanId?: string | null;
  initialProgress?: AuditProgressState | null;
  label?: string;
  runningLabel?: string;
  iconOnly?: boolean;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
  className?: string;
  runVariant?: "default" | "link" | "outline" | "ghost" | "secondary";
  showProgressPanel?: boolean;
}

export function AuditScanControls({
  websiteId,
  runningScanId,
  initialProgress,
  label = "Audit now",
  runningLabel = "Auditing…",
  iconOnly = false,
  size = "sm",
  className,
  runVariant = "link",
  showProgressPanel = false,
}: AuditScanControlsProps) {
  const { startScan, cancelScan, isRunning, isCancelling, error, progress } = useAuditScan({
    websiteId,
    initialRunningScanId: runningScanId ?? null,
    initialProgress,
  });

  if (isRunning) {
    return (
      <div className={`space-y-4 ${className ?? ""}`}>
        {showProgressPanel ? (
          <AuditProgressPanel progress={progress} />
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant={runVariant} size={size} disabled className="gap-2">
            <RefreshCw className="animate-spin" />
            {!iconOnly && runningLabel}
          </Button>
          <Button
            variant="destructive"
            size={size}
            onClick={() => void cancelScan()}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <RefreshCw className="animate-spin" />
            ) : (
              <Square className="fill-current" />
            )}
            {!iconOnly && (isCancelling ? "Stopping…" : "Stop audit")}
          </Button>
        </div>

        {!showProgressPanel && !iconOnly ? (
          <AuditProgressPanel progress={progress} compact />
        ) : null}

        {error && !iconOnly ? (
          <span className="block w-full text-xs text-destructive">{error}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        variant={runVariant}
        size={size}
        onClick={() => void startScan()}
        title={iconOnly ? label : undefined}
        className={iconOnly ? undefined : "gap-2"}
      >
        {iconOnly ? <Zap /> : label}
      </Button>
      {error && !iconOnly ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

/** @deprecated Use AuditScanControls */
export function AuditTriggerButton(props: AuditScanControlsProps) {
  return <AuditScanControls {...props} />;
}
