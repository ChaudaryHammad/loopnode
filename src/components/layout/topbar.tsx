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

export function Topbar({ user, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const displayName = getUserDisplayName(user?.name, user?.email);

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ name: "Dashboard", href: "/dashboard" }];

    return segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      let name = segment.charAt(0).toUpperCase() + segment.slice(1);

      if (name.length > 15 && (name.startsWith("Cl") || name.match(/[0-9]/))) {
        name = "Details";
      }

      if (name === "Dashboard") name = "Overview";
      if (name === "Websites") name = "Websites";
      if (name === "Reports") name = "Reports";
      if (name === "Issues") name = "Issues";
      if (name === "Settings") name = "Settings";
      if (name === "Billing") name = "Billing";

      return { name, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-card px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Button variant="outline" size="icon-sm" className="md:hidden" onClick={onMenuClick}>
          <Menu />
        </Button>

        <nav className="hidden items-center space-x-1.5 text-sm font-medium text-muted-foreground sm:flex">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href}>
              {idx > 0 && <span className="font-normal text-muted-foreground/30">/</span>}
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-foreground">{crumb.name}</span>
              ) : (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground"
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

          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-2 py-3">
                  <UserAvatar
                    name={user?.name}
                    email={user?.email}
                    image={user?.image}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email || ""}</p>
                    <Badge
                      variant="outline"
                      className="mt-1.5 text-[10px] uppercase tracking-wider"
                    >
                      {user?.role || "User"}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
              <User />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/dashboard/settings/billing" />}>
              <Settings />
              Account Settings
            </DropdownMenuItem>
            {user?.role === "ADMIN" && (
              <DropdownMenuItem render={<Link href="/admin" />}>
                <Shield />
                Admin panel
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => logoutAction()}>
              <LogOut />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
