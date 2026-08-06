"use client";

import { useEffect, useState } from "react";
import { getMyEscrow } from "@/lib/api/seller";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { SellerEscrow } from "@/types/portal";

const STATE_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting Payment",
  held: "In Escrow",
  released: "Released",
};

const STATE_COLORS: Record<string, string> = {
  awaiting_payment: "bg-amber-50 text-amber-700",
  held: "bg-brand-50 text-brand-700",
  released: "bg-green-50 text-green-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  return days > 0 ? `${days}d left` : "Due";
}

export default function SellerEscrowPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<SellerEscrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getMyEscrow(accessToken)
      .then(setItems)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load escrow."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Escrow & Payouts</h1>
          <p className="mt-1 text-sm text-neutral-500">Funds are held for 60 days after sale to complete AML compliance.</p>
        </div>
        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-500">No escrow records yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Property</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">State</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Sale Date</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Release ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((e) => (
                  <tr key={e.escrow_id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{e.property_title}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">
                      ${Number(e.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATE_COLORS[e.state] ?? "bg-neutral-100 text-neutral-600"}`}>
                        {STATE_LABELS[e.state] ?? e.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(e.created_at)}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {e.state === "released" ? (
                        <span className="text-green-600">Paid out</span>
                      ) : (
                        <span>{formatDate(e.release_eta)} <span className="text-xs text-neutral-400">({daysUntil(e.release_eta)})</span></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
