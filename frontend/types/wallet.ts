export type WalletTransactionType = "deposit" | "bid_hold" | "refund" | "purchase" | "withdrawal";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  description: string;
  relatedTo?: string;
  date: string;
  status: "completed" | "pending";
}

export interface WalletSummary {
  balance: number;
  pendingHolds: number;
}