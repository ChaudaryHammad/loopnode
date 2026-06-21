"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { Menu, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import Link from "next/link";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Generate breadcrumbs from path
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return [{ name: "Dashboard", href: "/dashboard" }];
    
    return segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      let name = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Clean up dynamic IDs
      if (name.length > 15 && (name.startsWith("Cl") || name.match(/[0-9]/))) {
        name = "Details";
      }

      // Friendly names
      if (name === "Dashboard") name = "Overview";
      if (name === "Websites") name = "Websites";
      if (name === "Reports") name = "Reports";
      if (name === "Issues") name = "Issues";

      return { name, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();
  const userInitials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email ? user.email.slice(0, 2).toUpperCase() : "US";

  return (
    <header className="flex items-center h-16 px-6 bg-card border-b border-border/40 justify-between shrink-0 select-none">
      {/* Left side: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl bg-secondary/30 border border-border/20 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="hidden sm:flex items-center space-x-1.5 text-sm font-medium text-muted-foreground">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href}>
              {idx > 0 && <span className="text-muted-foreground/30 font-normal">/</span>}
              {idx === breadcrumbs.length - 1 ? (
                <span className="text-foreground font-semibold">{crumb.name}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right side: Utilities & Profile */}
      <div className="flex items-center gap-4">
        <ThemeToggle />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl border border-border/20 hover:border-border/80 bg-secondary/20 transition-all cursor-pointer outline-none"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt="Avatar"
                className="w-7 h-7 rounded-lg object-cover border border-border/30"
              />
            ) : (
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-sans">
                {userInitials}
              </div>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Custom Dropdown Content */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-56 rounded-xl bg-card border border-border/40 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-border/30 mb-1 select-text">
                <p className="text-sm font-bold text-foreground truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                <div className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {user?.role || "User"}
                </div>
              </div>

              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
              >
                <User className="w-4 h-4" />
                Profile Settings
              </Link>
              <Link
                href="/dashboard/settings/account"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </Link>
              
              <div className="border-t border-border/30 my-1"></div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logoutAction();
                }}
                className="flex items-center w-full gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
