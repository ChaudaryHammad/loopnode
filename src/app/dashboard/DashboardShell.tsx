"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DashboardShellProps {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

export function DashboardShell({ children, user }: DashboardShellProps) {
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
      {/* Desktop Collapsible Sidebar */}
      <Sidebar isAdmin={user?.role === "ADMIN"} />

      {/* Mobile Drawer Navigation */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} isAdmin={user?.role === "ADMIN"} />

      {/* Main Panel */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        {/* Header Topbar */}
        <Topbar user={user} onMenuClick={() => setMobileNavOpen(true)} />

        {/* Scrollable Content Pane */}
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
