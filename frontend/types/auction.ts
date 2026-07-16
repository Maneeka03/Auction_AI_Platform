export type AuctionStatus = "upcoming" | "live" | "ended";

export type RoomAccess = "open" | "invite_only";

export interface Auction {
  id: string;
  property_id: string;
  title: string;
  address: string;
  category: "residential" | "commercial";
  image_url: string | null;
  status: AuctionStatus;
  starts_at: string;
  ends_at: string;
  ended_at: string | null;
  opening_bid: string;
  reserve_price: string;
  current_bid: string | null;
  minimum_bid: string;
  increments: string[];
  room_access: RoomAccess;
  token_percent: string;
  bidder_count: number;
  winner_id: string | null;
}

export interface AuctionPage {
  items: Auction[];
  total: number;
  page: number;
  size: number;
}

export interface CreateAuctionRequest {
  property_id: string;
  starts_at: string;
  ends_at: string;
  opening_bid: string;
  reserve_price: string;
  increments: string[];
  room_access?: RoomAccess;
  token_percent?: string;
}

export interface UpdateAuctionRequest {
  ends_at?: string;
  reserve_price?: string;
  room_access?: RoomAccess;
  increments?: string[];
}

export interface ListAuctionsParams {
  page?: number;
  size?: number;
  status?: AuctionStatus;
}