export type ReportPropertyCategory = "residential" | "commercial";

export interface CategoryCount {
  category: ReportPropertyCategory;
  count: number;
}

export interface WeeklyCount {
  week: string;
  count: number;
}

export interface DashboardStats {
  total_buyers: number;
  total_sellers: number;
  active_auctions: number;
  total_listings: number;
  published_listings: number;
  sold_listings: number;
  pending_approvals: number;
  total_revenue: string;
  category_mix: CategoryCount[];
  weekly_signups: WeeklyCount[];
}