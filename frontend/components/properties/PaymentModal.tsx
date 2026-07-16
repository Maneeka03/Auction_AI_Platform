"use client";

import { CheckCircle2, Coins, CreditCard, X } from "lucide-react";
import { useState } from "react";
import type { DemoPaymentResult, PaymentMethod, Property } from "@/types/property";

const TOKEN_PERCENTAGE = 0.05;

interface PaymentModalProps {
  property: Property;
  onClose: () => void;
  onConfirm: (result: DemoPaymentResult) => void;
}

export function PaymentModal({ property, onClose, onConfirm }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("token");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DemoPaymentResult | null>(null);

  const tokenAmount = Math.round(property.price * TOKEN_PERCENTAGE);
  const amount = method === "token" ? tokenAmount : property.price;

  function handleConfirm() {
    setIsProcessing(true);
    setTimeout(() => {
      const paymentResult: DemoPaymentResult = {
        method,
        amount,
        confirmedAt: new Date().toLocaleString(),
      };
      setResult(paymentResult);
      setIsProcessing(false);
      onConfirm(paymentResult);
    }, 900);
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

            <p className="mt-1 text-sm text-neutral-500">{property.address}</p>
            <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
              Demo mode — no real payment is processed. This simulates the checkout flow only.
            </p>

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
                  <p className="text-xs text-neutral-500">Pay the full price now — ${property.price.toLocaleString()}</p>
                </div>
              </button>
            </div>

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
              {result.method === "token" ? "Reservation deposit" : "Full payment"} of{" "}
              <span className="font-medium text-neutral-900">${result.amount.toLocaleString()}</span> received for{" "}
              {property.address}.
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