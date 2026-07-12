import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import {
  AdminAuditVolumeChart,
  AdminKpiStrip,
  AdminSubscriptionChart,
} from "@/components/admin/admin-analytics-charts";
import { AdminActivityFeed } from "@/components/admin/admin-activity-feed";
import { AdminRecentAuditsPanel } from "@/components/admin/admin-recent-audits-panel";
import { AdminUserLocationMap } from "@/components/admin/admin-user-location-map";
import type { getAdminCommandCenter } from "@/lib/admin-data";
import { PLAN_LABELS } from "@/lib/plans";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

type CommandCenterData = Awaited<ReturnType<typeof getAdminCommandCenter>>;

const SURFACE = "rounded-3xl border border-border/30 bg-card shadow-sm";

function Panel({
  title,
  description,
  children,
  className,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn(SURFACE, "overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border/20">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function AdminCommandCenter({ data }: { data: CommandCenterData }) {
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const attentionItems = [
    ...data.pendingUpgrades.map((request) => ({
      id: `upgrade-${request.id}`,
      href: "/admin/upgrade-requests",
      title: `${request.user.name ?? request.user.email} requested ${PLAN_LABELS[request.requestedPlan]}`,
      meta: formatDateTime(request.createdAt),
      dot: "bg-amber-400",
    })),
    ...data.unreadContacts.map((message) => ({
      id: `contact-${message.id}`,
      href: "/admin/contacts",
      title: message.subject,
      meta: `${message.name} · ${formatDateTime(message.createdAt)}`,
      dot: "bg-sky-400",
    })),
    ...data.expiringTrials.map((sub) => ({
      id: `trial-${sub.userId}`,
      href: "/admin/billing",
      title: `${sub.user.name ?? sub.user.email} trial ending`,
      meta: sub.trialEndsAt ? formatDateTime(sub.trialEndsAt) : "Soon",
      dot: "bg-violet-400",
    })),
  ].slice(0, 6);

  const attentionCount = attentionItems.length;

  const kpiStats = [
    {
      label: "MRR",
      value: `$${data.estimatedMrr.toLocaleString()}`,
      sub: "From active paid plans",
      icon: "mrr" as const,
      tone: "violet" as const,
    },
    {
      label: "Users",
      value: data.activeUsers.toLocaleString(),
      sub: `${data.recentUsers.length} joined this week`,
      icon: "users" as const,
      tone: "sky" as const,
    },
    {
      label: "Websites",
      value: data.totalWebsites.toLocaleString(),
      sub: `${data.newsletterActive} newsletter subscribers`,
      icon: "websites" as const,
      tone: "emerald" as const,
    },
    {
      label: "Audits today",
      value: data.scansToday.toLocaleString(),
      sub:
        data.scanSuccessRate != null
          ? `${data.scanSuccessRate}% success · ${data.failedScansToday} failed`
          : "No runs yet today",
      icon: "audits" as const,
      tone: "amber" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{todayLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.pendingUpgrades.length > 0 ? (
            <ButtonLink href="/admin/upgrade-requests" size="sm">
              <Sparkles className="w-4 h-4" />
              {data.pendingUpgrades.length} pending upgrade
              {data.pendingUpgrades.length === 1 ? "" : "s"}
            </ButtonLink>
          ) : null}
          {data.unreadContacts.length > 0 ? (
            <ButtonLink href="/admin/contacts" variant="outline" size="sm">
              {data.unreadContacts.length} new message
              {data.unreadContacts.length === 1 ? "" : "s"}
            </ButtonLink>
          ) : null}
        </div>
      </header>

      <AdminKpiStrip stats={kpiStats} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          title="Audit activity"
          description="7-day trend with daily totals"
          className="lg:col-span-3"
        >
          <AdminAuditVolumeChart data={data.scanTrend} />
        </Panel>
        <Panel
          title="Subscriptions"
          description="Revenue mix and account status"
          className="lg:col-span-2"
        >
          <AdminSubscriptionChart
            plans={data.subscriptionPlans}
            status={data.subscriptionStatus}
            estimatedMrr={data.estimatedMrr}
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Needs attention"
          description="Upgrades, support, and expiring trials"
          action={
            attentionCount > 0 ? (
              <Badge variant="secondary" className="rounded-full tabular-nums">
                {attentionCount}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="rounded-full text-emerald-600 border-emerald-500/30"
              >
                Clear
              </Badge>
            )
          }
        >
          {attentionCount === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No pending upgrades, messages, or expiring trials.
            </p>
          ) : (
            <ul className="divide-y divide-border/15 -mx-2">
              {attentionItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-secondary/30 transition-colors group"
                  >
                    <span className={cn("h-2 w-2 rounded-full shrink-0", item.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.meta}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent audits"
          description="Latest audit runs across all websites"
          action={
            <Badge variant="outline" className="rounded-full tabular-nums">
              {data.recentAudits.length} shown
            </Badge>
          }
        >
          <AdminRecentAuditsPanel audits={data.recentAudits} />
        </Panel>
      </div>

      <Panel
        title="User locations"
        description="Approximate signup locations derived from IP addresses"
        action={
          <Badge variant="outline" className="rounded-full tabular-nums">
            {data.userLocations.length} mapped
          </Badge>
        }
      >
        <AdminUserLocationMap users={data.userLocations} />
      </Panel>

      <Panel
        title="Recent activity"
        description="Latest platform events"
        action={
          <span className="text-xs text-muted-foreground tabular-nums">
            {data.recentActivity.length} loaded
          </span>
        }
      >
        <AdminActivityFeed logs={data.recentActivity} />
      </Panel>
    </div>
  );
}
