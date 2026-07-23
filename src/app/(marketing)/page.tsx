import React from "react";
import { auth } from "@/lib/auth";
import { HomeHero } from "@/components/marketing/home-hero";
import { HomeSections } from "@/components/marketing/home-sections";
import { marketingMetadata } from "@/lib/marketing/seo";
import { JsonLd } from "@/components/marketing/json-ld";
import { breadcrumbJsonLd } from "@/lib/marketing/json-ld";

export const metadata = marketingMetadata({
  title: "Health Mesh — Website Health Monitoring Software",
  absoluteTitle: true,
  description:
    "Health Mesh is website monitoring and audit software for uptime, Core Web Vitals, accessibility, SEO, security headers, and broken links. Sign in with email or Google to manage your sites.",
  path: "/",
  keywords: [
    "Health Mesh",
    "website health monitoring",
    "website monitoring software",
    "uptime monitoring",
    "Core Web Vitals monitoring",
    "website accessibility audit",
    "technical SEO monitoring",
  ],
});

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex flex-1 flex-col">
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Home", path: "/" }])}
      />
      <HomeHero isLoggedIn={isLoggedIn} />
      <HomeSections isLoggedIn={isLoggedIn} />
    </div>
  );
}
