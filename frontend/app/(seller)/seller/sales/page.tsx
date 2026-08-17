"use client";

import { useEffect, useState } from "react";
import { getMySales } from "@/lib/api/seller";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Property } from "@/types/property";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function SellerSalesPage() {
  const { accessToken } = useAuth();
  const [sales, setSales] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getMySales(accessToken)
      .then(setSales)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load sales."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.paid_amount ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">Sales History</h1>
          {sales.length > 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-right">
              <p className="text-xs text-neutral-500">Total Revenue</p>
              <p className="text-lg font-semibold text-brand-600">${totalRevenue.toLocaleString()}</p>
            </div>
          ) : null}
        </div>
        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : sales.length === 0 ? (
          <p className="text-sm text-neutral-500">No completed sales yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Property</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Sale Price</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Payment</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Sold On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{s.title}</td>
                    <td className="px-4 py-3 text-neutral-600">{s.category_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">
                      {s.paid_amount ? `$${Number(s.paid_amount).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-600">{s.payment_method ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-500">{s.purchased_at ? formatDate(s.purchased_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
