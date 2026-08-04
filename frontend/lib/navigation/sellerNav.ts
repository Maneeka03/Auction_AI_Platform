import {
  Clock,
  FileText,
  FolderPlus,
  Gavel,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Tag,
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
      { label: "Propose Category", href: "/seller/categories", icon: FolderPlus },
      { label: "Pending Verification", href: "/seller/pending", icon: Clock },
      { label: "Active Auctions", href: "/seller/auctions", icon: Gavel },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Offers", href: "/seller/offers", icon: Tag },
      { label: "Sales History", href: "/seller/sales", icon: ShoppingBag },
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
    items: [{ label: "Settings", href: "/seller/settings", icon: Settings }],
  },
];
