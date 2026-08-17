"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { getSellerPerformance } from "@/lib/api/reports";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { SellerPerformance } from "@/types/report";

export default function SellerPerformancePage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<SellerPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getSellerPerformance(accessToken)
      .then(setData)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <AdminShell>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Seller Performance</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Listings, sales, and revenue per seller.</p>
        </div>
        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-neutral-500">No seller data yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Seller</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Listings</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Sold</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Avg Sale</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.map((s) => (
                  <tr key={s.seller_id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{s.seller_name}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{s.total_listings}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{s.sold_count}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">${Number(s.avg_sale_price).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">${Number(s.total_revenue).toLocaleString()}</td>
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
