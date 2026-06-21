import React from "react";
import { Globe, AlertTriangle, Play, ShieldAlert, BadgeCheck, Eye } from "lucide-react";

interface StatsCardsProps {
  totalWebsites: number;
  activeScans: number;
  criticalIssues: number;
  accessibilityIssues: number;
  seoIssues: number;
}

export function StatsCards({
  totalWebsites,
  activeScans,
  criticalIssues,
  accessibilityIssues,
  seoIssues,
}: StatsCardsProps) {
  const cards = [
    {
      title: "Total Websites",
      value: totalWebsites,
      description: "Connected web domains",
      icon: Globe,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Active Scans",
      value: activeScans,
      description: "Running audits in queue",
      icon: Play,
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Critical Issues",
      value: criticalIssues,
      description: "Errors requiring hotfixes",
      icon: ShieldAlert,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    {
      title: "Accessibility Issues",
      value: accessibilityIssues,
      description: "A11y parsing warnings",
      icon: Eye, // Wait, import Eye from lucide-react if we use it, let's use AlertTriangle instead
      iconComponent: AlertTriangle,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "SEO Issues",
      value: seoIssues,
      description: "Indexing and tag warnings",
      icon: BadgeCheck,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 select-none">
      {cards.map((card, idx) => {
        const Icon = card.iconComponent || card.icon;
        return (
          <div
            key={idx}
            className="bg-card border border-border/30 rounded-2xl p-5 space-y-4 hover:border-border/80 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground tracking-tight">
                {card.title}
              </span>
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg border ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-2xl font-extrabold text-foreground tracking-tight">
                {card.value}
              </span>
              <p className="text-[10px] text-muted-foreground leading-none">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
