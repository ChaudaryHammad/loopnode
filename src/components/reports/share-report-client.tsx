"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, FileText, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareReportClientProps {
  title: string;
  websiteName: string;
  websiteUrl: string;
  reportType: string;
  generatedAt: string;
  scanDate: string | null;
  fileUrl: string;
  previewUrl: string;
}

export function ShareReportClient({
  title,
  websiteName,
  websiteUrl,
  reportType,
  generatedAt,
  scanDate,
  fileUrl,
  previewUrl,
}: ShareReportClientProps) {
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <FileText className="size-3.5" />
                Health Mesh
                <span>·</span>
                Shared report
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="size-3.5" />
                  {websiteName}
                </span>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  {websiteUrl.replace(/^https?:\/\//, "")}
                  <ExternalLink className="size-3" />
                </a>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{reportType}</span>
                {scanDate ? <span>· Scan {scanDate}</span> : null}
                <span>· Generated {generatedAt}</span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? "Hide preview" : "Show preview"}
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={
                  <a href={`${fileUrl}?disposition=attachment`}>
                    <Download />
                    Download PDF
                  </a>
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 md:py-8">
        {showPreview && (
          <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
            <iframe title={title} src={previewUrl} className="min-h-[80vh] w-full bg-white" />
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Powered by{" "}
          <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
            Health Mesh
          </Link>
        </p>
      </div>
    </div>
  );
}
