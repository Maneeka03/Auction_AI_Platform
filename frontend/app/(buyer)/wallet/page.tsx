"use client";

import { Minus, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { BuyerTopbar } from "@/components/layout/BuyerTopbar";
import { AddFundsModal } from "@/components/wallet/AddFundsModal";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";
import { TransactionIcon } from "@/components/wallet/TransactionIcon";
import { WalletBalanceCard } from "@/components/wallet/WalletBalanceCard";
import { getWallet, listWalletTransactions } from "@/lib/api/wallet";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { WalletEntry, WalletEntryKind, WalletSummary } from "@/types/wallet";

const typeLabels: Record<WalletEntryKind, string> = {
  deposit: "Deposit",
  bid_hold: "Bid Hold",
  refund: "Refund",
  purchase: "Purchase",
  withdrawal: "Withdrawal",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function WalletPage() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const [walletSummary, entries] = await Promise.all([
        getWallet(accessToken),
        listWalletTransactions(accessToken),
      ]);
      setSummary(walletSummary);
      setTransactions(entries);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load wallet.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchWallet();
  }, [fetchWallet]);

  function handleFundsAdded(updated: WalletSummary) {
    setSummary(updated);
    void fetchWallet();
  }

  function handleWithdrawn(updated: WalletSummary) {
    setSummary(updated);
    void fetchWallet();
  }

  return (
    <RequirePermission module="payment_escrow" need="view">
      <div className="min-h-screen bg-neutral-50">
        <BuyerTopbar />

        <div className="mx-auto max-w-4xl space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Wallet</h1>
              <p className="mt-1 text-sm text-neutral-600">Manage funds used for bidding and purchases.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void fetchWallet()}
                aria-label="Refresh"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowWithdraw(true)}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <Minus size={16} /> Withdraw
              </button>
              <button
                type="button"
                onClick={() => setShowAddFunds(true)}
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                <Plus size={16} /> Add Funds
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-danger-600">{error}</p> : null}

          {isLoading || !summary ? (
            <p className="text-sm text-neutral-500">Loading wallet...</p>
          ) : (
            <>
              <WalletBalanceCard summary={summary} />

              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <h2 className="text-base font-semibold text-neutral-900">Transaction History</h2>
                {transactions.length === 0 ? (
                  <p className="py-6 text-center text-sm text-neutral-400">No activity yet.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-neutral-100">
                    {transactions.map((entry) => {
                      const amountValue = Number(entry.amount);
                      return (
                        <li key={entry.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                          <TransactionIcon type={entry.kind} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-900">{typeLabels[entry.kind]}</p>
                            {entry.related_to ? (
                              <p className="truncate text-xs text-neutral-500">{entry.related_to}</p>
                            ) : null}
                          </div>
                          <div className="shrink-0 text-right">
                            <p
                              className={`text-sm font-semibold ${
                                amountValue >= 0 ? "text-success-500" : "text-neutral-900"
                              }`}
                            >
                              {amountValue >= 0 ? "+" : ""}
                              ${amountValue.toLocaleString()}
                            </p>
                            <p className="text-xs text-neutral-400">{formatDate(entry.created_at)}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showAddFunds ? (
        <AddFundsModal onClose={() => setShowAddFunds(false)} onSuccess={handleFundsAdded} />
      ) : null}
      {showWithdraw && summary ? (
        <WithdrawModal
          availableBalance={summary.available}
          onClose={() => setShowWithdraw(false)}
          onSuccess={handleWithdrawn}
        />
      ) : null}
    </RequirePermission>
  );
}