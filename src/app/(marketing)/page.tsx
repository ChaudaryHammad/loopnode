import React from "react";
import { auth } from "@/lib/auth";
import { HeroSection } from "@/components/marketing/hero-section";
import { MarketingSections } from "@/components/marketing/marketing-sections";

export const metadata = {
  title: "LoopNode — Website health monitoring & audits",
  description:
    "Monitor performance, accessibility, SEO, and security. Crawl broken links, track scores over time, and fix issues before your users notice.",
};

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex-1 flex flex-col items-center overflow-hidden">
      <HeroSection isLoggedIn={isLoggedIn} />
      <MarketingSections isLoggedIn={isLoggedIn} />
    </div>
  );
}
