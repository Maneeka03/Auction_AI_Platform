import {
  Clock,
  FileText,
  Gavel,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Tag,
  User,
  Wallet,
} from "lucide-react";
import type { NavSection } from "@/types/navigation";

export const sellerNav: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Listings",
    items: [
      { label: "My Listings", href: "/seller/listings", icon: Package },
      { label: "Pending Verification", href: "/seller/pending", icon: Clock },
      { label: "Active Auctions", href: "/seller/auctions", icon: Gavel },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Offers", href: "/seller/offers", icon: Tag },
      { label: "Sales History", href: "/seller/sales", icon: ShoppingBag },
      { label: "Escrow & Payouts", href: "/seller/escrow", icon: Landmark },
      { label: "Wallet", href: "/seller/wallet", icon: Wallet },
    ],
  },
  {
    title: "Resources",
    items: [{ label: "Documents", href: "/seller/documents", icon: FileText }],
  },
  {
    title: "Communication",
    items: [{ label: "Messages", href: "/messages", icon: MessageSquare }],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/seller/profile", icon: User },
      { label: "Settings", href: "/seller/settings", icon: Settings },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "FAQ", href: "/seller/faq", icon: HelpCircle },
      { label: "Contact Support", href: "/seller/support", icon: LifeBuoy },
    ],
  },
];
