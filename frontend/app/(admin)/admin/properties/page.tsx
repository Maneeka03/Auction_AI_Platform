// "use client";

// import { useCallback, useEffect, useMemo, useState } from "react";
// import { AdminShell } from "@/components/layout/AdminShell";
// import { PropertyCard } from "@/components/properties/PropertyCard";
// import { SearchableSelect } from "@/components/ui/SearchableSelect";
// import { listProperties } from "@/lib/api/properties";
// import { listAuctions } from "@/lib/api/auctions";
// import { ApiRequestError } from "@/lib/api/client";
// import { useAuth } from "@/lib/auth/session-context";
// import { useCategories } from "@/lib/hooks/useCategories";
// import type { Property } from "@/types/property";
// import type { Auction } from "@/types/auction";

// type AuctionTypeFilter = "live" | "upcoming" | "buy_now";
// type EndingWithinFilter = "1d" | "1w" | "1m" | "3m";

// const ENDING_WINDOWS: Record<EndingWithinFilter, number> = {
//   "1d": 86_400_000,
//   "1w": 7 * 86_400_000,
//   "1m": 30 * 86_400_000,
//   "3m": 90 * 86_400_000,
// };

// export default function AdminBrowsePropertiesPage() {
//   const { accessToken } = useAuth();
//   const { categories } = useCategories();

//   const [selectedParentId, setSelectedParentId] = useState("");
//   const [selectedSubId, setSelectedSubId] = useState("");
//   const [properties, setProperties] = useState<Property[]>([]);
//   const [auctionByProperty, setAuctionByProperty] = useState<Map<string, Auction>>(new Map());
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [now] = useState(() => Date.now());

//   const [auctionTypes, setAuctionTypes] = useState<Set<AuctionTypeFilter>>(new Set());
//   const [endingWithin, setEndingWithin] = useState<Set<EndingWithinFilter>>(new Set());
//   const [minPrice, setMinPrice] = useState("");
//   const [maxPrice, setMaxPrice] = useState("");

//   const selectedParent = categories.find((c) => c.id === selectedParentId) ?? null;
//   const subcategories = selectedParent?.children ?? [];
//   const activeCategoryId = selectedSubId || selectedParentId || null;

//   const priceBounds = useMemo(() => {
//     if (properties.length === 0) return { min: 0, max: 10_000_000 };
//     const prices = properties.map((p) => Number(p.reserve_price));
//     return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
//   }, [properties]);

//   const fetchAll = useCallback(async () => {
//     if (!accessToken) return;
//     setIsLoading(true);
//     setError(null);
//     try {
//       const [propResult, auctionResult] = await Promise.all([
//         listProperties(accessToken, { page: 1, size: 100, category_id: activeCategoryId ?? undefined }),
//         listAuctions(accessToken, { page: 1, size: 100 }),
//       ]);
//       setProperties(propResult.items);
//       const map = new Map<string, Auction>();
//       for (const auction of auctionResult.items) map.set(auction.property_id, auction);
//       setAuctionByProperty(map);
//     } catch (err) {
//       setError(err instanceof ApiRequestError ? err.message : "Failed to load properties.");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [accessToken, activeCategoryId]);

//   useEffect(() => {
//     void fetchAll();
//   }, [fetchAll]);

//   function toggleSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
//     const next = new Set(set);
//     if (next.has(value)) next.delete(value);
//     else next.add(value);
//     setter(next);
//   }

//   function handleParentChange(id: string) {
//     setSelectedParentId(id);
//     setSelectedSubId("");
//   }

//   function handleReset() {
//     setSelectedParentId("");
//     setSelectedSubId("");
//     setMinPrice("");
//     setMaxPrice("");
//     setAuctionTypes(new Set());
//     setEndingWithin(new Set());
//   }

//   const visibleProperties = useMemo(() => {
//     return properties.filter((p) => {
//       const minVal = minPrice ? Number(minPrice) : null;
//       const maxVal = maxPrice ? Number(maxPrice) : null;
//       const price = Number(p.reserve_price);
//       if (minVal !== null && price < minVal) return false;
//       if (maxVal !== null && price > maxVal) return false;

//       const auction = auctionByProperty.get(p.id);
//       if (auctionTypes.size > 0) {
//         const matches =
//           (auctionTypes.has("live") && auction?.status === "live") ||
//           (auctionTypes.has("upcoming") && auction?.status === "upcoming") ||
//           (auctionTypes.has("buy_now") && !auction);
//         if (!matches) return false;
//       }

//       if (endingWithin.size > 0) {
//         if (!auction) return false;
//         const remaining = new Date(auction.ends_at).getTime() - now;
//         const matches = Array.from(endingWithin).some(
//           (w) => remaining > 0 && remaining <= ENDING_WINDOWS[w],
//         );
//         if (!matches) return false;
//       }

//       return true;
//     });
//   }, [properties, minPrice, maxPrice, auctionTypes, endingWithin, auctionByProperty, now]);

//   const hasExtraFilters = !!minPrice || !!maxPrice || auctionTypes.size > 0 || endingWithin.size > 0;

//   return (
//     <AdminShell>
//       <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
//         <div>
//           <h1 className="text-2xl font-semibold text-neutral-900">Browse Properties</h1>
//           <p className="mt-1 text-sm text-neutral-600">
//             All properties across every status and category.
//             {visibleProperties.length !== properties.length && (
//               <span className="ml-1 text-brand-600">{visibleProperties.length} of {properties.length} shown</span>
//             )}
//           </p>
//         </div>

//         {/* Filter bar */}
//         <div className="rounded-xl border border-neutral-200 bg-white p-4">
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
//             {/* Category */}
//             <div className="flex flex-col gap-1">
//               <label className="text-xs font-medium text-neutral-500">Category</label>
//               <SearchableSelect
//                 value={selectedParentId}
//                 options={[
//                   { value: "", label: "All Categories" },
//                   ...categories.map((c) => ({ value: c.id, label: c.name })),
//                 ]}
//                 placeholder="All Categories"
//                 onChange={handleParentChange}
//               />
//             </div>

//             {/* Subcategory */}
//             <div className="flex flex-col gap-1">
//               <label className="text-xs font-medium text-neutral-500">Subcategory</label>
//               <SearchableSelect
//                 value={selectedSubId}
//                 options={[
//                   { value: "", label: subcategories.length === 0 ? "No subcategories" : "All Subcategories" },
//                   ...subcategories.map((c) => ({ value: c.id, label: c.name })),
//                 ]}
//                 placeholder={subcategories.length === 0 ? "No subcategories" : "All Subcategories"}
//                 disabled={subcategories.length === 0}
//                 onChange={setSelectedSubId}
//               />
//             </div>

//             {/* Price */}
//             <div className="flex flex-col gap-1">
//               <label className="text-xs font-medium text-neutral-500">
//                 Price Range
//                 {priceBounds.min > 0 && (
//                   <span className="ml-1 font-normal text-neutral-400">
//                     (${priceBounds.min.toLocaleString()} – ${priceBounds.max.toLocaleString()})
//                   </span>
//                 )}
//               </label>
//               <div className="flex items-center gap-1.5">
//                 <input
//                   type="number"
//                   value={minPrice}
//                   onChange={(e) => setMinPrice(e.target.value)}
//                   placeholder="Min"
//                   className="h-9 w-full rounded-lg border border-neutral-200 px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200"
//                 />
//                 <span className="shrink-0 text-xs text-neutral-400">–</span>
//                 <input
//                   type="number"
//                   value={maxPrice}
//                   onChange={(e) => setMaxPrice(e.target.value)}
//                   placeholder="Max"
//                   className="h-9 w-full rounded-lg border border-neutral-200 px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200"
//                 />
//               </div>
//             </div>

//             {/* Auction type */}
//             <div className="flex flex-col gap-1">
//               <label className="text-xs font-medium text-neutral-500">Auction Type</label>
//               <div className="flex flex-wrap gap-1.5 pt-1">
//                 {([["live", "Live"], ["upcoming", "Timed"], ["buy_now", "Buy Now"]] as [AuctionTypeFilter, string][]).map(([value, label]) => (
//                   <button
//                     key={value}
//                     type="button"
//                     onClick={() => toggleSet(auctionTypes, value, setAuctionTypes)}
//                     className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
//                       auctionTypes.has(value)
//                         ? "bg-brand-500 text-white"
//                         : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
//                     }`}
//                   >
//                     {label}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Ending within */}
//             <div className="flex flex-col gap-1">
//               <label className="text-xs font-medium text-neutral-500">Ending Within</label>
//               <div className="flex flex-wrap gap-1.5 pt-1">
//                 {([["1d", "1 Day"], ["1w", "1 Week"], ["1m", "1 Month"], ["3m", "3 Months"]] as [EndingWithinFilter, string][]).map(([value, label]) => (
//                   <button
//                     key={value}
//                     type="button"
//                     onClick={() => toggleSet(endingWithin, value, setEndingWithin)}
//                     className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
//                       endingWithin.has(value)
//                         ? "bg-brand-500 text-white"
//                         : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
//                     }`}
//                   >
//                     {label}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {(selectedParentId || selectedSubId || hasExtraFilters) && (
//             <div className="mt-3 flex justify-end border-t border-neutral-100 pt-3">
//               <button
//                 type="button"
//                 onClick={handleReset}
//                 className="text-xs font-medium text-brand-600 hover:underline"
//               >
//                 Clear all filters
//               </button>
//             </div>
//           )}
//         </div>

//         {isLoading ? (
//           <p className="text-sm text-neutral-500">Loading properties...</p>
//         ) : error ? (
//           <p className="text-sm text-danger-600">{error}</p>
//         ) : visibleProperties.length === 0 ? (
//           <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
//             <p className="text-sm text-neutral-500">No properties match these filters.</p>
//             {(selectedParentId || selectedSubId || hasExtraFilters) && (
//               <button
//                 type="button"
//                 onClick={handleReset}
//                 className="mt-3 text-sm font-medium text-brand-600 hover:underline"
//               >
//                 Clear filters
//               </button>
//             )}
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
//             {visibleProperties.map((property) => (
//               <PropertyCard
//                 key={property.id}
//                 property={property}
//                 detailHref={`/admin/properties/${property.id}`}
//                 onBuyNow={() => {}}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </AdminShell>
//   );
// }
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { listProperties } from "@/lib/api/properties";
import { listAuctions } from "@/lib/api/auctions";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { useCategories } from "@/lib/hooks/useCategories";
import type { Property } from "@/types/property";
import type { Auction } from "@/types/auction";

type AuctionTypeFilter = "live" | "upcoming" | "buy_now";
type EndingWithinFilter = "1d" | "1w" | "1m" | "3m";

const ENDING_WINDOWS: Record<EndingWithinFilter, number> = {
  "1d": 86_400_000,
  "1w": 7 * 86_400_000,
  "1m": 30 * 86_400_000,
  "3m": 90 * 86_400_000,
};

const AUCTION_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Timed" },
  { value: "buy_now", label: "Buy Now" },
];

const ENDING_WITHIN_OPTIONS = [
  { value: "", label: "Any Time" },
  { value: "1d", label: "1 Day" },
  { value: "1w", label: "1 Week" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
];

export default function AdminBrowsePropertiesPage() {
  const { accessToken } = useAuth();
  const { categories } = useCategories();

  const [selectedParentId, setSelectedParentId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [auctionByProperty, setAuctionByProperty] = useState<Map<string, Auction>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const [auctionTypes, setAuctionTypes] = useState<AuctionTypeFilter | "">("");
  const [endingWithin, setEndingWithin] = useState<EndingWithinFilter | "">("");

const [minPrice, setMinPrice] = useState("");
const [maxPrice, setMaxPrice] = useState("");

  const selectedParent = categories.find((c) => c.id === selectedParentId) ?? null;
  const subcategories = selectedParent?.children ?? [];
  const activeCategoryId = selectedSubId || selectedParentId || null;

  const fetchAll = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const [propResult, auctionResult] = await Promise.all([
        listProperties(accessToken, { page: 1, size: 100, category_id: activeCategoryId ?? undefined }),
        listAuctions(accessToken, { page: 1, size: 100 }),
      ]);
      setProperties(propResult.items);
      const map = new Map<string, Auction>();
      for (const auction of auctionResult.items) map.set(auction.property_id, auction);
      setAuctionByProperty(map);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load properties.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeCategoryId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  function handleParentChange(id: string) {
    setSelectedParentId(id);
    setSelectedSubId("");
  }

  function handleReset() {
    setSelectedParentId("");
    setSelectedSubId("");
    setAuctionTypes("");
    setEndingWithin("");
      setMinPrice("");
  setMaxPrice("");
  }

  // const visibleProperties = useMemo(() => {
  //   return properties.filter((p) => {
  //     const auction = auctionByProperty.get(p.id);

  //     if (auctionTypes) {
  //       const matches =
  //         (auctionTypes === "live" && auction?.status === "live") ||
  //         (auctionTypes === "upcoming" && auction?.status === "upcoming") ||
  //         (auctionTypes === "buy_now" && !auction);
  //       if (!matches) return false;
  //     }

  //     if (endingWithin) {
  //       if (!auction) return false;
  //       const remaining = new Date(auction.ends_at).getTime() - now;
  //       const withinWindow = remaining > 0 && remaining <= ENDING_WINDOWS[endingWithin];
  //       if (!withinWindow) return false;
  //     }

  //     return true;
  //   });
  // }, [properties, auctionTypes, endingWithin, auctionByProperty, now]);


const visibleProperties = useMemo(() => {
  return properties.filter((p) => {
    const auction = auctionByProperty.get(p.id);

    if (auctionTypes) {
      const matches =
        (auctionTypes === "live" && auction?.status === "live") ||
        (auctionTypes === "upcoming" && auction?.status === "upcoming") ||
        (auctionTypes === "buy_now" && !auction);

      if (!matches) return false;
    }

    if (endingWithin) {
      if (!auction) return false;

      const remaining =
        new Date(auction.ends_at).getTime() - now;

      const withinWindow =
        remaining > 0 &&
        remaining <= ENDING_WINDOWS[endingWithin];

      if (!withinWindow) return false;
    }

    // Price range
    const price = Number(p.reserve_price);

    if (minPrice && price < Number(minPrice)) {
      return false;
    }

    if (maxPrice && price > Number(maxPrice)) {
      return false;
    }

    return true;
  });
}, [
  properties,
  auctionTypes,
  endingWithin,
  minPrice,
  maxPrice,
  auctionByProperty,
  now,
]);

  const hasExtraFilters = !!auctionTypes || !!endingWithin  ||
  !!minPrice ||
  !!maxPrice;;

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Browse Properties</h1>
          <p className="mt-1 text-sm text-neutral-600">
            All properties across every status and category.
            {visibleProperties.length !== properties.length && (
              <span className="ml-1 text-brand-600">{visibleProperties.length} of {properties.length} shown</span>
            )}
          </p>
        </div>

        {/* Filter bar */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          {/* <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"> */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Category */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">Category</label>
              <SearchableSelect
                value={selectedParentId}
                options={[
                  { value: "", label: "All Categories" },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                placeholder="All Categories"
                onChange={handleParentChange}
              />
            </div>

            {/* Subcategory */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">Subcategory</label>
              <SearchableSelect
                value={selectedSubId}
                options={[
                  { value: "", label: subcategories.length === 0 ? "No subcategories" : "All Subcategories" },
                  ...subcategories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                placeholder={subcategories.length === 0 ? "No subcategories" : "All Subcategories"}
                disabled={subcategories.length === 0}
                onChange={setSelectedSubId}
              />
            </div>

            {/* Auction Type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">Auction Type</label>
              <SearchableSelect
                value={auctionTypes}
                options={AUCTION_TYPE_OPTIONS}
                placeholder="All Types"
                onChange={(value) => setAuctionTypes(value as AuctionTypeFilter | "")}
              />
            </div>

            {/* Ending Within */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">Ending Within</label>
              <SearchableSelect
                value={endingWithin}
                options={ENDING_WITHIN_OPTIONS}
                placeholder="Any Time"
                onChange={(value) => setEndingWithin(value as EndingWithinFilter | "")}
              />
            </div>


{/* Price Range */}
<div className="flex flex-col gap-1">
  <label className="text-xs font-medium text-neutral-500">
    Price Range
  </label>

  <div className="flex items-center gap-2">
    <input
      type="number"
      min="0"
      value={minPrice}
      onChange={(e) => setMinPrice(e.target.value)}
      placeholder="Min"
      className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
    />

    <span className="text-sm text-neutral-400">–</span>

    <input
      type="number"
      min="0"
      value={maxPrice}
      onChange={(e) => setMaxPrice(e.target.value)}
      placeholder="Max"
      className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
    />
  </div>
</div>

          </div>

          {(selectedParentId || selectedSubId || hasExtraFilters) && (
            <div className="mt-3 flex justify-end border-t border-neutral-100 pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading properties...</p>
        ) : error ? (
          <p className="text-sm text-danger-600">{error}</p>
        ) : visibleProperties.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
            <p className="text-sm text-neutral-500">No properties match these filters.</p>
            {(selectedParentId || selectedSubId || hasExtraFilters) && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 text-sm font-medium text-brand-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                detailHref={`/admin/properties/${property.id}`}
                onBuyNow={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
