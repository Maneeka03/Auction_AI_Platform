"use client";

import { useEffect, useState } from "react";
import { getMyBids } from "@/lib/api/bids";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { MyBid } from "@/types/bid";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function MyBidsPage() {
  const { accessToken } = useAuth();
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getMyBids(accessToken)
      .then(setBids)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load bids."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold text-neutral-900">My Bids</h1>
        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : bids.length === 0 ? (
          <p className="text-sm text-neutral-500">You haven't placed any bids yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Property</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">My Max Bid</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Current Bid</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Ends</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {bids.map((b) => (
                  <tr key={b.auction.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{b.auction.title}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">
                      ${Number(b.my_max_bid).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700">
                      {b.auction.current_bid ? `$${Number(b.auction.current_bid).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.won
                          ? "bg-green-50 text-green-700"
                          : b.auction.status === "live"
                            ? "bg-brand-50 text-brand-700"
                            : "bg-neutral-100 text-neutral-600"
                      }`}>
                        {b.won ? "Won" : b.auction.status === "live" ? "Active" : "Ended"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(b.auction.ends_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
