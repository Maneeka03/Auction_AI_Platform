"use client";

import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getMyListings } from "@/lib/api/seller";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Property, PropertyStatus } from "@/types/property";

const STATUS_TABS: { key: PropertyStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "published", label: "Live" },
  { key: "sold", label: "Sold" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  published: "bg-green-50 text-green-700",
  sold: "bg-brand-50 text-brand-700",
  rejected: "bg-red-50 text-red-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function SellerListingsPage() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<PropertyStatus | "all">("all");
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMyListings(accessToken, tab === "all" ? undefined : tab);
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, tab]);

  useEffect(() => { void fetchListings(); }, [fetchListings]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">My Listings</h1>
          <a
            href="/seller/listings/new"
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus size={15} /> Submit Listing
          </a>
        </div>

        <div className="flex gap-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-brand-500 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-500">No listings found.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-600">Reserve</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{p.title}</td>
                    <td className="px-4 py-3 text-neutral-600">{p.category_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">
                      ${Number(p.reserve_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[p.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      {p.status === "draft" && (
                        <Link
                          href={`/seller/listings/${p.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                        >
                          <Pencil size={12} /> Edit
                        </Link>
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
