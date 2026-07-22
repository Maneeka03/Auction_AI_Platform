export type EscrowState = "funds_locked" | "asset_held" | "authenticated" | "released";

export interface Escrow {
  id: string;
  property_id: string;
  property_title: string;
  buyer_id: string | null;
  seller_id: string | null;
  auction_id: string | null;
  amount: string;
  state: EscrowState;
  created_at: string;
  updated_at: string;
}

export interface EscrowPage {
  items: Escrow[];
  total: number;
  page: number;
  size: number;
}

export interface ListEscrowsParams {
  page?: number;
  size?: number;
  state?: EscrowState;
}