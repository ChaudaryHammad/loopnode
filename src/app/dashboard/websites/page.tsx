import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WebsitesClient from "./WebsitesClient";
import { triggerScanAction } from "@/actions/scans";

export const metadata = {
  title: "Connected Websites",
};

export default async function WebsitesPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const websites = await prisma.website.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
    },
    include: {
      scans: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = websites.map((site) => ({
    id: site.id,
    name: site.name,
    url: site.url,
    scanFrequency: site.scanFrequency,
    scans: site.scans.map((scan) => ({
      id: scan.id,
      status: scan.status,
      overallScore: scan.overallScore,
      performanceScore: scan.performanceScore,
      accessibilityScore: scan.accessibilityScore,
      seoScore: scan.seoScore,
      securityScore: scan.securityScore,
      createdAt: scan.createdAt,
    })),
  }));

  const handleScanTrigger = async (websiteId: string) => {
    "use server";
    await triggerScanAction(websiteId);
  };

  return (
    <WebsitesClient
      initialWebsites={serialized}
      onScanTrigger={handleScanTrigger}
    />
  );
}
