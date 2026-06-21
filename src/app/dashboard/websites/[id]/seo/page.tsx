import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AuditPageClient } from "@/components/websites/audit-page-client";
import { Search } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const w = await prisma.website.findUnique({ where: { id }, select: { name: true } });
  return { title: `${w?.name ?? "Website"} — SEO Audit` };
}

export default async function SeoPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const website = await prisma.website.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true, name: true, url: true },
  });
  if (!website) notFound();

  const latestScan = await prisma.scan.findFirst({
    where: { websiteId: id, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    include: {
      issues: {
        where: { category: "SEO" },
        orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  return (
    <AuditPageClient
      websiteId={website.id}
      websiteName={website.name}
      websiteUrl={website.url}
      category="SEO"
      categoryLabel="SEO"
      score={latestScan?.seoScore ?? null}
      icon={<Search className="w-4 h-4" />}
      accentClass="text-amber-400 bg-amber-500/10 border-amber-500/20"
      issues={
        latestScan?.issues.map((i) => ({
          id: i.id,
          severity: i.severity as any,
          title: i.title,
          description: i.description,
          selector: i.selector,
          url: i.url,
          recommendation: i.recommendation,
        })) ?? []
      }
      lastScanned={latestScan?.completedAt?.toISOString() ?? null}
    />
  );
}
