import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Activity } from "lucide-react";
import { MarketingNavClient } from "@/components/layout/marketing-nav-client";

export async function Header() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return <MarketingNavClient isLoggedIn={isLoggedIn} />;
}
