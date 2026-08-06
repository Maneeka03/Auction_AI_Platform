"use client";

import { CheckCircle, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { confirmDelivery, getPurchases } from "@/lib/api/buyer";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Purchase } from "@/types/portal";

const STATE_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting Payment",
  held: "In Escrow",
  released: "Completed",
};

const STATE_COLORS: Record<string, string> = {
  awaiting_payment: "bg-amber-50 text-amber-700",
  held: "bg-brand-50 text-brand-700",
  released: "bg-green-50 text-green-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function PurchasesPage() {
  const { accessToken } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getPurchases(accessToken)
      .then(setPurchases)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load purchases."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function handleConfirmDelivery(escrowId: string) {
    if (!accessToken) return;
    setConfirming(escrowId);
    try {
      const updated = await confirmDelivery(accessToken, escrowId);
      setPurchases((prev) => prev.map((p) => p.escrow_id === escrowId ? updated : p));
    } catch { /* ignore */ } finally {
      setConfirming(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold text-neutral-900">My Purchases</h1>
        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : purchases.length === 0 ? (
          <p className="text-sm text-neutral-500">No purchases yet.</p>
        ) : (
          <div className="space-y-4">
            {purchases.map((p) => (
              <div key={p.escrow_id} className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4">
                {p.property_image_url ? (
                  <img src={p.property_image_url} alt={p.property_title} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <Package size={22} className="text-neutral-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900">{p.property_title}</p>
                  <p className="mt-0.5 text-sm text-neutral-500">Purchased {formatDate(p.purchased_at)}</p>
                  <p className="mt-0.5 text-sm font-semibold text-brand-600">${Number(p.amount).toLocaleString()}</p>
                  {p.delivered_at ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle size={12} /> Delivered {formatDate(p.delivered_at)}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATE_COLORS[p.state] ?? "bg-neutral-100 text-neutral-600"}`}>
                    {STATE_LABELS[p.state] ?? p.state}
                  </span>
                  {p.state === "held" && !p.delivered_at ? (
                    <button
                      type="button"
                      disabled={confirming === p.escrow_id}
                      onClick={() => void handleConfirmDelivery(p.escrow_id)}
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      {confirming === p.escrow_id ? "Confirming…" : "Confirm Delivery"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
