import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditPageLoaderProps {
  categoryLabel: string;
  insightSkeleton?: React.ReactNode;
}

export function AuditPageLoader({
  categoryLabel,
  insightSkeleton,
}: AuditPageLoaderProps) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label={`Loading ${categoryLabel} audit`}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-2" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-2" />
        <Skeleton className="h-3 w-20" />
      </div>

      <div className="rounded-2xl border border-border/30 bg-card p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-1 items-start gap-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      {insightSkeleton ?? (
        <div className="rounded-2xl border border-border/30 bg-card p-6 md:p-8 space-y-4">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border/30 bg-card p-6 md:p-8 space-y-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
        <div className="space-y-3 pt-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
