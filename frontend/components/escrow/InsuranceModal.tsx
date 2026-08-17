"use client";

/**
 * InsuranceModal
 *
 * Shown when the super admin clicks "Release Funds" on an AUTHENTICATED escrow.
 * The backend requires a purchased insurance policy before advancing to RELEASED
 * (returns HTTP 409 "insurance_required" otherwise).
 *
 * Flow: fetch quotes → admin selects one → confirm purchase → parent advances escrow
 */

import { useEffect, useState } from "react";
import { ShieldCheck, Loader2, X, CheckCircle2 } from "lucide-react";
import {
  listInsuranceQuotes,
  selectInsuranceQuote,
  purchaseInsurance,
} from "@/lib/api/insurance";
import type { InsuranceQuote, InsurancePolicy } from "@/types/insurance";
import { ApiRequestError } from "@/lib/api/client";

interface Props {
  escrowId: string;
  escrowAmount: string;
  propertyTitle: string;
  accessToken: string;
  /** Called after a successful purchase — parent should now call advanceEscrow */
  onPurchased: () => void;
  onClose: () => void;
}

function fmt(value: string) {
  return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

type Step = "select" | "confirm" | "done";

export function InsuranceModal({
  escrowId,
  escrowAmount,
  propertyTitle,
  accessToken,
  onPurchased,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>("select");
  const [quotes, setQuotes] = useState<InsuranceQuote[]>([]);
  const [selected, setSelected] = useState<InsuranceQuote | null>(null);
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingQuotes(true);
    listInsuranceQuotes(accessToken, escrowId)
      .then((qs) => {
        if (!cancelled) setQuotes(qs);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ApiRequestError ? err.message : "Failed to load insurance quotes.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingQuotes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, escrowId]);

  async function handleContinue() {
    if (!selected) return;
    setWorking(true);
    setError(null);
    try {
      await selectInsuranceQuote(accessToken, escrowId, selected.provider_name);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to select quote.");
    } finally {
      setWorking(false);
    }
  }

  async function handlePurchase() {
    setWorking(true);
    setError(null);
    try {
      const p = await purchaseInsurance(accessToken, escrowId);
      setPolicy(p);
      setStep("done");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to purchase policy.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-600" />
            <h2 className="text-base font-semibold text-neutral-900">Shipping Insurance</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* ── Step 1: select a quote ── */}
          {step === "select" && (
            <>
              <p className="text-sm text-neutral-600">
                Insurance is mandatory before releasing funds for{" "}
                <span className="font-medium text-neutral-900">"{propertyTitle}"</span>. Select a
                provider to cover the{" "}
                <span className="font-medium text-neutral-900">{fmt(escrowAmount)}</span> shipment.
              </p>

              {loadingQuotes ? (
                <div className="flex items-center justify-center gap-2 py-8 text-neutral-500">
                  <Loader2 size={20} className="animate-spin" />
                  Loading quotes…
                </div>
              ) : quotes.length === 0 ? (
                <p className="text-sm text-danger-600">No quotes available at this time.</p>
              ) : (
                <div className="space-y-2">
                  {quotes.map((q) => (
                    <button
                      key={q.provider_name}
                      type="button"
                      onClick={() => setSelected(q)}
                      className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                        selected?.provider_name === q.provider_name
                          ? "border-brand-500 bg-brand-50"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-900">
                          {q.provider_name}
                        </span>
                        <span className="text-sm font-semibold text-brand-600">
                          {fmt(q.premium)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        Covers {fmt(q.coverage_amount)}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {error && <p className="text-sm text-danger-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selected || working || loadingQuotes}
                  onClick={handleContinue}
                  className="flex-1 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {working ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" /> Selecting…
                    </span>
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: confirm purchase ── */}
          {step === "confirm" && selected && (
            <>
              <p className="text-sm text-neutral-600">
                Confirm insurance purchase. After this the escrow will advance to{" "}
                <span className="font-medium text-neutral-900">Released</span> and the seller will
                be paid.
              </p>

              <div className="space-y-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Provider</span>
                  <span className="font-medium text-neutral-900">{selected.provider_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Premium</span>
                  <span className="font-medium text-neutral-900">{fmt(selected.premium)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Coverage</span>
                  <span className="font-medium text-neutral-900">
                    {fmt(selected.coverage_amount)}
                  </span>
                </div>
              </div>

              {error && <p className="text-sm text-danger-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("select")}
                  disabled={working}
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={working}
                  onClick={handlePurchase}
                  className="flex-1 rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 disabled:opacity-50"
                >
                  {working ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 size={14} className="animate-spin" /> Purchasing…
                    </span>
                  ) : (
                    "Confirm Purchase"
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: done ── */}
          {step === "done" && policy && (
            <>
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 size={40} className="text-success-500" />
                <div>
                  <p className="font-semibold text-neutral-900">Insurance purchased</p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {policy.provider_name} policy is active. Click below to release funds to the
                    seller.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onPurchased}
                className="w-full rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600"
              >
                Release Funds Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
