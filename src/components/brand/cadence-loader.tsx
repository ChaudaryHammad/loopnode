import React from "react";
import { cn } from "@/lib/utils";

type CadenceLoaderSize = "sm" | "md" | "lg";

const sizeStyles: Record<
  CadenceLoaderSize,
  { wrap: string; bar: string; tip: string }
> = {
  sm: { wrap: "h-3.5 gap-[3px]", bar: "w-[3px]", tip: "w-[1.5px]" },
  md: { wrap: "h-8 gap-1", bar: "w-1.5", tip: "w-[3px]" },
  lg: { wrap: "h-11 gap-1.5", bar: "w-2", tip: "w-1" },
};

/**
 * Health Mesh Cadence loader — Fade cascade (L04).
 * Full-height bars; opacity travels left → right.
 */
export function CadenceLoader({
  className,
  size = "md",
  label = "Loading",
  showLabel = false,
}: {
  className?: string;
  size?: CadenceLoaderSize;
  label?: string;
  showLabel?: boolean;
}) {
  const s = sizeStyles[size];

  return (
    <div
      className={cn("inline-flex flex-col items-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={cn("cadence-fade flex items-stretch", s.wrap)}>
        <span className={cn("cadence-fade-bar h-full bg-current", s.bar)} />
        <span className={cn("cadence-fade-bar h-full bg-current", s.bar)} />
        <span className={cn("cadence-fade-bar h-full bg-current", s.bar)} />
        <span className={cn("cadence-fade-bar h-full bg-current", s.bar)} />
        <span
          className={cn("cadence-fade-bar h-full bg-current opacity-35", s.tip)}
        />
      </div>
      {showLabel ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}

/** Centered page / card splash using Fade cascade */
export function CadenceSplash({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[12rem] w-full flex-col items-center justify-center py-12",
        className
      )}
      aria-busy="true"
    >
      <CadenceLoader size="lg" label={label} showLabel />
    </div>
  );
}
