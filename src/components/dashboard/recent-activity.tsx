import React from "react";
import { Activity, Clock, PlusCircle, RefreshCw, Trash, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Log {
  id: string;
  action: string;
  description: string | null;
  createdAt: Date;
}

interface RecentActivityProps {
  logs: Log[];
}

/** User-facing labels for known actions (keeps older DB rows readable too). */
function formatActivityLabel(action: string, description: string | null): string {
  switch (action) {
    case "USER_REGISTERED":
      return "Welcome aboard — your Health Mesh account is ready";
    case "EMAIL_VERIFIED":
      return "You're all set — email verified successfully";
    case "PASSWORD_RESET":
      return "Your password was updated successfully";
    case "WEBSITE_CREATED":
      return description?.replace(/^Connected website/, "Connected") ?? "Website connected";
    case "WEBSITE_UPDATED":
      return description?.replace(/^Updated website/, "Updated") ?? "Website updated";
    case "WEBSITE_DELETED":
      return description?.replace(/^Soft-deleted website/, "Removed") ?? "Website removed";
    default:
      break;
  }

  // Soften leftover system-style "… for email@…" strings from older logs
  if (description) {
    return description
      .replace(/^User account created for\s+\S+/i, "Welcome aboard — your Health Mesh account is ready")
      .replace(/^Account created$/i, "Welcome aboard — your Health Mesh account is ready")
      .replace(/^Email verified for\s+\S+/i, "You're all set — email verified successfully")
      .replace(/^Email verified$/i, "You're all set — email verified successfully")
      .replace(/^Password reset completed for\s+\S+/i, "Your password was updated successfully")
      .replace(/^Password updated$/i, "Your password was updated successfully");
  }

  return action
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function RecentActivity({ logs }: RecentActivityProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "USER_REGISTERED":
      case "EMAIL_VERIFIED":
      case "PASSWORD_RESET":
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case "WEBSITE_CREATED":
        return <PlusCircle className="w-4 h-4 text-blue-400" />;
      case "WEBSITE_UPDATED":
        return <RefreshCw className="w-4 h-4 text-amber-400" />;
      case "WEBSITE_DELETED":
        return <Trash className="w-4 h-4 text-rose-400" />;
      case "SCAN_STARTED":
      case "SCAN_COMPLETED":
        return <Activity className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;

    return "just now";
  };

  return (
    <Card className="flex h-[380px] flex-col rounded-2xl border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4 text-primary" />
          Recent activity
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 overflow-y-auto pr-1">
        {logs.length > 0 ? (
          <div className="relative ml-2.5 space-y-5 border-l border-border/25 pl-4">
            {logs.map((log) => (
              <div key={log.id} className="group relative">
                <div className="absolute -left-[27.5px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-border/40 bg-card transition-colors group-hover:border-border/80">
                  {getActionIcon(log.action)}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium leading-tight text-foreground">
                    {formatActivityLabel(log.action, log.description)}
                  </p>
                  <span className="block text-[10px] font-medium text-muted-foreground">
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-2 py-10 text-center text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border/60">
              <Clock className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="max-w-[220px] text-xs">
              Activity like scans and website changes will show up here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
