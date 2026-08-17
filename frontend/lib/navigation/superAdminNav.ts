import {
  BadgeCheck,
  Coins,
  FolderTree,
  Gavel,
  HelpCircle,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MessageSquare,
  PackageSearch,
  Radio,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
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
      { label: "Auction Requests", href: "/admin/auction-requests", icon: Radio },
      { label: "Listings", href: "/listings", icon: PackageSearch },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Browse Properties", href: "/admin/properties", icon: Home },
      { label: "Escrow", href: "/admin/escrow", icon: Coins },
      { label: "Wallet", href: "/admin/wallet", icon: Wallet },
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
    title: "Campaigns",
    items: [{ label: "Campaigns", href: "/campaigns", icon: Megaphone }],
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
    title: "Communication",
    items: [{ label: "Messages", href: "/admin/messages", icon: MessageSquare }],
  },
  
{
  title: "Administration",
  items: [
    { label: "Profile", href: "/admin/profile", icon: User },
    { label: "Staff Management", href: "/admin/users", icon: UserCog },
    { label: "KYC Review", href: "/admin/kyc", icon: ShieldCheck },
    { label: "Seller Bank Accounts", href: "/admin/seller-bank-accounts", icon: Wallet },
    { label: "Settings", href: "/admin/settings", icon: Settings },
    { label: "FAQ", href: "/admin/faqs", icon: HelpCircle },
    { label: "Contact Support", href: "/help/contact", icon: LifeBuoy },
  ],
},

];