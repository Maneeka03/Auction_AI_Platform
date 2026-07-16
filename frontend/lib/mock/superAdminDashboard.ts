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
  { name: "Residential", percent: 52, color: "var(--color-brand-500)" },
  { name: "Commercial", percent: 31, color: "var(--color-amber-500)" },
  { name: "Land/Plots", percent: 11, color: "var(--color-success-500)" },
  { name: "Multi-Family", percent: 6, color: "var(--color-neutral-300)" },
];

export const recentSales: ListItem[] = [
  { id: "sale-1", title: "142 Maple Grove Ave, Austin TX", subtitle: "14 Sep 2025", meta: "+$425,000" },
  { id: "sale-2", title: "38 Harborview Blvd, Miami FL", subtitle: "20 Mar 2025", meta: "+$1,250,000" },
  { id: "sale-3", title: "Unit 12B, Skyline Towers, Chicago IL", subtitle: "26 Mar 2025", meta: "+$680,000" },
  { id: "sale-4", title: "Riverside Commercial Plaza, Denver CO", subtitle: "10 Feb 2025", meta: "+$2,150,000" },
  { id: "sale-5", title: "9 Oakwood Lane, Portland OR", subtitle: "10 Jan 2025", meta: "+$510,000" },
];

export const recentlyRegistered: ListItem[] = [
  { id: "reg-1", title: "Bright Bridge Realty", subtitle: "Seller", meta: "bbg@example.com" },
  { id: "reg-2", title: "Coastal Star Properties", subtitle: "Seller", meta: "csc@example.com" },
  { id: "reg-3", title: "Harbor View Investments", subtitle: "Buyer", meta: "hv@example.com" },
  { id: "reg-4", title: "Golden Gate Holdings", subtitle: "Buyer", meta: "ggl@example.com" },
  { id: "reg-5", title: "Redwood Property Group", subtitle: "Seller", meta: "rw@example.com" },
];

export const auctionsEndingSoon: ListItem[] = [
  { id: "end-1", title: "142 Maple Grove Ave, Austin TX", subtitle: "Ends in 2h 15m", meta: "12 bids", actionLabel: "Notify Bidders", actionHref: "/auctions" },
  { id: "end-2", title: "27 Cedar Point Rd, Nashville TN", subtitle: "Ends in 4h 40m", meta: "7 bids", actionLabel: "Notify Bidders", actionHref: "/auctions" },
  { id: "end-3", title: "Suite 400, Meridian Office Park, Dallas TX", subtitle: "Ends in 6h 05m", meta: "3 bids", actionLabel: "Notify Bidders", actionHref: "/auctions" },
  { id: "end-4", title: "8 Lakeview Terrace, Charlotte NC", subtitle: "Ends in 9h 30m", meta: "15 bids", actionLabel: "Notify Bidders", actionHref: "/auctions" },
  { id: "end-5", title: "215 Birchwood Commercial Center, Phoenix AZ", subtitle: "Ends in 11h 50m", meta: "5 bids", actionLabel: "Notify Bidders", actionHref: "/auctions" },
];