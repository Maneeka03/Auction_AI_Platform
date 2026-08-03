import {
  Bookmark,
  Gavel,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import type { NavSection } from "@/types/navigation";

export const buyerNav: NavSection[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/home", icon: LayoutDashboard }],
  },
  {
    title: "Discover",
    items: [
      { label: "Browse Auctions", href: "/browse-auctions", icon: Gavel },
      { label: "Recommended Assets", href: "/recommendations", icon: Sparkles },
    ],
  },
  {
    title: "My Activity",
    items: [
      { label: "Watchlist", href: "/watchlist", icon: Star },
      { label: "Previous Bids", href: "/bids", icon: Bookmark },
      { label: "Saved Searches", href: "/saved-searches", icon: Search },
    ],
  },
  {
    title: "Finance",
    items: [{ label: "Wallet", href: "/wallet", icon: Wallet }],
  },
  {
    title: "Communication",
    items: [{ label: "Messages", href: "/messages", icon: MessageSquare }],
  },
  {
    title: "Account",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];
