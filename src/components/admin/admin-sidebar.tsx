"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
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
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const menuItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Websites", href: "/admin/websites", icon: Globe },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Payments", href: "/admin/payment-methods", icon: Wallet },
  { name: "Upgrades", href: "/admin/upgrade-requests", icon: Sparkles },
  { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { name: "Support", href: "/admin/contacts", icon: MessageSquare },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`hidden md:flex flex-col h-screen bg-card border-r border-border/40 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center h-16 px-6 border-b border-border/40 justify-between">
        <Link href="/admin" className="flex items-center gap-3 overflow-hidden select-none">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight">Admin</span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/30 transition-all cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/40 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          render={<Link href="/dashboard" />}
          nativeButton={false}
        >
          <Activity className="w-4 h-4 shrink-0" />
          {!collapsed && <span>User dashboard</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logoutAction()}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </Button>
      </div>
    </aside>
  );
}
