"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Menu, User, Settings, LogOut, ChevronDown, Shield } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { getUserDisplayName } from "@/lib/user-display";
import { UserAvatar } from "@/components/user-avatar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
  onMenuClick?: () => void;
}

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Overview",
  websites: "Websites",
  monitoring: "Monitoring",
  "broken-links": "Broken links",
  reports: "Reports",
  issues: "Issue Center",
  settings: "Settings",
  account: "Account",
  billing: "Billing",
  upgrade: "Upgrade",
  performance: "Performance",
  accessibility: "Accessibility",
  seo: "SEO",
  security: "Security",
};

function isIdSegment(segment: string) {
  return segment.length > 15 && (/^[a-z0-9]+$/i.test(segment) || segment.includes("-"));
}

function labelForSegment(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ name: "Overview", href: "/dashboard" }];
  }

  return segments
    .map((segment, index) => {
      if (isIdSegment(segment)) return null;
      const href = "/" + segments.slice(0, index + 1).join("/");
      return { name: labelForSegment(segment), href };
    })
    .filter((crumb): crumb is { name: string; href: string } => crumb != null);
}

export function Topbar({ user, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const displayName = getUserDisplayName(user?.name, user?.email);
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-card px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Button variant="outline" size="icon-sm" className="md:hidden" onClick={onMenuClick}>
          <Menu />
        </Button>

        <nav
          aria-label="Breadcrumb"
          className="hidden min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground sm:flex"
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={`${crumb.href}-${idx}`}>
              {idx > 0 ? (
                <span className="font-normal text-muted-foreground/30">/</span>
              ) : null}
              {idx === breadcrumbs.length - 1 ? (
                <span className="truncate font-semibold text-foreground">{crumb.name}</span>
              ) : (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto shrink-0 p-0 text-muted-foreground"
                  render={<Link href={crumb.href} />}
                  nativeButton={false}
                >
                  {crumb.name}
                </Button>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-10 max-w-[240px] gap-2.5 rounded-xl pl-1.5 pr-2.5"
              >
                <UserAvatar
                  name={user?.name}
                  email={user?.email}
                  image={user?.image}
                  size="sm"
                  className="rounded-lg"
                  fallbackClassName="rounded-lg"
                />
                <span className="hidden min-w-0 flex-1 truncate text-left sm:block">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {displayName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
                <User />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/dashboard/settings/billing" />}>
                <Settings />
                Billing
              </DropdownMenuItem>
              {user?.role === "ADMIN" ? (
                <DropdownMenuItem render={<Link href="/admin" />}>
                  <Shield />
                  Admin
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    Admin
                  </Badge>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                void logoutAction();
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
