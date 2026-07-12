import React, { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardListsSection } from "@/components/dashboard/dashboard-lists-section";
import { DashboardStatsSection } from "@/components/dashboard/dashboard-stats-section";
import {
  DashboardListsLoader,
  DashboardStatsLoader,
} from "@/components/layout/page-loaders";

export const metadata = {
  title: "Dashboard Overview",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  return (
    <div className="space-y-8 select-none">
      <div className="border-b border-border/20 pb-6">
        <p className="text-xs text-muted-foreground sm:text-sm">
          Uptime, audits, and issues across your connected websites.
        </p>
      </div>

      <Suspense fallback={<DashboardStatsLoader />}>
        <DashboardStatsSection userId={userId} />
      </Suspense>

      <Suspense fallback={<DashboardListsLoader />}>
        <DashboardListsSection userId={userId} />
      </Suspense>
    </div>
  );
}
