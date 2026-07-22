import React from "react";
import { cn } from "@/lib/utils";

type LogoVariant = "ink" | "inverse" | "current";

/**
 * Health Mesh Cadence mark — five even beats; the last fades as rhythm continues.
 */
export function HealthMeshMark({
  className,
  variant = "ink",
  title,
}: {
  className?: string;
  variant?: LogoVariant;
  title?: string;
}) {
  const fill =
    variant === "ink" ? "#0A0C10" : variant === "inverse" ? "#FFFFFF" : "currentColor";

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-7 shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <rect x="3" y="6" width="4" height="20" rx="1" fill={fill} />
      <rect x="9.5" y="6" width="4" height="20" rx="1" fill={fill} />
      <rect x="16" y="6" width="4" height="20" rx="1" fill={fill} />
      <rect x="22.5" y="6" width="4" height="20" rx="1" fill={fill} />
      <rect x="29" y="6" width="2" height="20" rx="1" fill={fill} opacity="0.35" />
    </svg>
  );
}

export function HealthMeshWordmark({
  className,
  variant = "ink",
}: {
  className?: string;
  variant?: LogoVariant;
}) {
  return (
    <span
      className={cn(
        "font-display text-[15px] font-semibold tracking-[-0.03em]",
        variant === "inverse" && "text-white",
        variant === "ink" && "text-[#0A0C10]",
        variant === "current" && "text-current",
        className
      )}
    >
      Health{" "}
      <span className="font-medium opacity-65">Mesh</span>
    </span>
  );
}

export function HealthMeshLogo({
  className,
  markClassName,
  wordmarkClassName,
  variant = "ink",
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  variant?: LogoVariant;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <HealthMeshMark variant={variant} className={markClassName} />
      {showWordmark ? (
        <HealthMeshWordmark variant={variant} className={wordmarkClassName} />
      ) : null}
    </span>
  );
}
