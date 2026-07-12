"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Globe,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  Shield,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";

const mobileItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Websites", href: "/admin/websites", icon: Globe },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Payments", href: "/admin/payment-methods", icon: Wallet },
  { name: "Upgrades", href: "/admin/upgrade-requests", icon: Sparkles },
  { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { name: "Support", href: "/admin/contacts", icon: MessageSquare },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    main.scrollTo({ top: 0, left: 0, behavior: "auto" });
    main.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AdminSidebar />

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border/40 flex flex-col h-full shadow-2xl">
              <div className="flex items-center h-16 px-6 border-b border-border/40 justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="size-4 text-rose-500" />
                  <span className="font-bold text-sm">Admin</span>
                </div>
                <button type="button" onClick={() => setMobileNavOpen(false)}>
                  <X className="size-4" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {mobileItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive
                          ? "bg-rose-500 text-white"
                          : "text-muted-foreground hover:bg-secondary/30"
                      }`}
                    >
                      <Icon className="size-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-border/40">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={() => logoutAction()}
                >
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 h-full min-w-0">
          <AdminTopbar onMenuClick={() => setMobileNavOpen(true)} />
          <main
            ref={mainRef}
            tabIndex={-1}
            className="flex-1 overflow-y-auto px-6 py-8 outline-none lg:px-8"
          >
            <div className="w-full max-w-[1600px] space-y-8 animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
