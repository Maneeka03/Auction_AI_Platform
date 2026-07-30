export interface BuyerDashboard {
  active_bids: number;
  watchlist: number;
  won_auctions: number;
  purchases: number;
}

export interface SellerDashboard {
  total_listings: number;
  active_auctions: number;
  total_earnings: string;
  pending_payouts: string;
}

export type EscrowState = "awaiting_payment" | "held" | "released";

export interface Purchase {
  escrow_id: string;
  property_id: string;
  property_title: string;
  property_image_url: string | null;
  amount: string;
  state: EscrowState;
  delivered_at: string | null;
  purchased_at: string;
}

export interface SellerEscrow {
  escrow_id: string;
  property_id: string;
  property_title: string;
  buyer_id: string | null;
  amount: string;
  state: EscrowState;
  delivered_at: string | null;
  created_at: string;
  release_eta: string;
}

export interface AuctionAnalysis {
  auction_id: string;
  title: string;
  reserve_price: string;
  winning_bid: string | null;
  reserve_met: boolean;
  total_bids: number;
  bidder_count: number;
  participants: Array<{ user_id: string; full_name: string; bid_count: number }>;
}

export interface DocumentVerification {
  kyc_pending: number;
  kyc_approved: number;
  kyc_rejected: number;
  escrow_open: number;
  escrow_released: number;
}
