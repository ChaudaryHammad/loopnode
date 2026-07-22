import { Skeleton } from "@/components/ui/skeleton";
import { CadenceSplash } from "@/components/brand/cadence-loader";

export function DashboardOverviewLoader() {
  return <CadenceSplash label="Loading dashboard" className="min-h-[50vh]" />;
}

export function DashboardStatsLoader() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}

export function DashboardListsLoader() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2" aria-busy="true">
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

export function DataTablePageLoader() {
  return <CadenceSplash label="Loading" className="min-h-[40vh]" />;
}

export function SettingsPageLoader() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <div className="space-y-4 rounded-2xl border border-border/30 p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
    </div>
  );
}

export function WebsiteOverviewLoader() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export function BrokenLinksPageLoader() {
  return (
    <div className="w-full max-w-6xl space-y-6" aria-busy="true">
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  );
}

export function MonitoringPageLoader() {
  return (
    <div className="w-full max-w-6xl space-y-8 pb-12" aria-busy="true">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        <div className="flex flex-wrap gap-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <Skeleton className="h-[88px] w-full rounded-xl" />

      <div className="space-y-6">
        <div className="flex gap-4 border-b border-border/40 pb-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function AdminPageLoader() {
  return <DashboardOverviewLoader />;
}

export function AdminTablePageLoader() {
  return <DataTablePageLoader />;
}

export function AuthCardLoader() {
  return <CadenceSplash label="Loading" className="min-h-[16rem]" />;
}

export function ShareReportLoader() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-[70vh] w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function UpgradePageLoader() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function SeoSnapshotSkeleton() {
  return (
    <div className="rounded-2xl border border-border/30 bg-card p-6 md:p-8 space-y-5" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function SecurityHeadersSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="rounded-2xl border border-border/30 bg-card p-6 md:p-8 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-20 rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border/30 bg-card p-6 md:p-8 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

export function PerformanceInsightSkeleton() {
  return (
    <div className="rounded-2xl border border-border/30 bg-card p-6 md:p-8 space-y-6" aria-busy="true">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-14 w-16" />
      </div>
      <Skeleton className="h-4 w-full rounded-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function WebsiteFormSkeleton() {
  return (
    <div className="space-y-4 p-6" aria-busy="true">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}
