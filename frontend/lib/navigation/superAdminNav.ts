import {
  BadgeCheck,
  Gavel,
  Home,
  LayoutDashboard,
  Megaphone,
  PackageSearch,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
  UserSquare2,
  Wallet,
} from "lucide-react";
import type { NavSection } from "@/types/navigation";

export const superAdminNav: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Auctions",
    items: [
      { label: "Approvals", href: "/approvals", icon: BadgeCheck },
      { label: "Listings", href: "/listings", icon: PackageSearch },
      { label: "Browse Properties", href: "/properties", icon: Home },
      { label: "Wallet", href: "/wallet", icon: Wallet },
      { label: "Live Auctions", href: "/auctions", icon: Gavel },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Buyers", href: "/crm/buyers", icon: Users },
      { label: "Sellers", href: "/crm/sellers", icon: UserSquare2 },
      { label: "Leads", href: "/crm/leads", icon: TrendingUp },
    ],
  },
  {
    title: "Marketing",
    items: [{ label: "Campaigns", href: "/marketing", icon: Megaphone }],
  },
  {
    title: "Reports",
    items: [
      { label: "Revenue", href: "/reports/revenue", icon: TrendingUp },
      { label: "Auction Activity", href: "/reports/auction-activity", icon: Gavel },
      { label: "AI Insights", href: "/reports/ai-insights", icon: Sparkles },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "User Management", href: "/admin/users", icon: UserCog },
      { label: "KYC Review", href: "/admin/kyc", icon: ShieldCheck },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];