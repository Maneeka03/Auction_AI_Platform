// "use client";

// import { Trash2 } from "lucide-react";
// import { useCallback, useEffect, useState } from "react";
// import { SearchableSelect } from "@/components/ui/SearchableSelect";
// import { ApiRequestError } from "@/lib/api/client";
// import { useAuth } from "@/lib/auth/session-context";
// import { listWatchlist, removeFromWatchlist, updateWatchlistStatus } from "@/lib/api/watchlist";
// import type { WatchlistItem, WatchlistStatus } from "@/types/watchlist";

// const STATUS_LABELS: Record<string, string> = {
//   watching: "Watching",
//   cart: "In Cart",
//   closed: "Closed",
//   delivered: "Delivered",
// };

// const STATUS_COLORS: Record<string, string> = {
//   watching: "bg-brand-50 text-brand-700",
//   cart: "bg-amber-50 text-amber-700",
//   closed: "bg-neutral-100 text-neutral-600",
//   delivered: "bg-green-50 text-green-700",
// };

// export default function WatchlistPage() {
//   const { accessToken } = useAuth();
//   const [items, setItems] = useState<WatchlistItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const fetchItems = useCallback(async () => {
//     if (!accessToken) return;
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await listWatchlist(accessToken);
//       setItems(data);
//     } catch (err) {
//       setError(err instanceof ApiRequestError ? err.message : "Failed to load watchlist.");
//     } finally {
//       setLoading(false);
//     }
//   }, [accessToken]);

//   useEffect(() => { void fetchItems(); }, [fetchItems]);

//   async function handleStatusChange(propertyId: string, status: WatchlistStatus) {
//     if (!accessToken) return;
//     try {
//       await updateWatchlistStatus(accessToken, propertyId, status);
//       setItems((prev) => prev.map((i) => i.property.id === propertyId ? { ...i, status } : i));
//     } catch { /* ignore */ }
//   }

//   async function handleRemove(propertyId: string) {
//     if (!accessToken) return;
//     try {
//       await removeFromWatchlist(accessToken, propertyId);
//       setItems((prev) => prev.filter((i) => i.property.id !== propertyId));
//     } catch { /* ignore */ }
//   }

//   return (
//     <div className="mx-auto max-w-7xl space-y-6 p-6">
//         <h1 className="text-2xl font-semibold text-neutral-900">Watchlist</h1>
//         {error ? <p className="text-sm text-danger-600">{error}</p> : null}
//         {loading ? (
//           <p className="text-sm text-neutral-400">Loading…</p>
//         ) : items.length === 0 ? (
//           <p className="text-sm text-neutral-500">Your watchlist is empty.</p>
//         ) : (
//           <div className="space-y-3">
//             {items.map((item) => (
//               <div key={item.property.id} className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4">
//                 {item.property.image_url ? (
//                   <img src={item.property.image_url} alt={item.property.title} className="h-16 w-16 shrink-0 rounded-lg object-contain" />
//                 ) : (
//                   <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs text-neutral-400">No img</div>
//                 )}
//                 <div className="min-w-0 flex-1">
//                   <p className="truncate font-medium text-neutral-900">{item.property.title}</p>
//                   <p className="text-sm text-neutral-500">{item.property.address}</p>
//                   <p className="mt-0.5 text-sm font-semibold text-brand-600">
//                     ${Number(item.property.reserve_price).toLocaleString()}
//                   </p>
//                 </div>
//                 <SearchableSelect
//                   value={item.status}
//                   options={Object.entries(STATUS_LABELS).map(([val, label]) => ({ value: val, label }))}
//                   onChange={(v) => void handleStatusChange(item.property.id, v as WatchlistStatus)}
//                 />
//                 <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline ${STATUS_COLORS[item.status] ?? "bg-neutral-100 text-neutral-600"}`}>
//                   {STATUS_LABELS[item.status] ?? item.status}
//                 </span>
//                 <button
//                   type="button"
//                   onClick={() => void handleRemove(item.property.id)}
//                   className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500"
//                 >
//                   <Trash2 size={15} />
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//     </div>
//   );
// }

"use client";

import { Trash2, Package, Lock, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ApiRequestError } from "@/lib/api/client";
import toast from "react-hot-toast";
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
      toast.success("Watchlist status updated successfully");
    } catch (err) { toast.error(err instanceof ApiRequestError ? err.message : "Failed to update watchlist status."); }
  }

  async function handleRemove(propertyId: string) {
    if (!accessToken) return;
    try {
      await removeFromWatchlist(accessToken, propertyId);
      setItems((prev) => prev.filter((i) => i.property.id !== propertyId));
      toast.success("Removed from watchlist");
    } catch (err) { toast.error(err instanceof ApiRequestError ? err.message : "Failed to remove from watchlist."); }
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.property.id}
                href={`/properties/${item.property.id}`}
              // href={`/live-bidding-room/${item.property.id}`}
              className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
            >
              {/* Thumbnail */}
              <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
                {item.property.image_url ? (
                  <img
                    src={item.property.image_url}
                    alt={item.property.title}
                    className="h-full w-full object-contain object-center"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package size={32} className="text-neutral-300" />
                  </div>
                )}

                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                    STATUS_COLORS[item.status] ?? "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleRemove(item.property.id);
                  }}
                  title="Remove from watchlist"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-400 shadow-sm hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Body */}
              <div className="p-4">
                <h3 className="truncate text-base font-semibold text-neutral-900">
                  {item.property.title}
                </h3>
                <p className="truncate text-xs text-neutral-500">{item.property.address}</p>

                <p className="mt-2 text-sm font-semibold text-brand-600">
                  ${Number(item.property.reserve_price).toLocaleString()}
                </p>

                <div
                  className="mt-3"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <SearchableSelect
                    value={item.status}
                    options={Object.entries(STATUS_LABELS).map(([val, label]) => ({ value: val, label }))}
                    onChange={(v) => void handleStatusChange(item.property.id, v as WatchlistStatus)}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
