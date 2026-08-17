import type { RevenueStats } from "@/types/report";

function monthsAgo(count: number): string {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - count);
  return date.toISOString();
}

export const mockRevenueStats: RevenueStats = {
  total_revenue: "1284500",
  auction_revenue: "812300",
  direct_sales_revenue: "472200",
  sales_count: 37,
  monthly: [
    { month: monthsAgo(5), amount: "142000", auction_amount: "92000", direct_amount: "50000", sales_count: 4 },
    { month: monthsAgo(4), amount: "168500", auction_amount: "108500", direct_amount: "60000", sales_count: 5 },
    { month: monthsAgo(3), amount: "205000", auction_amount: "135000", direct_amount: "70000", sales_count: 6 },
    { month: monthsAgo(2), amount: "231800", auction_amount: "151800", direct_amount: "80000", sales_count: 7 },
    { month: monthsAgo(1), amount: "268200", auction_amount: "168200", direct_amount: "100000", sales_count: 8 },
    { month: monthsAgo(0), amount: "269000", auction_amount: "156800", direct_amount: "112200", sales_count: 7 },
  ],
};