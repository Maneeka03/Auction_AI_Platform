"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  listInsuranceQuotes,
  purchaseInsurance,
  selectInsuranceQuote,
} from "@/lib/api/insurance";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { InsurancePolicy, InsuranceQuote } from "@/types/insurance";

interface InsuranceCardProps {
  escrowId: string;
}

function formatAmount(value: string) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function InsuranceCard({ escrowId }: InsuranceCardProps) {
  const { accessToken } = useAuth();

  const [quotes, setQuotes] = useState<InsuranceQuote[]>([]);
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !escrowId) return;

    const token = accessToken;
    let cancelled = false;

    async function loadQuotes() {
      setLoading(true);
      setError(null);

      try {
        const result = await listInsuranceQuotes(token, escrowId);

        if (!cancelled) {
          setQuotes(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiRequestError
              ? err.message
              : "Unable to load insurance quotes.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadQuotes();

    return () => {
      cancelled = true;
    };
  }, [accessToken, escrowId]);

  async function handleSelect(providerName: string) {
    if (!accessToken) return;

    setProcessing(true);
    setError(null);

    try {
      const selected = await selectInsuranceQuote(
        accessToken,
        escrowId,
        providerName,
      );

      setPolicy(selected);
      setSelectedProvider(providerName);
      toast.success("Insurance quote selected");
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to select insurance quote.";

      setError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  }

  async function handlePurchase() {
    if (!accessToken) return;

    setProcessing(true);
    setError(null);

    try {
      const purchased = await purchaseInsurance(accessToken, escrowId);

      setPolicy(purchased);
      toast.success("Shipping insurance purchased successfully");
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Unable to purchase insurance.";

      setError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-sm text-neutral-500">Loading insurance options…</p>
      </div>
    );
  }

  if (error && quotes.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck size={18} className="mt-0.5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-700">
              Shipping insurance
            </p>
            <p className="mt-1 text-xs text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (policy?.status === "purchased") {
    return (
      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={20} className="mt-0.5 text-green-600" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-green-800">
              Shipping Insurance Purchased
            </p>

            <p className="mt-1 text-xs text-green-700">
              Provider:{" "}
              <span className="font-medium">{policy.provider_name}</span>
            </p>

            <p className="mt-1 text-xs text-green-700">
              Coverage: $
              {formatAmount(policy.coverage_amount)}
            </p>

            <p className="mt-1 text-xs text-green-700">
              Premium: $
              {formatAmount(policy.quoted_premium)}
            </p>

            {policy.purchased_at ? (
              <p className="mt-1 text-xs text-green-600">
                Purchased{" "}
                {new Date(policy.purchased_at).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck size={20} className="mt-0.5 text-brand-600" />

        <div>
          <p className="text-sm font-semibold text-neutral-900">
            Shipping Insurance
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Insurance is required before this escrow can be released.
            Compare the available coverage options below.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {quotes.map((quote) => {
          const selected =
            selectedProvider === quote.provider_name ||
            policy?.provider_name === quote.provider_name;

          return (
            <button
              key={quote.provider_name}
              type="button"
              disabled={processing}
              onClick={() => void handleSelect(quote.provider_name)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selected
                  ? "border-brand-500 bg-brand-50"
                  : "border-neutral-200 hover:bg-neutral-50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {quote.provider_name}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Coverage: ${formatAmount(quote.coverage_amount)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-900">
                    ${formatAmount(quote.premium)}
                  </p>

                  <p className="text-xs text-neutral-500">Premium</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {policy?.status === "quote_selected" ? (
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-neutral-100 pt-4">
          <div>
            <p className="text-xs text-neutral-500">Selected premium</p>
            <p className="text-base font-semibold text-neutral-900">
              ${formatAmount(policy.quoted_premium)}
            </p>
          </div>

          <button
            type="button"
            disabled={processing}
            onClick={() => void handlePurchase()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? "Processing…" : "Purchase Insurance"}
          </button>
        </div>
      ) : null}
    </div>
  );
}