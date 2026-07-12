import {
  LayoutDashboard,
  Globe,
  FileText,
  AlertTriangle,
  Settings,
  Activity,
  Link2,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  children?: Array<{ name: string; href: string; icon: LucideIcon }>;
};

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  {
    name: "Websites",
    href: "/dashboard/websites",
    icon: Globe,
    children: [
      { name: "All websites", href: "/dashboard/websites", icon: Globe },
      { name: "Monitoring", href: "/dashboard/monitoring", icon: Activity },
      { name: "Broken links", href: "/dashboard/broken-links", icon: Link2 },
    ],
  },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Issue Center", href: "/dashboard/issues", icon: AlertTriangle },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function isNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  if (href === "/dashboard/websites") {
    return (
      pathname === "/dashboard/websites" ||
      pathname.startsWith("/dashboard/websites/") ||
      pathname.startsWith("/dashboard/monitoring") ||
      pathname.startsWith("/dashboard/broken-links")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isChildNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard/websites") {
    return pathname === "/dashboard/websites" || pathname.startsWith("/dashboard/websites/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
