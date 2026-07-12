"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, X, LogOut, Shield, ChevronDown } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_NAV,
  isChildNavActive,
  isNavActive,
} from "@/components/layout/dashboard-nav";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function MobileNav({ isOpen, onClose, isAdmin = false }: MobileNavProps) {
  const pathname = usePathname();
  const websitesSectionActive =
    isNavActive(pathname, "/dashboard/websites") ||
    pathname.startsWith("/dashboard/monitoring") ||
    pathname.startsWith("/dashboard/broken-links");

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Websites: true,
  });

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close only on route change
  }, [pathname]);

  useEffect(() => {
    if (websitesSectionActive) {
      setOpenGroups((prev) => ({ ...prev, Websites: true }));
    }
  }, [websitesSectionActive]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200 select-none">
      <div onClick={onClose} className="fixed inset-0 bg-background/80 backdrop-blur-sm" />

      <div className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border/40 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300">
        <div className="flex items-center h-16 px-6 border-b border-border/40 justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">LoopNode</span>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {DASHBOARD_NAV.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href, item.exact);
            const hasChildren = Boolean(item.children?.length);
            const expanded = Boolean(openGroups[item.name]);

            if (hasChildren) {
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
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-left">{item.name}</span>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 mt-3"
            >
              <Shield className="w-4 h-4" />
              <span>Admin panel</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-border/40">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => logoutAction()}
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
