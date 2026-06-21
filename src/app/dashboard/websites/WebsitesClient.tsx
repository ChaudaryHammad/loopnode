"use client";

import React, { useState } from "react";
import { WebsiteCard } from "@/components/websites/website-card";
import { WebsiteTable } from "@/components/websites/website-table";
import { WebsiteForm } from "@/components/websites/website-form";
import { Plus, Search, Grid3x3, List, X, Activity } from "lucide-react";

interface Scan {
  id: string;
  status: string;
  overallScore: number | null;
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  securityScore: number | null;
  createdAt: Date;
}

interface Website {
  id: string;
  name: string;
  url: string;
  scanFrequency: string;
  scans: Scan[];
}

interface WebsitesClientProps {
  initialWebsites: Website[];
  onScanTrigger: (websiteId: string) => void;
}

export default function WebsitesClient({ initialWebsites, onScanTrigger }: WebsitesClientProps) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<"grid" | "table">("grid");

  const filtered = initialWebsites.filter(
    (site) =>
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      site.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none">
      {/* Top action block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/20 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Connected Websites</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your websites and inspect their historical scan metrics.
          </p>
        </div>

        <button
          id="connect-website-btn"
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all active:scale-[0.99] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Connect Website
        </button>
      </div>

      {/* Filter and view toggle bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            id="website-search"
            placeholder="Search websites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border/40 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/80 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-card border border-border/40 rounded-xl p-1">
          <button
            id="view-grid-btn"
            onClick={() => setView("grid")}
            title="Grid view"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              view === "grid"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            id="view-table-btn"
            onClick={() => setView("table")}
            title="Table view"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              view === "table"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Count badge */}
        {initialWebsites.length > 0 && (
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {filtered.length} / {initialWebsites.length}
          </span>
        )}
      </div>

      {/* Content */}
      {filtered.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((site) => (
              <WebsiteCard
                key={site.id}
                website={site}
                onScanTrigger={onScanTrigger}
              />
            ))}
          </div>
        ) : (
          <WebsiteTable websites={filtered} onScanTrigger={onScanTrigger} />
        )
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-24 bg-card border border-border/30 rounded-3xl p-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/40 text-muted-foreground mb-5">
            <Activity className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            {search ? "No matches found" : "No connected websites"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
            {search
              ? "Try adjusting your search keywords to find your connected domains."
              : "Connect your first domain URL to begin running Core Web Vitals and accessibility scans."}
          </p>
          {!search && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Connect Website
            </button>
          )}
        </div>
      )}

      {/* Connect Website Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Dialog Panel */}
          <div className="relative w-full max-w-md bg-card border border-border/40 rounded-3xl shadow-2xl p-2 z-10 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-6 top-6 p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Nested Form */}
            <div className="p-2">
              <WebsiteForm onSuccess={() => setModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
