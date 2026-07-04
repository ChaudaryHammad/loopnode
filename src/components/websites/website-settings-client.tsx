"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Trash2, Settings } from "lucide-react";
import { WebsiteForm } from "./website-form";
import { DeleteWebsiteDialog } from "./delete-website-dialog";
import { useRouter } from "next/navigation";
import { ScanFrequency } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WebsiteSettingsClientProps {
  canScheduleScans?: boolean;
  website: {
    id: string;
    name: string;
    url: string;
    scanFrequency: ScanFrequency;
    scanTimezone?: string;
    scanTimeOfDay?: string;
    scanDayOfWeek?: number | null;
    scanDayOfMonth?: number | null;
    nextScanAt?: Date | string | null;
    createdAt: Date | string;
  };
}

export function WebsiteSettingsClient({
  canScheduleScans = false,
  website,
}: WebsiteSettingsClientProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Button variant="link" size="sm" className="h-auto p-0" render={<Link href="/dashboard/websites" />} nativeButton={false}>
          Websites
        </Button>
        <span>/</span>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0"
          render={<Link href={`/dashboard/websites/${website.id}`} />}
          nativeButton={false}
        >
          {website.name}
        </Button>
        <span>/</span>
        <span className="text-foreground">Settings</span>
      </div>

      <div className="flex items-center gap-3 border-b border-border/20 pb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/40 border border-border/30">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">Website settings</h1>
          <a
            href={website.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Globe className="w-3 h-3" />
            {website.url.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <ButtonLink href={`/dashboard/websites/${website.id}`} variant="outline" size="sm">
          <ArrowLeft />
          Overview
        </ButtonLink>
      </div>

      <WebsiteForm
        websiteId={website.id}
        canScheduleScans={canScheduleScans}
        defaultValues={{
          name: website.name,
          url: website.url,
          scanFrequency: website.scanFrequency,
          scanTimezone: website.scanTimezone ?? "UTC",
          scanTimeOfDay: website.scanTimeOfDay ?? "09:00",
          scanDayOfWeek: website.scanDayOfWeek ?? 1,
          scanDayOfMonth: website.scanDayOfMonth ?? 1,
          nextScanAt: website.nextScanAt ?? null,
        }}
        onSuccess={() => router.push(`/dashboard/websites/${website.id}`)}
      />

      <Card className="border-rose-500/20 bg-rose-500/5">
        <CardHeader>
          <CardTitle className="text-sm text-rose-400">Danger zone</CardTitle>
          <CardDescription>
            Remove this website and all of its scan history, issues, and reports. You can
            reconnect the same domain once; after that, contact support to add it again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            Delete website
          </Button>
        </CardContent>
      </Card>

      <DeleteWebsiteDialog
        websiteId={website.id}
        websiteName={website.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/dashboard/websites")}
      />

      <p className="text-[11px] text-muted-foreground">
        Connected on {formatDate(website.createdAt)}
      </p>
    </div>
  );
}
