import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ScoreSummary } from "@/components/dashboard/score-summary";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RecentScans } from "@/components/dashboard/recent-scans";

export const metadata = {
  title: "Dashboard Overview",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // 1. Totalconnected websites
  const totalWebsites = await prisma.website.count({
    where: {
      userId,
      deletedAt: null,
    },
  });

  // 2. Active scans running
  const activeScans = await prisma.scan.count({
    where: {
      website: {
        userId,
        deletedAt: null,
      },
      status: "RUNNING",
    },
  });

  // 3. Find latest scan for each active connected website to calculate averages & issue counts
  const connectedWebsites = await prisma.website.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  const websiteIds = connectedWebsites.map((w) => w.id);

  // Fetch the latest completed scan for each website
  const latestScans = await Promise.all(
    websiteIds.map((webId) =>
      prisma.scan.findFirst({
        where: {
          websiteId: webId,
          status: "COMPLETED",
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          issues: {
            select: {
              severity: true,
              category: true,
            },
          },
        },
      })
    )
  );

  const activeCompletedScans = latestScans.filter((s) => s !== null) as any[];

  // Statistics calculation
  let performanceSum = 0;
  let accessibilitySum = 0;
  let seoSum = 0;
  let securitySum = 0;
  let brokenLinksSum = 0;
  let criticalIssues = 0;
  let accessibilityIssues = 0;
  let seoIssues = 0;

  activeCompletedScans.forEach((scan) => {
    performanceSum += scan.performanceScore || 0;
    accessibilitySum += scan.accessibilityScore || 0;
    seoSum += scan.seoScore || 0;
    securitySum += scan.securityScore || 0;
    brokenLinksSum += scan.overallScore || 0; // fallback or average

    scan.issues.forEach((issue: any) => {
      if (issue.severity === "CRITICAL") criticalIssues++;
      if (issue.category === "ACCESSIBILITY") accessibilityIssues++;
      if (issue.category === "SEO") seoIssues++;
    });
  });

  const scannedCount = activeCompletedScans.length;
  const avgPerformance = scannedCount > 0 ? Math.round(performanceSum / scannedCount) : 0;
  const avgAccessibility = scannedCount > 0 ? Math.round(accessibilitySum / scannedCount) : 0;
  const avgSeo = scannedCount > 0 ? Math.round(seoSum / scannedCount) : 0;
  const avgSecurity = scannedCount > 0 ? Math.round(securitySum / scannedCount) : 0;
  const avgBrokenLinks = scannedCount > 0 ? Math.round(brokenLinksSum / scannedCount) : 0;

  // 4. Recent Activity Log (fetch last 5 logs for this user)
  const activityLogs = await prisma.activityLog.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // 5. Recent Scans (fetch last 5 scans of the user's connected websites)
  const scansList = await prisma.scan.findMany({
    where: {
      website: {
        userId,
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      website: {
        select: {
          id: true,
          name: true,
          url: true,
        },
      },
    },
    take: 5,
  });

  return (
    <div className="space-y-8 select-none">
      {/* Welcome banner */}
      <div className="border-b border-border/20 pb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Overview Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Welcome back! Here is a summary of your connected websites' compliance status.
        </p>
      </div>

      {/* Counters Stats Cards */}
      <StatsCards
        totalWebsites={totalWebsites}
        activeScans={activeScans}
        criticalIssues={criticalIssues}
        accessibilityIssues={accessibilityIssues}
        seoIssues={seoIssues}
      />

      {/* Network Score Summary */}
      <ScoreSummary
        performance={avgPerformance}
        accessibility={avgAccessibility}
        seo={avgSeo}
        security={avgSecurity}
        brokenLinks={avgBrokenLinks}
        scannedCount={scannedCount}
      />

      {/* Lists Row: Scans & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentScans scans={scansList as any} />
        <RecentActivity logs={activityLogs} />
      </div>
    </div>
  );
}
