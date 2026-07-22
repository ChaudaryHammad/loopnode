"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Shield,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_NAV,
  isChildNavActive,
  isNavActive,
} from "@/components/layout/dashboard-nav";
import { HealthMeshLogo, HealthMeshMark } from "@/components/brand/healthmesh-logo";

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const websitesSectionActive =
    isNavActive(pathname, "/dashboard/websites") ||
    pathname.startsWith("/dashboard/monitoring") ||
    pathname.startsWith("/dashboard/coverage") ||
    pathname.startsWith("/dashboard/broken-links");

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Websites: websitesSectionActive,
  });

  useEffect(() => {
    if (websitesSectionActive) {
      setOpenGroups((prev) => ({ ...prev, Websites: true }));
    }
  }, [websitesSectionActive]);

  return (
    <aside
      className={`hidden md:flex flex-col h-screen bg-card border-r border-border/40 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center h-16 px-6 border-b border-border/40 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden select-none">
          {collapsed ? (
            <HealthMeshMark variant="inverse" className="size-8" />
          ) : (
            <HealthMeshLogo
              variant="inverse"
              markClassName="size-7"
              wordmarkClassName="text-sm text-foreground"
            />
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/30 transition-all cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {DASHBOARD_NAV.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href, item.exact);
          const hasChildren = Boolean(item.children?.length);
          const expanded = Boolean(openGroups[item.name]);

          if (hasChildren && !collapsed) {
            return (
              <div key={item.name} className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((prev) => ({
                      ...prev,
                      [item.name]: !expanded,
                    }))
                  }
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/90 hover:bg-secondary/20 transition-colors"
                >
                  <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1 text-left">{item.name}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                      expanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>

                {expanded ? (
                  <div className="relative ml-[1.35rem] pl-4 space-y-0.5">
                    <span
                      aria-hidden
                      className="absolute left-0 top-1 bottom-1 w-px bg-border/70"
                    />
                    {item.children!.map((child) => {
                      const childActive = isChildNavActive(pathname, child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`relative block rounded-md px-2.5 py-2 text-[13px] transition-colors ${
                            childActive
                              ? "text-foreground font-medium bg-secondary/25"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/15"
                          }`}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 mt-3"
          >
            <Shield className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Admin panel</span>}
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-border/40">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logoutAction()}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">Log Out</span>}
        </Button>
      </div>
    </aside>
  );
}
