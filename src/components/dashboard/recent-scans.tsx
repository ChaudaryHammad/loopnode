import React from "react";
import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface Scan {
  id: string;
  status: string;
  overallScore: number | null;
  createdAt: Date;
  website: {
    id: string;
    name: string;
    url: string;
  };
}

interface RecentScansProps {
  scans: Scan[];
}

export function RecentScans({ scans }: RecentScansProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
            <CheckCircle2 className="w-3 h-3" />
            Success
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-destructive/10 border border-destructive/20 text-[10px] font-bold text-destructive uppercase tracking-wide">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case "RUNNING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-500 uppercase tracking-wide animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            Auditing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/50 border border-border/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <span className="text-xs text-muted-foreground">—</span>;
    
    let color = "text-destructive bg-destructive/10 border-destructive/20";
    if (score >= 90) {
      color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    } else if (score >= 50) {
      color = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    }

    return (
      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border font-bold text-xs ${color}`}>
        {score}
      </span>
    );
  };

  return (
    <div className="bg-card border border-border/30 rounded-3xl p-6 space-y-5 flex flex-col h-[380px] select-none">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Recent Scans
        </h3>
        
        {scans.length > 0 && (
          <Link
            href="/dashboard/websites"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group"
          >
            All sites
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {scans.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/30 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 pr-4">Website</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4 text-center">Score</th>
                  <th className="pb-3 pl-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-xs">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-secondary/15 transition-colors">
                    <td className="py-3.5 pr-4 truncate max-w-[120px]">
                      <span className="block font-semibold text-foreground truncate">{scan.website.name}</span>
                      <span className="block text-[10px] text-muted-foreground truncate">{scan.website.url.replace(/^https?:\/\//, "")}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(scan.status)}</td>
                    <td className="py-3.5 px-4 text-center">{getScoreBadge(scan.overallScore)}</td>
                    <td className="py-3.5 pl-4 text-right text-muted-foreground whitespace-nowrap">
                      {new Date(scan.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground space-y-2 py-10">
            <Activity className="w-8 h-8 text-muted-foreground/40 animate-pulse" />
            <p className="text-xs">No scan reports recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
