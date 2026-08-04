import type { AiInsights } from "@/types/report";

export const mockAiInsights: AiInsights = {
  total_revenue: "1284500",
  avg_auction_value: "184928",
  top_category: "Fine Jewellery",
  buyer_count: 142,
  seller_count: 38,
  active_auctions: 7,
  summary:
    "Auction activity has been concentrated in fine jewellery and antique watches this quarter, " +
    "with reserve prices trending upward. Buyer interest is highest on listings under $200,000, " +
    "and repeat bidders account for a growing share of total volume.",
};