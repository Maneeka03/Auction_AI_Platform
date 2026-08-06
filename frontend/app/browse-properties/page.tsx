"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";
import { FeaturedAssetCard } from "@/components/public/FeaturedAssets/FeaturedAssetCard";
import AuctionPropertyCard from "@/components/public/BrowseProperties/AuctionPropertyCard";
import PriceRangeSlider from "@/components/public/BrowseProperties/PriceRangeSlider";
import { listPublicProperties } from "@/lib/api/properties";
import { listPublicAuctions } from "@/lib/api/auctions";
import { listPublicCategories } from "@/lib/api/categories";
import type { CategoryTree } from "@/types/category";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Property } from "@/types/property";
import type { Auction } from "@/types/auction";
import CustomSelect from "@/components/public/BrowseProperties/CustomSelect";

type AuctionTypeFilter = "live" | "upcoming" | "buy_now";
type EndingWithinFilter = "1d" | "1w" | "1m" | "3m";
type SortOption = "all" | "price_asc" | "price_desc" | "newest";

const ENDING_WINDOWS: Record<EndingWithinFilter, number> = {
  "1d": 86_400_000,
  "1w": 7 * 86_400_000,
  "1m": 30 * 86_400_000,
  "3m": 90 * 86_400_000,
};

export default function BrowsePropertiesPage() {
  const { session } = useAuth();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [auctionByProperty, setAuctionByProperty] = useState<
    Map<string, Auction>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("all");
  const [pageSize, setPageSize] = useState(6);
  const [page, setPage] = useState(1);
  const [auctionTypes, setAuctionTypes] = useState<Set<AuctionTypeFilter>>(
    new Set(),
  );
  const [endingWithin, setEndingWithin] = useState<Set<EndingWithinFilter>>(
    new Set(),
  );
  const [favorited, setFavorited] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const priceBounds = useMemo(() => {
    if (properties.length === 0) return { min: 0, max: 10_000_000 };
    const prices = properties.map((p) => Number(p.reserve_price));
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [properties]);

  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (priceRange === null && properties.length > 0) {
      setPriceRange([priceBounds.min, priceBounds.max]);
    }
  }, [priceBounds, priceRange, properties.length]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [propertyPage, auctionPage, cats] = await Promise.all([
          listPublicProperties({ size: 100 }),
          listPublicAuctions({ size: 100 }),
          listPublicCategories(),
        ]);
        if (!active) return;
        setProperties(propertyPage.items);
        setCategories(cats);

        const map = new Map<string, Auction>();
        for (const auction of auctionPage.items)
          map.set(auction.property_id, auction);
        setAuctionByProperty(map);
      } catch (err) {
        if (active)
          setError(
            err instanceof ApiRequestError
              ? err.message
              : "Failed to load properties.",
          );
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  // Reactively apply ?category=<id> from URL — works on first load AND when
  // Next.js reuses the component across soft navigations (e.g., slider → browse-properties).
  useEffect(() => {
    const catId = searchParams.get("category");
    if (!catId || categories.length === 0) return;
    const matchedParent = categories.find((c) => c.id === catId);
    if (matchedParent) {
      setSelectedCategories(new Set([catId, ...matchedParent.children.map((ch) => ch.id)]));
      setExpandedCategories(new Set([catId]));
    } else {
      setSelectedCategories(new Set([catId]));
      const parentCat = categories.find((c) => c.children.some((ch) => ch.id === catId));
      if (parentCat) setExpandedCategories(new Set([parentCat.id]));
    }
    setPage(1);
  }, [searchParams, categories]);

  function toggleSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
    setPage(1);
  }

  function toggleCategory(id: string, hasChildren: boolean) {
    const isChecking = !selectedCategories.has(id);
    const next = new Set(selectedCategories);
    if (isChecking) {
      next.add(id);
      if (hasChildren) {
        const cat = categories.find((c) => c.id === id);
        cat?.children.forEach((ch) => next.add(ch.id));
      }
    } else {
      next.delete(id);
      if (hasChildren) {
        const cat = categories.find((c) => c.id === id);
        cat?.children.forEach((ch) => next.delete(ch.id));
      }
    }
    setSelectedCategories(next);
    setPage(1);
    if (hasChildren && isChecking) {
      setExpandedCategories((prev) => new Set([...prev, id]));
    }
  }

  function toggleExpanded(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleFavorite(id: string) {
    setFavorited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let items = properties.filter((property) => {
      if (
        search &&
        !property.title.toLowerCase().includes(search.toLowerCase())
      )
        return false;

      if (selectedCategories.size > 0 && !selectedCategories.has(property.category_id))
        return false;

      if (priceRange) {
        const price = Number(property.reserve_price);
        if (price < priceRange[0] || price > priceRange[1]) return false;
      }

      const auction = auctionByProperty.get(property.id);

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

    if (sortBy === "price_asc")
      items = [...items].sort(
        (a, b) => Number(a.reserve_price) - Number(b.reserve_price),
      );
    if (sortBy === "price_desc")
      items = [...items].sort(
        (a, b) => Number(b.reserve_price) - Number(a.reserve_price),
      );
    if (sortBy === "newest")
      items = [...items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    return items;
  }, [
    properties,
    search,
    selectedCategories,
    priceRange,
    auctionTypes,
    endingWithin,
    sortBy,
    auctionByProperty,
    now,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar solid />

      <div
        className="relative w-full overflow-hidden pt-16"
        style={{ aspectRatio: "1812 / 629" }}
      >
        <Image
          src="/images/property-detail/hero-bg.png"
          alt=""
          fill
          className="object-cover object-top"
          priority
        />
      </div>

      <div className="relative z-20 mx-auto -mt-24 w-full max-w-[1600px] px-8 pb-16 sm:-mt-40 lg:-mt-90">
        <div className="mb-6 text-white">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition hover:bg-black/35"
          >
            ← Back to Home
          </Link>
          <h1 className="mt-2 text-4xl font-bold">Explore All Properties</h1>
          <p className="mt-2 text-purple-100">
            {filtered.length > 0
              ? `${filtered.length} properties available`
              : "Browse every published listing."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-neutral-900">
                Filter by Price
              </h3>
              <div className="mt-6">
                {priceRange && (
                  <PriceRangeSlider
                    min={priceBounds.min}
                    max={priceBounds.max}
                    valueMin={priceRange[0]}
                    valueMax={priceRange[1]}
                    onChange={(min, max) => {
                      setPriceRange([min, max]);
                      setPage(1);
                    }}
                  />
                )}
              </div>
              {priceRange && (
                <p className="mt-4 text-sm text-neutral-600">
                  Price:{" "}
                  <span className="font-semibold text-neutral-900">
                    ${priceRange[0].toLocaleString()} - $
                    {priceRange[1].toLocaleString()}
                  </span>
                </p>
              )}
            </div>

            {categories.length > 0 && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900">Category</h3>
                  {selectedCategories.size > 0 && (
                    <button
                      type="button"
                      onClick={() => { setSelectedCategories(new Set()); setPage(1); }}
                      className="text-xs text-violet-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  {categories.map((cat) => {
                    const isChecked = selectedCategories.has(cat.id);
                    const isExpanded = expandedCategories.has(cat.id);
                    const hasChildren = cat.children.length > 0;
                    return (
                      <div key={cat.id}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`cat-${cat.id}`}
                            checked={isChecked}
                            onChange={() => toggleCategory(cat.id, hasChildren)}
                            className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500"
                          />
                          <label
                            htmlFor={`cat-${cat.id}`}
                            className="flex-1 cursor-pointer select-none text-sm font-medium text-neutral-800"
                          >
                            {cat.name}
                          </label>
                          {hasChildren && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(cat.id)}
                              className="rounded p-0.5 text-neutral-400 hover:text-neutral-700"
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? (
                                <ChevronDown size={14} />
                              ) : (
                                <ChevronRight size={14} />
                              )}
                            </button>
                          )}
                        </div>
                        {hasChildren && isExpanded && (
                          <div className="ml-2 mt-2 space-y-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                            {cat.children.map((child) => (
                              <label
                                key={child.id}
                                className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.has(child.id)}
                                  onChange={() =>
                                    toggleSet(selectedCategories, child.id, setSelectedCategories)
                                  }
                                  className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500"
                                />
                                {child.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-neutral-900">
                Auction Type
              </h3>
              <div className="mt-4 space-y-3">
                {(
                  [
                    ["live", "Live Auction"],
                    ["upcoming", "Timed Auction"],
                    ["buy_now", "Buy Now"],
                  ] as [AuctionTypeFilter, string][]
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 text-sm text-neutral-700"
                  >
                    <input
                      type="checkbox"
                      checked={auctionTypes.has(value)}
                      onChange={() =>
                        toggleSet(auctionTypes, value, setAuctionTypes)
                      }
                      className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-neutral-900">
                Ending Within
              </h3>
              <div className="mt-4 space-y-3">
                {(
                  [
                    ["1d", "1 Day"],
                    ["1w", "1 Week"],
                    ["1m", "1 Month"],
                    ["3m", "3 Month"],
                  ] as [EndingWithinFilter, string][]
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 text-sm text-neutral-700"
                  >
                    <input
                      type="checkbox"
                      checked={endingWithin.has(value)}
                      onChange={() =>
                        toggleSet(endingWithin, value, setEndingWithin)
                      }
                      className="h-4 w-4 rounded border-neutral-300 text-brand-500 focus:ring-brand-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-neutral-600">Sort By:</span>
                <CustomSelect
                  value={sortBy}
                  onChange={(v) => {
                    setSortBy(v as SortOption);
                    setPage(1);
                  }}
                  className="w-44"
                  options={[
                    { value: "all", label: "All" },
                    { value: "price_asc", label: "Price: Low to High" },
                    { value: "price_desc", label: "Price: High to Low" },
                    { value: "newest", label: "Newest" },
                  ]}
                />
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-neutral-600">Show:</span>
                <CustomSelect
                  value={String(pageSize)}
                  onChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                  className="w-24"
                  options={[
                    { value: "6", label: "06" },
                    { value: "9", label: "09" },
                    { value: "12", label: "12" },
                    { value: "24", label: "24" },
                  ]}
                />
              </div>

              <div className="relative flex-1 md:max-w-xs">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Item Name"
                  className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {error ? (
              <p className="text-danger-600">{error}</p>
            ) : isLoading ? (
              <p className="text-neutral-500">Loading properties...</p>
            ) : pageItems.length === 0 ? (
              <p className="rounded-2xl bg-white p-10 text-center text-neutral-500 shadow-sm">
                No properties match these filters.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {pageItems.map((property) => {
                    const auction = auctionByProperty.get(property.id);
                    return auction ? (
                      <AuctionPropertyCard
                        key={property.id}
                        property={property}
                        auction={auction}
                        now={now}
                        loggedIn={!!session}
                        favorited={favorited.has(property.id)}
                        onToggleFavorite={() => toggleFavorite(property.id)}
                      />
                    ) : (
                      <FeaturedAssetCard
                        key={property.id}
                        property={property}
                      />
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-neutral-100 disabled:opacity-40"
                    >
                      ←
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPage(n)}
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                            n === currentPage
                              ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-md"
                              : "bg-white text-neutral-700 shadow-sm hover:bg-neutral-100"
                          }`}
                        >
                          {n}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-neutral-100 disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
