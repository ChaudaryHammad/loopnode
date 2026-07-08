import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { BrokenLinksClient } from "@/components/websites/broken-links-client";
import { ALL_LINK_RESOURCE_TYPES } from "@/lib/scanner/link-resource-types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const w = await prisma.website.findUnique({ where: { id }, select: { name: true } });
  return { title: `${w?.name ?? "Website"} — Broken Links` };
}

function serializeResults(
  results: Array<{
    id: string;
    href: string;
    sourcePageUrl: string;
    statusCode: number | null;
    errorMessage: string | null;
    elementTag: string | null;
    elementId: string | null;
    elementClass: string | null;
    elementText: string | null;
    selector: string | null;
    attribute: string | null;
    severity: string;
  }>
) {
  return results.map((r) => ({
    id: r.id,
    href: r.href,
    sourcePageUrl: r.sourcePageUrl,
    statusCode: r.statusCode,
    errorMessage: r.errorMessage,
    elementTag: r.elementTag,
    elementId: r.elementId,
    elementClass: r.elementClass,
    elementText: r.elementText,
    selector: r.selector,
    attribute: r.attribute,
    severity: r.severity as "CRITICAL" | "MAJOR" | "MINOR" | "INFO",
  }));
}

export default async function BrokenLinksPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const website = await prisma.website.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true, name: true, url: true },
  });
  if (!website) notFound();

  const latestScan = await prisma.brokenLinkScan.findFirst({
    where: { websiteId: id },
    orderBy: { createdAt: "desc" },
    include: {
      results: {
        orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  const serializedScan = latestScan
    ? {
        id: latestScan.id,
        status: latestScan.status,
        mode: latestScan.mode,
        resourceTypes: [...ALL_LINK_RESOURCE_TYPES],
        phase: latestScan.phase,
        statusMessage: latestScan.statusMessage,
        pagesDiscovered: latestScan.pagesDiscovered,
        pagesCrawled: latestScan.pagesCrawled,
        linksFound: latestScan.linksFound,
        linksChecked: latestScan.linksChecked,
        brokenCount: latestScan.brokenCount,
        progressPercent: latestScan.progressPercent,
        errorMessage: latestScan.errorMessage,
        completedAt: latestScan.completedAt?.toISOString() ?? null,
        createdAt: latestScan.createdAt.toISOString(),
      }
    : null;

  const initialResults =
    latestScan &&
    (latestScan.status === "COMPLETED" ||
      latestScan.phase === "cancelled" ||
      latestScan.status === "FAILED")
      ? serializeResults(latestScan.results)
      : [];

  return (
    <BrokenLinksClient
      websiteId={website.id}
      websiteName={website.name}
      websiteUrl={website.url}
      initialScan={serializedScan}
      initialResults={initialResults}
      deferSitemapEstimate
    />
  );
}
