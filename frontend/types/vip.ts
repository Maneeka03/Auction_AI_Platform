export type VipTier = "NONE" | "TIER4" | "TIER3" | "TIER2" | "TIER1";

export interface VipTierInfo {
  tier: VipTier;
  label: string;
  benefit: string;
  requirement: string;
}

export interface VipProfile {
  user_id: string;
  tier: VipTier;
  tier_label: string;
  token_balance: number;
  item_view_count: number;
  listings_completed_count: number;
  free_listing_credits: number;
  return_refund_requests_used: number;
  tier1_active: boolean;
  tier1_last_purchase_at: string | null;
  updated_at: string;
}

export type VipTokenTransactionKind = string;

export interface VipTokenTransaction {
  id: string;
  kind: VipTokenTransactionKind;
  quantity: number;
  balance_after: number;
  property_id: string | null;
  note: string | null;
  created_at: string;
}

export interface VipTokenTransactionPage {
  items: VipTokenTransaction[];
  total: number;
  page: number;
  size: number;
}