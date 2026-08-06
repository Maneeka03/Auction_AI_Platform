"use client";

import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PaymentModal } from "@/components/properties/PaymentModal";
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

function formatPrice(v: number) {
  return `$${v.toLocaleString()}`;
}

export default function BrowsePropertiesPage() {
  const { accessToken } = useAuth();
  const { categories } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [auctionByProperty, setAuctionByProperty] = useState<Map<string, Auction>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingProperty, setPurchasingProperty] = useState<Property | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const [auctionTypes, setAuctionTypes] = useState<Set<AuctionTypeFilter>>(new Set());
  const [endingWithin, setEndingWithin] = useState<Set<EndingWithinFilter>>(new Set());
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const priceBounds = useMemo(() => {
    if (properties.length === 0) return { min: 0, max: 10_000_000 };
    const prices = properties.map((p) => Number(p.reserve_price));
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [properties]);

  const fetchAll = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const [propResult, auctionResult] = await Promise.all([
        listProperties(accessToken, { page: 1, size: 100, status: "published" }),
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
  }, [accessToken]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  function toggleSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const visibleProperties = useMemo(() => {
    return properties.filter((p) => {
      if (activeCategoryId && p.category_id !== activeCategoryId) return false;

      const minVal = minPrice ? Number(minPrice) : null;
      const maxVal = maxPrice ? Number(maxPrice) : null;
      const price = Number(p.reserve_price);
      if (minVal !== null && price < minVal) return false;
      if (maxVal !== null && price > maxVal) return false;

      const auction = auctionByProperty.get(p.id);
      if (auctionTypes.size > 0) {
        const matches =
          (auctionTypes.has("live") && auction?.status === "live") ||
          (auctionTypes.has("upcoming") && auction?.status === "upcoming") ||
          (auctionTypes.has("buy_now") && !auction);
        if (!matches) return false;
      }

      if (endingWithin.size > 0) {
        if (!auction) return false;
        const remaining = new Date(auction.ends_at).getTime() - now;
        const matches = Array.from(endingWithin).some(
          (w) => remaining > 0 && remaining <= ENDING_WINDOWS[w],
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [properties, activeCategoryId, minPrice, maxPrice, auctionTypes, endingWithin, auctionByProperty, now]);

  function handleConfirmPayment(_updatedProperty: Property) {
    void fetchAll();
  }

  const hasActiveFilters =
    !!activeCategoryId ||
    !!minPrice ||
    !!maxPrice ||
    auctionTypes.size > 0 ||
    endingWithin.size > 0;

  function clearAllFilters() {
    setActiveCategoryId(null);
    setMinPrice("");
    setMaxPrice("");
    setAuctionTypes(new Set());
    setEndingWithin(new Set());
  }

  return (
    <RequirePermission module="asset_management" need="view">
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Browse Properties</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {visibleProperties.length} propert{visibleProperties.length === 1 ? "y" : "ies"} available
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((p) => !p)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors lg:hidden ${
                hasActiveFilters
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Filter size={15} />
              Filters
              {hasActiveFilters ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white">
                  {[activeCategoryId ? 1 : 0, minPrice || maxPrice ? 1 : 0, auctionTypes.size > 0 ? 1 : 0, endingWithin.size > 0 ? 1 : 0].reduce((a, b) => a + b, 0)}
                </span>
              ) : null}
              {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
            {/* Filter sidebar */}
            <aside
              className={`space-y-4 ${filtersOpen ? "block" : "hidden"} lg:block`}
            >
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900">Filters</h3>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Category */}
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Category</p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setActiveCategoryId(null)}
                      className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                        activeCategoryId === null
                          ? "bg-brand-50 font-medium text-brand-700"
                          : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      All
                    </button>
                    {categories.map((main) => (
                      <div key={main.id}>
                        <button
                          type="button"
                          onClick={() => setActiveCategoryId(main.id)}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                            activeCategoryId === main.id
                              ? "bg-brand-50 font-medium text-brand-700"
                              : "text-neutral-600 hover:bg-neutral-50"
                          }`}
                        >
                          {main.name}
                        </button>
                        {main.children.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setActiveCategoryId(sub.id)}
                            className={`w-full rounded-lg py-1.5 pl-5 pr-2.5 text-left text-sm transition-colors ${
                              activeCategoryId === sub.id
                                ? "bg-brand-50 font-medium text-brand-700"
                                : "text-neutral-500 hover:bg-neutral-50"
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Price Range</p>
                  <p className="mb-2 text-xs text-neutral-400">
                    {formatPrice(priceBounds.min)} – {formatPrice(priceBounds.max)}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="h-8 w-full rounded-lg border border-neutral-200 px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200"
                    />
                    <span className="shrink-0 text-xs text-neutral-400">–</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="h-8 w-full rounded-lg border border-neutral-200 px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-200"
                    />
                  </div>
                </div>

                {/* Auction type */}
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Auction Type</p>
                  <div className="space-y-2">
                    {([["live", "Live Auction"], ["upcoming", "Timed Auction"], ["buy_now", "Buy Now"]] as [AuctionTypeFilter, string][]).map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={auctionTypes.has(value)}
                          onChange={() => toggleSet(auctionTypes, value, setAuctionTypes)}
                          className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Ending within */}
                <div className="mt-4 border-t border-neutral-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Ending Within</p>
                  <div className="space-y-2">
                    {([["1d", "24 Hours"], ["1w", "1 Week"], ["1m", "1 Month"], ["3m", "3 Months"]] as [EndingWithinFilter, string][]).map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={endingWithin.has(value)}
                          onChange={() => toggleSet(endingWithin, value, setEndingWithin)}
                          className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-400"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Property grid */}
            <div>
              {isLoading ? (
                <p className="text-sm text-neutral-500">Loading properties...</p>
              ) : error ? (
                <p className="text-sm text-danger-600">{error}</p>
              ) : visibleProperties.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
                  <p className="text-sm text-neutral-500">No properties match these filters.</p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="mt-3 text-sm font-medium text-brand-600 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} onBuyNow={setPurchasingProperty} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {purchasingProperty ? (
        <PaymentModal
          property={purchasingProperty}
          onClose={() => setPurchasingProperty(null)}
          onConfirm={handleConfirmPayment}
        />
      ) : null}
    </RequirePermission>
  );
}
