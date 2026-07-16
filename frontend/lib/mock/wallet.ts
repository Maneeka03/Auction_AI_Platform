import type { WalletSummary, WalletTransaction } from "@/types/wallet";

export const walletSummary: WalletSummary = {
  balance: 18500,
  pendingHolds: 4200,
};

export const walletTransactions: WalletTransaction[] = [
  {
    id: "txn-1",
    type: "deposit",
    amount: 20000,
    description: "Funds added via bank transfer",
    date: "10 Jul 2026, 09:00 AM",
    status: "completed",
  },
  {
    id: "txn-2",
    type: "bid_hold",
    amount: -4200,
    description: "Held for active bid",
    relatedTo: "142 Maple Grove Ave, Austin TX",
    date: "16 Jul 2026, 10:15 AM",
    status: "pending",
  },
  {
    id: "txn-3",
    type: "bid_hold",
    amount: -1800,
    description: "Held for active bid",
    relatedTo: "Unit 12B, Skyline Towers, Chicago IL",
    date: "15 Jul 2026, 02:40 PM",
    status: "completed",
  },
  {
    id: "txn-4",
    type: "refund",
    amount: 1800,
    description: "Bid unsuccessful — deposit refunded",
    relatedTo: "Unit 12B, Skyline Towers, Chicago IL",
    date: "15 Jul 2026, 06:00 PM",
    status: "completed",
  },
  {
    id: "txn-5",
    type: "purchase",
    amount: -1500,
    description: "Token deposit — property reserved",
    relatedTo: "9 Oakwood Lane, Portland OR",
    date: "12 Jul 2026, 11:20 AM",
    status: "completed",
  },
];