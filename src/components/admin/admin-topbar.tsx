"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

interface AdminTopbarProps {
  onMenuClick?: () => void;
}

const LABELS: Record<string, string> = {
  admin: "Overview",
  users: "Users",
  websites: "Websites",
  billing: "Billing",
  newsletter: "Newsletter",
  contacts: "Support inbox",
  "upgrade-requests": "Upgrade requests",
  "payment-methods": "Payment methods",
};

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const current = segments[segments.length - 1] ?? "admin";
  const title = LABELS[current] ?? "Admin";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-card px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Button variant="outline" size="icon-sm" className="md:hidden" onClick={onMenuClick}>
          <Menu />
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <Shield className="size-4 text-rose-500 shrink-0" />
          <span className="text-muted-foreground hidden sm:inline">Admin</span>
          <span className="text-muted-foreground/40 hidden sm:inline">/</span>
          <span className="font-semibold text-foreground truncate">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <ButtonLink href="/dashboard" variant="outline" size="sm" className="hidden sm:inline-flex">
          Back to app
        </ButtonLink>
      </div>
    </header>
  );
}
