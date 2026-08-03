"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BedDouble, Bath, Ruler, Gavel, Star, Tag, TrendingUp, Users } from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";
import { listPublicAuctions } from "@/lib/api/auctions";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import { getPublicProperty } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Auction, AuctionStatus } from "@/types/auction";
import type { Property } from "@/types/property";

type FilterTab = "all" | AuctionStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live Now" },
  { key: "upcoming", label: "Upcoming" },
];

interface Row {
  auction: Auction;
  property: Property | null;
}

function shortCode(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function timeRemaining(endsAt: string, now: number): string {
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1_000);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  return `${hours}h ${mins}m ${secs}s`;
}

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

export default function LiveAuctionsPage() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorited, setFavorited] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await listPublicAuctions({
        size: 50,
        status: activeTab === "all" ? undefined : activeTab,
      });
      const withProperties = await Promise.all(
        page.items.map(async (auction) => {
          try {
            const property = await getPublicProperty(auction.property_id);
            return { auction, property };
          } catch {
            return { auction, property: null };
          }
        }),
      );
      setRows(withProperties);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load auctions.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleFavorite(id: string) {
    setFavorited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bidTarget(auctionId: string): string {
    return session ? `/live-auctions/${auctionId}` : `/login?redirect=/live-auctions/${auctionId}`;
  }

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

      <div className="relative z-20 mx-auto -mt-90 w-full max-w-[1600px] px-8 pb-16">
        <div className="mb-6 text-white">
          <h1 className="mt-2 text-4xl font-bold">Live Auctions</h1>
          <p className="mt-2 text-purple-100">
            {!isLoading && rows.length > 0
              ? `${rows.length} auction${rows.length === 1 ? "" : "s"} available`
              : "Browse all active auction listings."}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-md"
                  : "bg-white text-neutral-600 shadow-sm hover:bg-neutral-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <p className="py-10 text-center text-sm text-white">Loading auctions…</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-200">{error}</p>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl bg-white p-16 text-center text-neutral-500 shadow-sm">
            No auctions in this category right now.
          </div>
        ) : (() => {
          const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
          const currentPage = Math.min(page, totalPages);
          const pageItems = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
          return (
          <>
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm">
              <span className="text-sm text-neutral-600">
                {rows.length} auction{rows.length === 1 ? "" : "s"} found
              </span>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-neutral-600">Show:</span>
                {[5, 10, 15].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => { setPageSize(size); setPage(1); }}
                    className={`rounded-lg px-3 py-1.5 font-medium transition ${
                      pageSize === size
                        ? "bg-violet-600 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

          <div className="space-y-5">
            {pageItems.map(({ auction, property }, index) => (
              <Link
                key={auction.id}
                href={bidTarget(auction.id)}
                style={{
                  animationDelay: `${index * 60}ms`,
                  animationFillMode: "backwards",
                }}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1 hover:shadow-xl md:flex-row"
              >
                {/* Thumbnail */}
                <div className="relative h-56 w-full shrink-0 overflow-hidden bg-neutral-100 md:h-auto md:w-72">
                  {auction.image_url ? (
                    <Image
                      src={resolveMinioUrl(auction.image_url)!}
                      alt={auction.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                      {auction.category_name}
                    </div>
                  )}

                  {/* Status badge */}
                  <span
                    className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow ${
                      auction.status === "live" ? "bg-green-500" : "bg-violet-500"
                    }`}
                  >
                    {auction.status === "live" ? "Live" : "Upcoming"}
                  </span>

                  {/* Favourite */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(auction.id);
                    }}
                    aria-label="Save to favourites"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-110"
                  >
                    <Star
                      size={16}
                      className={
                        favorited.has(auction.id)
                          ? "fill-amber-400 text-amber-400"
                          : "text-neutral-400"
                      }
                    />
                  </button>
                </div>

                {/* Details */}
                <div className="flex flex-1 items-center gap-6 px-6 py-5">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900">{auction.title}</h3>
                    <p className="text-sm text-neutral-500">{auction.address}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                      <span>
                        <span className="font-medium text-neutral-700">Listing ID:</span>{" "}
                        {property ? shortCode(property.id) : "—"}
                      </span>
                      <span className="text-neutral-300">|</span>
                      <span>
                        <span className="font-medium text-neutral-700">Item #:</span>{" "}
                        {shortCode(auction.id)}
                      </span>
                    </div>
                    {property &&
                      (property.bedrooms || property.bathrooms || property.area_sqft) && (
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                          {property.bedrooms != null && (
                            <span className="flex items-center gap-1">
                              <BedDouble size={15} /> {property.bedrooms} Beds
                            </span>
                          )}
                          {property.bathrooms != null && (
                            <span className="flex items-center gap-1">
                              <Bath size={15} /> {property.bathrooms} Baths
                            </span>
                          )}
                          {property.area_sqft != null && (
                            <span className="flex items-center gap-1">
                              <Ruler size={15} />{" "}
                              {property.area_sqft.toLocaleString()} Sq. Ft.
                            </span>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Price stats */}
                  <div className="flex shrink-0 items-center border-l-2 border-dashed border-neutral-300 pl-6">
                    <div className="border-r-2 border-dashed border-neutral-300 px-6">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                        <TrendingUp size={14} /> Current Bid
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-neutral-900">
                        {formatMoney(auction.current_bid)}
                      </p>
                    </div>
                    <div className="border-r-2 border-dashed border-neutral-300 px-6">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                        <Tag size={14} /> Reserve Price
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-neutral-900">
                        {formatMoney(auction.reserve_price)}
                      </p>
                    </div>
                    <div className="px-6 text-sm text-neutral-500">
                      <p className="flex items-center gap-1.5">
                        <Users size={14} /> {auction.bidder_count} bidder
                        {auction.bidder_count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA panel */}
                <div className="flex w-full flex-col items-center justify-center gap-3 bg-neutral-50 px-6 py-6 md:w-56">
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                      Bidding ends in
                    </p>
                    <p className="mt-1 text-lg font-bold text-red-600">
                      {timeRemaining(auction.ends_at, now)}
                    </p>
                  </div>
                  <div className="text-center text-sm text-neutral-500">
                    Next Minimum Bid
                    <p className="text-base font-semibold text-neutral-900">
                      {formatMoney(auction.minimum_bid)}
                    </p>
                  </div>
                  <div className="text-center text-xs text-neutral-400">
                    Increments of{" "}
                    {auction.increments.length
                      ? `$${Number(Math.min(...auction.increments.map(Number))).toLocaleString()}`
                      : "—"}
                  </div>
                  <span className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white transition group-hover:scale-105">
                    <Gavel size={15} /> Submit A Bid
                  </span>
                </div>
              </Link>
            ))}
          </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      p === currentPage
                        ? "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow"
                        : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
          );
        })()}
      </div>

      <Footer />
    </div>
  );
}
