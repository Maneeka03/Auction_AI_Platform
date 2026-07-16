import type {
  CategoryMixDatum,
  ListItem,
  MonthlyRevenuePoint,
  RibbonKpi,
  WeeklyPoint,
  WelcomeBannerData,
} from "@/types/dashboard";

export const welcomeBanner: WelcomeBannerData = {
  message: "8 auctions are ending in the next 24 hours and 3 listings are waiting on your approval.",
  primaryAction: { label: "Review Approvals", href: "/approvals" },
  secondaryAction: { label: "View All Auctions", href: "/auctions" },
};

export const ribbonKpis: RibbonKpi[] = [
  { label: "Total Buyers & Sellers", value: "5,468", changePercent: 5.62, changeLabel: "from last month", accent: "brand" },
  { label: "Active Auctions", value: "147", changePercent: -12, changeLabel: "from last month", accent: "success" },
  { label: "Total Listings", value: "892", changePercent: 6, changeLabel: "from last month", accent: "amber" },
  { label: "Total Revenue", value: "$400K", changePercent: 12, changeLabel: "from last month", accent: "sky" },
];

export const weeklySignups: WeeklyPoint[] = [
  { day: "M", value: 8 },
  { day: "T", value: 14 },
  { day: "W", value: 6 },
  { day: "T", value: 20 },
  { day: "F", value: 11 },
  { day: "S", value: 9 },
  { day: "S", value: 13 },
];

export const monthlyRevenue: MonthlyRevenuePoint[] = [
  { month: "Jan", value: 170 },
  { month: "Feb", value: 130 },
  { month: "Mar", value: 195 },
  { month: "Apr", value: 320 },
  { month: "May", value: 340 },
  { month: "Jun", value: 360 },
  { month: "Jul", value: 320 },
  { month: "Aug", value: 310 },
  { month: "Sep", value: 300 },
  { month: "Oct", value: 335 },
  { month: "Nov", value: 90 },
  { month: "Dec", value: 300 },
];

export const categoryMix: CategoryMixDatum[] = [
  { name: "Watches", percent: 38, color: "var(--color-brand-500)" },
  { name: "Fine Art", percent: 27, color: "var(--color-amber-500)" },
  { name: "Jewelry", percent: 22, color: "var(--color-success-500)" },
  { name: "Coins", percent: 13, color: "var(--color-neutral-300)" },
];

export const recentSales: ListItem[] = [
  { id: "sale-1", title: "Lot #142 — Vintage Chronograph", subtitle: "14 Sep 2025", meta: "+$2,450 ", imageSrc: "/images/auction_items/Vintage_Chronograph.jpg"},
  { id: "sale-2", title: "Lot #138 — Art Deco Necklace", subtitle: "20 Mar 2025", meta: "+$3,950" ,imageSrc: "/images/auction_items/Art_Deco_Necklace.jpg"},
  { id: "sale-3", title: "Lot #129 — Silver Coin Set", subtitle: "26 Mar 2025", meta: "+$1,450",imageSrc: "/images/auction_items/Silver_Coin_Set.jpg" },
  { id: "sale-4", title: "Lot #114 — Oil Painting, Coastal", subtitle: "10 Feb 2025", meta: "+$7,580",imageSrc: "/images/auction_items/Oil_Painting.jpg" },
  { id: "sale-5", title: "Lot #101 — Pocket Watch, 1920s", subtitle: "10 Jan 2025", meta: "+$9,770" , imageSrc: "/images/auction_items/Pocket_Watch.jpg" },
];

export const recentlyRegistered: ListItem[] = [
  { id: "reg-1", title: "Bright Bridge Collectibles", subtitle: "Seller", meta: "bbg@example.com",imageSrc: "/images/avatars/ann-mcclure.jpg" },
  { id: "reg-2", title: "Coastal Star Auctions", subtitle: "Seller", meta: "csc@example.com",imageSrc: "/images/avatars/john-doe.avif" },
  { id: "reg-3", title: "Harbor View Estates", subtitle: "Buyer", meta: "hv@example.com",imageSrc: "/images/avatars/sarah-anderson.avif" },
  { id: "reg-4", title: "Golden Gate Ltd", subtitle: "Buyer", meta: "ggl@example.com" ,imageSrc: "/images/avatars/thomas-william.avif"},
  { id: "reg-5", title: "Redwood Inc", subtitle: "Seller", meta: "rw@example.com",imageSrc: "/images/avatars/ann-mcclure.jpg" },
];

export const auctionsEndingSoon: ListItem[] = [
  { id: "end-1", title: "Lot #142 — Vintage Chronograph", subtitle: "Ends in 2h 15m", meta: "12 bids", actionLabel: "Notify Bidders", actionHref: "/auctions", imageSrc: "/images/auction_items/Vintage_Chronograph.jpg" },
  { id: "end-2", title: "Lot #150 — Art Deco Necklace", subtitle: "Ends in 4h 40m", meta: "7 bids", actionLabel: "Notify Bidders", actionHref: "/auctions" ,imageSrc: "/images/auction_items/Art_Deco_Necklace.jpg"},
  { id: "end-3", title: "Lot #133 — Silver Coin Set", subtitle: "Ends in 6h 05m", meta: "3 bids", actionLabel: "Notify Bidders", actionHref: "/auctions",imageSrc: "/images/auction_items/Silver_Coin_Set.jpg" },
  { id: "end-4", title: "Lot #127 — Oil Painting", subtitle: "Ends in 9h 30m", meta: "15 bids", actionLabel: "Notify Bidders", actionHref: "/auctions",imageSrc: "/images/auction_items/Oil_Painting.jpg" },
  { id: "end-5", title: "Lot #119 — Pocket Watch", subtitle: "Ends in 11h 50m", meta: "5 bids", actionLabel: "Notify Bidders", actionHref: "/auctions", imageSrc: "/images/auction_items/Pocket_Watch.jpg" },
];