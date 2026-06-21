"use client";

import React, { useTransition, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Trash2, Settings, Loader2 } from "lucide-react";
import { WebsiteForm } from "./website-form";
import { deleteWebsiteAction } from "@/actions/websites";
import { useRouter } from "next/navigation";
import { ScanFrequency } from "@prisma/client";

interface WebsiteSettingsClientProps {
  website: {
    id: string;
    name: string;
    url: string;
    scanFrequency: ScanFrequency;
    createdAt: Date | string;
  };
}

export function WebsiteSettingsClient({ website }: WebsiteSettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${website.name}"? All scans and data will be permanently removed.`
      )
    ) {
      startTransition(async () => {
        const res = await deleteWebsiteAction(website.id);
        if (res.success) {
          setDeleted(true);
          router.push("/dashboard/websites");
        }
      });
    }
  };

  return (
    <div className="space-y-8 select-none max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/dashboard/websites" className="hover:text-foreground transition-colors">
          Websites
        </Link>
        <span>/</span>
        <Link
          href={`/dashboard/websites/${website.id}`}
          className="hover:text-foreground transition-colors"
        >
          {website.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">Settings</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/20 pb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/40 border border-border/30">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Website Settings</h1>
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
        <Link
          href={`/dashboard/websites/${website.id}`}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl bg-secondary/40 border border-border/30"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Overview
        </Link>
      </div>

      {/* Edit form */}
      <WebsiteForm
        websiteId={website.id}
        defaultValues={{
          name: website.name,
          url: website.url,
          scanFrequency: website.scanFrequency,
        }}
        onSuccess={() => router.push(`/dashboard/websites/${website.id}`)}
      />

      {/* Danger zone */}
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-rose-400">Danger Zone</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Permanently delete this website and all of its scan history, issues, and reports. This
          action cannot be undone.
        </p>
        <button
          onClick={handleDelete}
          disabled={isPending || deleted}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {isPending ? "Deleting…" : "Delete Website"}
        </button>
      </div>

      {/* Meta */}
      <p className="text-[11px] text-muted-foreground">
        Connected on {new Date(website.createdAt).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric",
        })}
      </p>
    </div>
  );
}
