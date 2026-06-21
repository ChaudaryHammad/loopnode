import React from "react";
import { Activity, Clock, PlusCircle, RefreshCw, Trash, UserCheck } from "lucide-react";

interface Log {
  id: string;
  action: string;
  description: string | null;
  createdAt: Date;
}

interface RecentActivityProps {
  logs: Log[];
}

export function RecentActivity({ logs }: RecentActivityProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "USER_REGISTERED":
      case "EMAIL_VERIFIED":
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case "WEBSITE_CREATED":
        return <PlusCircle className="w-4 h-4 text-blue-500" />;
      case "WEBSITE_UPDATED":
        return <RefreshCw className="w-4 h-4 text-amber-500" />;
      case "WEBSITE_DELETED":
        return <Trash className="w-4 h-4 text-rose-500" />;
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
    <div className="bg-card border border-border/30 rounded-3xl p-6 space-y-5 flex flex-col h-[380px] select-none">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: "10s" }} />
        Recent Activity
      </h3>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {logs.length > 0 ? (
          <div className="relative border-l border-border/20 pl-4 ml-2.5 space-y-5">
            {logs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Timeline Icon Node */}
                <div className="absolute -left-[27.5px] top-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-border/40 group-hover:border-border/80 transition-colors">
                  {getActionIcon(log.action)}
                </div>
                
                {/* Log Meta */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground leading-tight">
                    {log.description || log.action.replace("_", " ")}
                  </p>
                  <span className="block text-[10px] text-muted-foreground font-medium">
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground space-y-2 py-10">
            <Clock className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-xs">No activity logs recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
