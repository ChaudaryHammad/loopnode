import React from "react";
import { auth } from "@/lib/auth";
import { HomeHero } from "@/components/marketing/home-hero";
import { HomeSections } from "@/components/marketing/home-sections";

export const metadata = {
  title: "Health Mesh — Know before your users do",
  description:
    "Monitor downtime, accessibility, SSL, and production health. Health Mesh helps teams keep products reliable, accessible, and compliant.",
};

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex flex-1 flex-col">
      <HomeHero isLoggedIn={isLoggedIn} />
      <HomeSections isLoggedIn={isLoggedIn} />
    </div>
  );
}
