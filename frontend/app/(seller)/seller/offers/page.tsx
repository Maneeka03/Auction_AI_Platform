"use client";

import { Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyListings } from "@/lib/api/seller";
import { useAuth } from "@/lib/auth/session-context";
import type { Property } from "@/types/property";

export default function OffersPage() {
  const { accessToken } = useAuth();
  const [soldListings, setSoldListings] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getMyListings(accessToken)
      .then((all) => setSoldListings(all.filter((p) => p.status === "sold")))
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Offers</h1>
        <p className="mt-1 text-sm text-neutral-600">Buy-now offers and accepted bids on your listings.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : soldListings.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
          <Tag size={32} className="mx-auto mb-3 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-600">No offers yet</p>
          <p className="mt-1 text-xs text-neutral-400">
            Accepted buy-now offers will appear here once a buyer completes a purchase.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Property</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Amount Paid</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {soldListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{listing.title}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-600">
                    {listing.paid_amount ? `$${Number(listing.paid_amount).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {listing.purchased_at
                      ? new Date(listing.purchased_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      {listing.payment_method === "token" ? "Deposit" : "Full Payment"}
                    </span>
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
