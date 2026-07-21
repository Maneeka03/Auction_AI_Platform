"use client";

import { CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { withdrawFromWallet } from "@/lib/api/wallet";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { WalletSummary } from "@/types/wallet";

interface WithdrawModalProps {
  availableBalance: string;
  onClose: () => void;
  onSuccess: (summary: WalletSummary) => void;
}

export function WithdrawModal({ availableBalance, onClose, onSuccess }: WithdrawModalProps) {
  const { accessToken } = useAuth();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNumber = Number(amount);

  async function handleConfirm() {
    setError(null);
    if (!amount || Number.isNaN(amountNumber) || amountNumber <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!accessToken) {
      setError("You must be signed in.");
      return;
    }

    setIsProcessing(true);
    try {
      const summary = await withdrawFromWallet(accessToken, { amount: amountNumber.toFixed(2) });
      setSucceeded(true);
      onSuccess(summary);
    } catch (err) {
      // The real backend returns "You cannot withdraw more than your
      // available balance." for a 409 — surfaced here directly.
      setError(err instanceof ApiRequestError ? err.message : "Failed to withdraw funds.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40" onClick={succeeded ? undefined : onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        {!succeeded ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Withdraw Funds</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-600">
                <X size={20} />
              </button>
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              Available to withdraw: <span className="font-medium text-neutral-700">${Number(availableBalance).toLocaleString()}</span>
            </p>

            <label className="mb-1.5 mt-3 block text-sm font-medium text-neutral-800">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />

            {error ? <p className="mt-2 text-sm text-danger-600">{error}</p> : null}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="mt-5 w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isProcessing ? "Processing..." : "Withdraw"}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-500/10 text-success-500">
              <CheckCircle2 size={26} />
            </span>
            <h2 className="text-lg font-semibold text-neutral-900">Withdrawal Requested</h2>
            <p className="text-sm text-neutral-500">
              <span className="font-medium text-neutral-900">${amountNumber.toLocaleString()}</span> has been withdrawn
              from your wallet.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}