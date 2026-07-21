export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: string;
  created_at: string;
}

export interface PlaceBidRequest {
  amount: string;
}

export interface Participant {
  user_id: string;
  full_name: string;
  email: string;
  top_bid: string;
  bid_count: number;
  last_bid_at: string;
}