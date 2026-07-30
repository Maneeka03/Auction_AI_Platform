"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { getBuyerActivity } from "@/lib/api/reports";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { BuyerActivity } from "@/types/report";

export default function BuyerActivityPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<BuyerActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getBuyerActivity(accessToken)
      .then(setData)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <AdminShell>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Buyer Activity</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Bids placed, auctions won, and total spend per buyer.</p>
        </div>
        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-neutral-500">No buyer activity yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Buyer</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Bids</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Won</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.map((b) => (
                  <tr key={b.buyer_id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{b.buyer_name}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{b.bids_placed}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{b.auctions_won}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">${Number(b.total_spent).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
