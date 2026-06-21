"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  LayoutDashboard, 
  Globe, 
  FileText, 
  AlertTriangle, 
  Settings, 
  X,
  LogOut
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    onClose();
  }, [pathname]);

  if (!isOpen) return null;

  const menuItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Websites", href: "/dashboard/websites", icon: Globe },
    { name: "Reports", href: "/dashboard/reports", icon: FileText },
    { name: "Issue Center", href: "/dashboard/issues", icon: AlertTriangle },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200 select-none">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
      />

      {/* Drawer Content */}
      <div className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border/40 flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="flex items-center h-16 px-6 border-b border-border/40 justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">
              HealthMonitor
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary/40 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout button in drawer footer */}
        <div className="p-4 border-t border-border/40">
          <button
            onClick={() => logoutAction()}
            className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
