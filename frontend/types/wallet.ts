export type WalletEntryKind = "deposit" | "withdrawal" | "bid_hold" | "refund" | "purchase";

export interface WalletSummary {
  balance: string;
  held: string;
  available: string;
}

export interface WalletEntry {
  id: string;
  kind: WalletEntryKind;
  // Signed as the user reads it: money in positive, money out negative.
  // bid_hold and refund are encumbrances, not balance movements — they
  // don't sum to the balance, they just explain what happened and when.
  amount: string;
  auction_id: string | null;
  related_to: string | null;
  created_at: string;
}

export interface TopUpRequest {
  amount: string;
}

export interface WithdrawRequest {
  amount: string;
}