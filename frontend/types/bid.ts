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

export interface MyBidAuction {
  id: string;
  title: string;
  address: string;
  category_name: string;
  image_url: string | null;
  status: string;
  starts_at: string;
  ends_at: string;
  current_bid: string | null;
  reserve_price: string;
  winner_id: string | null;
}

export interface MyBid {
  my_max_bid: string;
  won: boolean;
  auction: MyBidAuction;
}