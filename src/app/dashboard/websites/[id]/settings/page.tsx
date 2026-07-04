import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEntitlements } from "@/lib/entitlements";
import { redirect, notFound } from "next/navigation";
import { WebsiteSettingsClient } from "@/components/websites/website-settings-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const w = await prisma.website.findUnique({ where: { id }, select: { name: true } });
  return { title: `${w?.name ?? "Website"} — Settings` };
}

export default async function WebsiteSettingsPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [website, entitlements] = await Promise.all([
    prisma.website.findFirst({
      where: { id, userId: session.user.id, deletedAt: null },
    }),
    getEntitlements(session.user.id),
  ]);

  if (!website) notFound();

  return (
    <WebsiteSettingsClient
      canScheduleScans={entitlements.canScheduleScans}
      website={{
        id: website.id,
        name: website.name,
        url: website.url,
        scanFrequency: website.scanFrequency,
        scanTimezone: website.scanTimezone,
        scanTimeOfDay: website.scanTimeOfDay,
        scanDayOfWeek: website.scanDayOfWeek,
        scanDayOfMonth: website.scanDayOfMonth,
        nextScanAt: website.nextScanAt,
        createdAt: website.createdAt,
      }}
    />
  );
}
