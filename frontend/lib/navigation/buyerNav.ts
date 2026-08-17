// import {
//   Bookmark,
//   Gavel,
//   HelpCircle,
//   LayoutDashboard,
//   LifeBuoy,
//   MessageSquare,
//   Search,
//   Settings,
//   Sparkles,
//   Star,
//   User,
//   Wallet,
// } from "lucide-react";
// import type { NavSection } from "@/types/navigation";

// export const buyerNav: NavSection[] = [
//   {
//     title: "Overview",
//     items: [{ label: "Dashboard", href: "/home", icon: LayoutDashboard }],
//   },
//   {
//     title: "Discover",
//     items: [
//       { label: "Browse Auctions", href: "/browse-auctions", icon: Gavel },
//       { label: "Recommended Assets", href: "/recommendations", icon: Sparkles },
//     ],
//   },
//   {
//     title: "My Activity",
//     items: [
//       { label: "Watchlist", href: "/watchlist", icon: Star },
//       { label: "Previous Bids", href: "/bids", icon: Bookmark },
//       { label: "Saved Searches", href: "/saved-searches", icon: Search },
//     ],
//   },
//   {
//     title: "Finance",
//     items: [{ label: "Wallet", href: "/wallet", icon: Wallet }],
//   },
//   {
//     title: "Communication",
//     items: [{ label: "Messages", href: "/messages", icon: MessageSquare }],
//   },
//   {
//     title: "Account",
//     items: [
//       { label: "Profile", href: "/profile", icon: User },
//       { label: "Settings", href: "/settings", icon: Settings },
//     ],
//   },
//   {
//     title: "Support",
//     items: [
//       { label: "FAQ", href: "/support/faq", icon: HelpCircle },
//       { label: "Contact Support", href: "/support", icon: LifeBuoy },
//     ],
//   },
// ];

import {
  Bookmark,
  Crown,
  Gavel,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  User,
  Wallet,
} from "lucide-react";
import type { NavSection } from "@/types/navigation";

export const buyerNav: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/home",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "Discover",
    items: [
      {
        label: "Browse Auctions",
        href: "/browse-auctions",
        icon: Gavel,
      },
      {
        label: "Recommended Assets",
        href: "/recommendations",
        icon: Sparkles,
      },
    ],
  },

  {
    title: "My Activity",
    items: [
      {
        label: "Watchlist",
        href: "/watchlist",
        icon: Star,
      },
      {
        label: "Previous Bids",
        href: "/bids",
        icon: Bookmark,
      },
      {
        label: "Saved Searches",
        href: "/saved-searches",
        icon: Search,
      },
    ],
  },

  {
    title: "Finance",
    items: [
      {
        label: "Purchases",
        href: "/purchases",
        icon: ShoppingBag,
      },
      {
        label: "Wallet",
        href: "/wallet",
        icon: Wallet,
      },
    ],
  },

  {
    title: "Membership",
    items: [
      {
        label: "VIP Membership",
        href: "/vip",
        icon: Crown,
      },
    ],
  },

  {
    title: "Communication",
    items: [
      {
        label: "Messages",
        href: "/messages",
        icon: MessageSquare,
      },
    ],
  },

  {
    title: "Account",
    items: [
      {
        label: "Profile",
        href: "/profile",
        icon: User,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },

  {
    title: "Support",
    items: [
      {
        label: "FAQ",
        href: "/support/faq",
        icon: HelpCircle,
      },
      {
        label: "Contact Support",
        href: "/support",
        icon: LifeBuoy,
      },
    ],
  },
];