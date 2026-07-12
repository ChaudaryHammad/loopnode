"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { WebsiteCard } from "@/components/websites/website-card";
import { WebsiteTable } from "@/components/websites/website-table";
import { Plus, Search, Grid3x3, List, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebsiteFormSkeleton } from "@/components/layout/page-loaders";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const WebsiteForm = dynamic(
  () => import("@/components/websites/website-form").then((m) => m.WebsiteForm),
  { loading: () => <WebsiteFormSkeleton /> }
);

import type { WebsiteListScan } from "@/lib/website-scan-display";

interface Scan extends WebsiteListScan {}

interface Website {
  id: string;
  name: string;
  url: string;
  scanFrequency: string;
  scans: Scan[];
  latestScan: Scan | null;
  runningScan: Scan | null;
  displayScan: Scan | null;
  monitorEnabled?: boolean;
  monitorStatus?: string | null;
}

interface WebsitesClientProps {
  initialWebsites: Website[];
  canScheduleScans?: boolean;
}

export default function WebsitesClient({
  initialWebsites,
  canScheduleScans = false,
}: WebsitesClientProps) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<"grid" | "table">("grid");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connect") === "1") {
      setModalOpen(true);
    }
  }, []);

  const filtered = initialWebsites.filter(
    (site) =>
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      site.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border/20 pb-6">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your websites and inspect their historical scan metrics.
          </p>
        </div>

        <Button id="connect-website-btn" onClick={() => setModalOpen(true)} className="shrink-0">
          <Plus />
          Connect Website
        </Button>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            id="website-search"
            placeholder="Search websites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1 bg-card border border-border/40 rounded-xl p-1">
          <Button
            id="view-grid-btn"
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("grid")}
            title="Grid view"
          >
            <Grid3x3 />
          </Button>
          <Button
            id="view-table-btn"
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("table")}
            title="Table view"
          >
            <List />
          </Button>
        </div>

        {initialWebsites.length > 0 && (
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {filtered.length} / {initialWebsites.length}
          </span>
        )}
      </div>

      {filtered.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((site) => (
              <WebsiteCard key={site.id} website={site} />
            ))}
          </div>
        ) : (
          <WebsiteTable websites={filtered} />
        )
      ) : (
        <Card className="rounded-3xl border-border/30">
          <CardContent className="flex flex-col items-center justify-center text-center py-24">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/40 text-muted-foreground mb-5">
              <Activity className="w-7 h-7" />
            </div>
            <CardTitle className="text-lg mb-1">
              {search ? "No matches found" : "No connected websites"}
            </CardTitle>
            <CardDescription className="max-w-xs leading-relaxed mb-6">
              {search
                ? "Try adjusting your search keywords to find your connected domains."
                : "Connect your first domain URL to begin running Core Web Vitals and accessibility scans."}
            </CardDescription>
            {!search && (
              <Button onClick={() => setModalOpen(true)}>
                <Plus />
                Connect Website
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-2">
          <WebsiteForm
            canScheduleScans={canScheduleScans}
            onSuccess={() => setModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
