"use client";

import { AlertCircle, CheckCircle2, Coins, CreditCard, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { purchaseProperty } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { PaymentMethod, Property } from "@/types/property";

const TOKEN_PERCENTAGE = 0.05;

interface PaymentModalProps {
  property: Property;
  onClose: () => void;
  /** Called with the updated (now-sold) property once the real purchase succeeds. */
  onConfirm: (updatedProperty: Property) => void;
}

export function PaymentModal({ property, onClose, onConfirm }: PaymentModalProps) {
  const { accessToken } = useAuth();
  const [method, setMethod] = useState<PaymentMethod>("token");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [result, setResult] = useState<Property | null>(null);

  const price = Number(property.reserve_price);
  const tokenAmount = Math.round(price * TOKEN_PERCENTAGE);
  const amount = method === "token" ? tokenAmount : price;

  async function handleConfirm() {
    if (!accessToken) {
      setError({ code: "unauthenticated", message: "You must be signed in to purchase." });
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      const updated = await purchaseProperty(accessToken, property.id, { method });
      setResult(updated);
      onConfirm(updated);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? { code: err.code, message: err.message }
          : { code: "unknown_error", message: "Something went wrong. Please try again." },
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40" onClick={result ? undefined : onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {!result ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Complete Purchase</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-600">
                <X size={20} />
              </button>
            </div>

            <p className="mt-1 text-sm text-neutral-500">{property.title}</p>
            <p className="text-xs text-neutral-400">{property.address}</p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setMethod("token")}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  method === "token" ? "border-brand-500 bg-brand-50" : "border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <Coins size={18} className={method === "token" ? "text-brand-600" : "text-neutral-400"} />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Token Payment</p>
                  <p className="text-xs text-neutral-500">
                    Reserve with a {Math.round(TOKEN_PERCENTAGE * 100)}% deposit — ${tokenAmount.toLocaleString()}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("full")}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  method === "full" ? "border-brand-500 bg-brand-50" : "border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <CreditCard size={18} className={method === "full" ? "text-brand-600" : "text-neutral-400"} />
                <div>
                  <p className="text-sm font-medium text-neutral-900">Full Payment</p>
                  <p className="text-xs text-neutral-500">Pay the full price now — ${price.toLocaleString()}</p>
                </div>
              </button>
            </div>

            {error ? (
              error.code === "kyc_required" ? (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700">
                  <AlertCircle size={15} />
                  Verify your identity before buying.{" "}
                  <Link href="/kyc" className="font-medium underline underline-offset-2">
                    Complete KYC
                  </Link>
                </p>
              ) : (
                <p className="mt-3 rounded-lg bg-danger-500/10 px-3 py-2.5 text-sm text-danger-600">
                  {error.message}
                </p>
              )
            ) : null}

            <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
              <div>
                <p className="text-xs text-neutral-500">Total due</p>
                <p className="text-lg font-semibold text-neutral-900">${amount.toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {isProcessing ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-500/10 text-success-500">
              <CheckCircle2 size={26} />
            </span>
            <h2 className="text-lg font-semibold text-neutral-900">Payment Confirmed</h2>
            <p className="text-sm text-neutral-500">
              {result.payment_method === "token" ? "Reservation deposit" : "Full payment"} of{" "}
              <span className="font-medium text-neutral-900">
                ${Number(result.paid_amount).toLocaleString()}
              </span>{" "}
              received for {property.title}.
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