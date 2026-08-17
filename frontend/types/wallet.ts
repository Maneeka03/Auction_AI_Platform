// export type WalletEntryKind = "deposit" | "withdrawal" | "bid_hold" | "refund" | "purchase" | "payout";
export type WalletEntryKind =
  | "deposit"
  | "withdrawal"
  | "bid_hold"
  | "refund"
  | "purchase"
  | "payout"
  | "insurance_premium";
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

export interface BuyerWallet {
  id: string;
  full_name: string;
  email: string;
  balance: string;
  held: string;
  available: string;
}
export interface BuyerWalletPage {
  items: BuyerWallet[];
  total: number;
  page: number;
  size: number;
}