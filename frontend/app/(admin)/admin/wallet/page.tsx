"use client";

import { Minus, Plus, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { AddFundsModal } from "@/components/wallet/AddFundsModal";
import { WithdrawModal } from "@/components/wallet/WithdrawModal";
import { TransactionIcon } from "@/components/wallet/TransactionIcon";
import { WalletBalanceCard } from "@/components/wallet/WalletBalanceCard";
import { getWallet, listBuyerWallets, listWalletTransactions } from "@/lib/api/wallet";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { BuyerWallet, WalletEntry, WalletEntryKind, WalletSummary } from "@/types/wallet";

// const typeLabels: Record<WalletEntryKind, string> = {
//   deposit: "Deposit",
//   bid_hold: "Bid Hold",
//   refund: "Refund",
//   purchase: "Purchase",
//   withdrawal: "Withdrawal",
// };
const typeLabels: Record<WalletEntryKind, string> = {
  deposit: "Deposit",
  bid_hold: "Bid Hold",
  refund: "Refund",
  purchase: "Purchase",
  withdrawal: "Withdrawal",
  payout: "Seller Payout",
  insurance_premium: "Insurance Premium",
};

const BUYER_PAGE_SIZE = 10;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminWalletPage() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const [buyerWallets, setBuyerWallets] = useState<BuyerWallet[]>([]);
  const [buyerSearch, setBuyerSearch] = useState("");
  const [buyerPage, setBuyerPage] = useState(1);
  const [buyerTotal, setBuyerTotal] = useState(0);
  const [isLoadingBuyers, setIsLoadingBuyers] = useState(true);

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

  const fetchBuyerWallets = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingBuyers(true);
    try {
      const page = await listBuyerWallets(accessToken, {
        page: buyerPage,
        size: BUYER_PAGE_SIZE,
        search: buyerSearch || undefined,
      });
      setBuyerWallets(page.items);
      setBuyerTotal(page.total);
    } catch {
    } finally {
      setIsLoadingBuyers(false);
    }
  }, [accessToken, buyerPage, buyerSearch]);

  useEffect(() => {
    void fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    void fetchBuyerWallets();
  }, [fetchBuyerWallets]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Wallet</h1>
            <p className="mt-1 text-sm text-neutral-600">Platform wallet balance and transactions.</p>
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
                <ul className="mt-3 max-h-96 divide-y divide-neutral-100 overflow-y-auto pr-1">
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
                          <p className={`text-sm font-semibold ${amountValue >= 0 ? "text-success-500" : "text-neutral-900"}`}>
                            {amountValue >= 0 ? "+" : ""}${amountValue.toLocaleString()}
                          </p>
                          <p className="text-xs text-neutral-400">{formatDate(entry.created_at)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-neutral-900">Buyer Wallets</h2>
                <div className="relative w-full max-w-xs">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={buyerSearch}
                    onChange={(e) => {
                      setBuyerSearch(e.target.value);
                      setBuyerPage(1);
                    }}
                    placeholder="Search buyers..."
                    className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {isLoadingBuyers ? (
                <p className="py-6 text-center text-sm text-neutral-400">Loading buyers...</p>
              ) : buyerWallets.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">No buyers found.</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500">
                        <th className="w-2/5 pb-2 pr-4 font-medium">Buyer</th>
                        <th className="w-1/5 pb-2 pr-4 font-medium">Available to Spend</th>
                        <th className="w-1/5 pb-2 pr-4 font-medium">Held for Active Bids</th>
                        <th className="w-1/5 pb-2 font-medium">Wallet Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyerWallets.map((buyer) => (
                        <tr key={buyer.id} className="border-b border-neutral-50 last:border-0">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-neutral-900">{buyer.full_name}</p>
                            <p className="text-xs text-neutral-500">{buyer.email}</p>
                          </td>
                          <td className="py-3 pr-4 font-medium text-neutral-900">
                            ${Number(buyer.available).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4 font-medium text-amber-600">
                            ${Number(buyer.held).toLocaleString()}
                          </td>
                          <td className="py-3 font-medium text-neutral-900">
                            ${Number(buyer.balance).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {buyerTotal > BUYER_PAGE_SIZE && (
                    <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
                      <span>
                        Page {buyerPage} of {Math.ceil(buyerTotal / BUYER_PAGE_SIZE)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBuyerPage((p) => Math.max(1, p - 1))}
                          disabled={buyerPage === 1}
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setBuyerPage((p) => p + 1)}
                          disabled={buyerPage * BUYER_PAGE_SIZE >= buyerTotal}
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showAddFunds ? (
        <AddFundsModal onClose={() => setShowAddFunds(false)} onSuccess={(updated) => { setSummary(updated); void fetchWallet(); }} />
      ) : null}
      {showWithdraw && summary ? (
        <WithdrawModal
          availableBalance={summary.available}
          onClose={() => setShowWithdraw(false)}
          onSuccess={(updated) => { setSummary(updated); void fetchWallet(); }}
        />
      ) : null}
    </AdminShell>
  );
}