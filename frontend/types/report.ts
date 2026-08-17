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

export interface MonthlyRevenueDetail {
  month: string;
  amount: string;
  auction_amount: string;
  direct_amount: string;
  sales_count: number;
}

export interface RevenueStats {
  total_revenue: string;
  auction_revenue: string;
  direct_sales_revenue: string;
  sales_count: number;
  monthly: MonthlyRevenueDetail[];
}

export interface AiInsights {
  total_revenue: string;
  avg_auction_value: string;
  top_category: string;
  buyer_count: number;
  seller_count: number;
  active_auctions: number;
  summary: string;
}

export interface BestSeller {
  property_id: string;
  title: string;
  category: string;
  total_bids: number;
  final_price: string | null;
}

export interface BuyerActivity {
  buyer_id: string;
  buyer_name: string;
  bids_placed: number;
  auctions_won: number;
  total_spent: string;
}

export interface ConversionRates {
  lead_to_buyer: number;
  browse_to_bid: number;
  bid_to_win: number;
}

export interface MarketingPerformance {
  total_campaigns: number;
  sent_campaigns: number;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
}

export interface SellerPerformance {
  seller_id: string;
  seller_name: string;
  total_listings: number;
  sold_count: number;
  avg_sale_price: string;
  total_revenue: string;
}