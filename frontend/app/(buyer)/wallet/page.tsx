"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { AddFundsModal } from "@/components/wallet/AddFundsModal";
import { BuyerTopbar } from "../../../components/layout/BuyerTopbar";
import { TransactionIcon } from "@/components/wallet/TransactionIcon";
import { WalletBalanceCard } from "@/components/wallet/WalletBalanceCard";
import { walletSummary as initialSummary, walletTransactions as initialTransactions } from "@/lib/mock/wallet";
import type { WalletSummary, WalletTransaction } from "@/types/wallet";

const typeLabels: Record<WalletTransaction["type"], string> = {
  deposit: "Deposit",
  bid_hold: "Bid Hold",
  refund: "Refund",
  purchase: "Purchase",
  withdrawal: "Withdrawal",
};

export default function WalletPage() {
  const [summary, setSummary] = useState<WalletSummary>(initialSummary);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(initialTransactions);
  const [showAddFunds, setShowAddFunds] = useState(false);

  function handleFundsAdded(amount: number) {
    setSummary((prev) => ({ ...prev, balance: prev.balance + amount }));
    setTransactions((prev) => [
      {
        id: `txn-${Date.now()}`,
        type: "deposit",
        amount,
        description: "Funds added",
        date: new Date().toLocaleString(),
        status: "completed",
      },
      ...prev,
    ]);
  }

  return (
    <RequirePermission module="payment_escrow" need="view">
      <div className="min-h-screen bg-neutral-50">
        <BuyerTopbar />
        <div className="mx-auto max-w-4xl space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Wallet</h1>
              <p className="mt-1 text-sm text-neutral-600">Manage funds used for bidding and purchases.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddFunds(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              <Plus size={16} /> Add Funds
            </button>
          </div>

          <WalletBalanceCard summary={summary} />

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="text-base font-semibold text-neutral-900">Transaction History</h2>
            <ul className="mt-3 divide-y divide-neutral-100">
              {transactions.map((txn) => (
                <li key={txn.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <TransactionIcon type={txn.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {typeLabels[txn.type]}
                      {txn.status === "pending" ? (
                        <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                          Pending
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {txn.description}
                      {txn.relatedTo ? ` — ${txn.relatedTo}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-semibold ${txn.amount >= 0 ? "text-success-500" : "text-neutral-900"}`}>
                      {txn.amount >= 0 ? "+" : ""}
                      ${txn.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-400">{txn.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {showAddFunds ? (
        <AddFundsModal onClose={() => setShowAddFunds(false)} onConfirm={handleFundsAdded} />
      ) : null}
    </RequirePermission>
  );
}