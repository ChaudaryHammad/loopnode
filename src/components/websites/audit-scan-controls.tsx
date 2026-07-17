"use client";

import { useState } from "react";
import { Monitor, Smartphone, Square, Zap } from "lucide-react";
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
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const { startScan, cancelScan, isRunning, isCancelling, progress } = useAuditScan({
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
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {!iconOnly ? (
          <div
            className="flex items-center rounded-lg border border-border/40 p-0.5"
            role="group"
            aria-label="Lighthouse device"
          >
            <Button
              type="button"
              variant={device === "desktop" ? "secondary" : "ghost"}
              size="icon-sm"
              title="Desktop lab (default)"
              onClick={() => setDevice("desktop")}
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={device === "mobile" ? "secondary" : "ghost"}
              size="icon-sm"
              title="Mobile lab (slow 4G, 4x CPU throttle — matches Google's mobile default)"
              onClick={() => setDevice("mobile")}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
        <Button
          variant={runVariant}
          size={size}
          onClick={() => void startScan(device)}
          title={iconOnly ? label : undefined}
          className={iconOnly ? undefined : "gap-2"}
        >
          {iconOnly ? <Zap /> : label}
        </Button>
      </div>
    </div>
  );
}

/** @deprecated Use AuditScanControls */
export function AuditTriggerButton(props: AuditScanControlsProps) {
  return <AuditScanControls {...props} />;
}
