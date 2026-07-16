import {
  BadgeCheck,
  Gavel,
  LayoutDashboard,
  Megaphone,
  PackageSearch,
  Settings,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
  UserSquare2,
} from "lucide-react";
import type { NavSection } from "@/types/navigation";

// Scoped from:
// - Sam's doc: Director/Executive KPI list (Revenue, Active Auctions, Buyer
//   Activity, Seller Performance, Marketing Performance, AI Insights) and the
//   2-of-3 approval workflow.
// - Real backend permission modules from AUTH_API.md (buyer_crm, seller_crm,
//   lead_management, asset_management, auction_management,
//   marketing_campaigns, reports, user_management, system_settings).
// - The original planned folder tree's (admin) route group.
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
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];