"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { getBestSellers } from "@/lib/api/reports";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { BestSeller } from "@/types/report";

export default function BestSellersPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<BestSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getBestSellers(accessToken, 20)
      .then(setData)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <AdminShell>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Best-Selling Antiques</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Top items ranked by bid volume and final sale price.</p>
        </div>
        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-neutral-500">No sales data yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">#</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Item</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Total Bids</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Final Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.map((item, i) => (
                  <tr key={item.property_id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{item.title}</td>
                    <td className="px-4 py-3 text-neutral-600">{item.category}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{item.total_bids}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">
                      {item.final_price ? `$${Number(item.final_price).toLocaleString()}` : "—"}
                    </td>
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
