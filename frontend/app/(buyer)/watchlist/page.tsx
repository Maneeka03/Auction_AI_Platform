"use client";

import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { listWatchlist, removeFromWatchlist, updateWatchlistStatus } from "@/lib/api/watchlist";
import type { WatchlistItem, WatchlistStatus } from "@/types/watchlist";

const STATUS_LABELS: Record<string, string> = {
  watching: "Watching",
  cart: "In Cart",
  closed: "Closed",
  delivered: "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  watching: "bg-brand-50 text-brand-700",
  cart: "bg-amber-50 text-amber-700",
  closed: "bg-neutral-100 text-neutral-600",
  delivered: "bg-green-50 text-green-700",
};

export default function WatchlistPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listWatchlist(accessToken);
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load watchlist.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { void fetchItems(); }, [fetchItems]);

  async function handleStatusChange(propertyId: string, status: WatchlistStatus) {
    if (!accessToken) return;
    try {
      await updateWatchlistStatus(accessToken, propertyId, status);
      setItems((prev) => prev.map((i) => i.property.id === propertyId ? { ...i, status } : i));
    } catch { /* ignore */ }
  }

  async function handleRemove(propertyId: string) {
    if (!accessToken) return;
    try {
      await removeFromWatchlist(accessToken, propertyId);
      setItems((prev) => prev.filter((i) => i.property.id !== propertyId));
    } catch { /* ignore */ }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Watchlist</h1>
        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-500">Your watchlist is empty.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.property.id} className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4">
                {item.property.image_url ? (
                  <img src={item.property.image_url} alt={item.property.title} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-400">No img</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900">{item.property.title}</p>
                  <p className="text-sm text-neutral-500">{item.property.address}</p>
                  <p className="mt-0.5 text-sm font-semibold text-brand-600">
                    ${Number(item.property.reserve_price).toLocaleString()}
                  </p>
                </div>
                <SearchableSelect
                  value={item.status}
                  options={Object.entries(STATUS_LABELS).map(([val, label]) => ({ value: val, label }))}
                  onChange={(v) => void handleStatusChange(item.property.id, v as WatchlistStatus)}
                />
                <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline ${STATUS_COLORS[item.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRemove(item.property.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
