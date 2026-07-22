export type WalletEntryKind = "deposit" | "withdrawal" | "bid_hold" | "refund" | "purchase";
export interface WalletSummary {
  balance: string;
  held: string;
  available: string;
}
export interface WalletEntry {
  id: string;
  kind: WalletEntryKind;
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