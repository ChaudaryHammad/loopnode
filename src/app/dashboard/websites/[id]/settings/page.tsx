import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const website = await prisma.website.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true, name: true, url: true, scanFrequency: true, createdAt: true },
  });
  if (!website) notFound();

  return (
    <WebsiteSettingsClient
      website={{
        id: website.id,
        name: website.name,
        url: website.url,
        scanFrequency: website.scanFrequency,
        createdAt: website.createdAt,
      }}
    />
  );
}
