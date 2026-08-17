export type AuctionRequestStatus = "pending" | "approved" | "rejected";

export interface AuctionRequest {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  property_id: string | null;
  title: string;
  description: string | null;
  requested_at: string;
  opening_bid: string | null;
  reserve_price: string | null;
  ends_at: string | null;
  increments: string[] | null;
  auction_id: string | null;
  status: AuctionRequestStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CreateAuctionRequestPayload {
  title: string;
  description?: string;
  requested_at: string;
  property_id?: string;
  opening_bid?: string;
  reserve_price?: string;
  ends_at?: string;
  increments?: string[];
}

export interface ReviewAuctionRequestPayload {
  status: "approved" | "rejected";
  admin_note?: string;
}
