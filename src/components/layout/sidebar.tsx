"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  LayoutDashboard, 
  Globe, 
  FileText, 
  AlertTriangle, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Websites", href: "/dashboard/websites", icon: Globe },
    { name: "Reports", href: "/dashboard/reports", icon: FileText },
    { name: "Issue Center", href: "/dashboard/issues", icon: AlertTriangle },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col h-screen bg-card border-r border-border/40 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Sidebar Header Brand */}
      <div className="flex items-center h-16 px-6 border-b border-border/40 justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden select-none">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              HealthMonitor
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/30 transition-all cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-border/40">
        <button
          onClick={() => logoutAction()}
          className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="truncate">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
