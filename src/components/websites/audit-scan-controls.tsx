"use client";

import { Square, Zap } from "lucide-react";
import { useAuditScan } from "@/hooks/use-audit-scan";
import { AuditProgressPanel, type AuditProgressState } from "@/components/websites/audit-progress-panel";
import { Button } from "@/components/ui/button";

interface AuditScanControlsProps {
  websiteId: string;
  runningScanId?: string | null;
  initialProgress?: AuditProgressState | null;
  label?: string;
  stopLabel?: string;
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
  stopLabel = "Stop audit",
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
      <div className={`space-y-3 ${className ?? ""}`}>
        {showProgressPanel ? <AuditProgressPanel progress={progress} compact /> : null}

        <Button
          variant="destructive"
          size={size}
          onClick={() => void cancelScan()}
          disabled={isCancelling}
          className={iconOnly ? undefined : "gap-2"}
          title={iconOnly ? stopLabel : undefined}
        >
          {iconOnly ? <Square className="fill-current" /> : isCancelling ? "Stopping…" : stopLabel}
        </Button>

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
