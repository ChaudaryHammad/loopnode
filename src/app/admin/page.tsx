import Link from "next/link";
import {
  AlertTriangle,
  Globe,
  Mail,
  MessageSquare,
  Scan,
  Users,
  XCircle,
} from "lucide-react";
import { getAdminOverviewStats } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata = {
  title: "Admin Overview",
};

export default async function AdminOverviewPage() {
  const stats = await getAdminOverviewStats();

  const statCards = [
    { label: "Active users", value: stats.activeUsers, sub: `${stats.bannedUsers} banned`, icon: Users },
    { label: "Websites", value: stats.totalWebsites, sub: "Across all tenants", icon: Globe },
    { label: "Scans today", value: stats.scansToday, sub: `${stats.failedScansToday} failed`, icon: Scan },
    { label: "Support inbox", value: stats.newContacts, sub: "Unread messages", icon: MessageSquare },
    { label: "Newsletter", value: stats.newsletterActive, sub: "Active subscribers", icon: Mail },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-border/20 pb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground">
          Platform health, user activity, and operational metrics.
        </p>
      </div>

      <Alert>
        <AlertDescription>
          Configure customer payment options under{" "}
          <a href="/admin/payment-methods" className="text-primary hover:underline">
            Payment methods
          </a>
          . Review submitted payments on{" "}
          <a href="/admin/upgrade-requests" className="text-primary hover:underline">
            Upgrades
          </a>
          . MRR is estimated from active paid plans.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="rounded-2xl border-border/30">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  {card.label}
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">{card.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Subscriptions</CardTitle>
            <CardDescription>
              Estimated MRR:{" "}
              <span className="font-semibold text-foreground">
                ${stats.estimatedMrr.toLocaleString()}/mo
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(stats.subscriptionStatus).length === 0 ? (
              <p className="text-sm text-muted-foreground">No subscription records yet.</p>
            ) : (
              Object.entries(stats.subscriptionStatus).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  {status}: {count}
                </Badge>
              ))
            )}
            <div className="w-full pt-2">
              <Link href="/admin/billing" className="text-sm text-primary hover:underline">
                Manage billing →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Failed jobs today</CardTitle>
            <CardDescription>Audit and broken-link scan failures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Failed audits</span>
              <span className="font-medium tabular-nums">{stats.failedScansToday}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-muted-foreground">Failed link scans</span>
              <span className="font-medium tabular-nums">{stats.failedBrokenLinkScansToday}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              stats.recentActivity.map((log) => (
                <div key={log.id} className="border-b border-border/20 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {log.description ?? "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {log.user.email} · {formatDateTime(log.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="size-4 text-rose-500" />
              Recent failed scans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentFailedScans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No failed scans.</p>
            ) : (
              stats.recentFailedScans.map((scan) => (
                <div key={scan.id} className="border-b border-border/20 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium">{scan.website.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{scan.errorMessage}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {scan.website.user.email} · {formatDateTime(scan.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            First-time setup
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Promote a user to admin in Prisma Studio: set <code className="text-foreground">role</code>{" "}
            to <code className="text-foreground">ADMIN</code> on their user record, then sign out and
            back in.
          </p>
          <p>
            User impersonation is intentionally not enabled — use manual plan overrides and force-scan
            tools instead.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
