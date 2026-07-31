"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BedDouble, Bath, Ruler, Gavel, Users } from "lucide-react";
import { listPublicAuctions } from "@/lib/api/auctions";
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

// Real IDs are UUIDs, not the short sequential codes in the mockup — this
// derives a readable reference code from the real id rather than inventing one.
function shortCode(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function timeRemaining(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

export default function UpcomingAuctions() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await listPublicAuctions({
        size: 6,
        status: activeTab === "all" ? undefined : activeTab,
      });
      const withProperties = await Promise.all(
        page.items.map(async (auction) => {
          try {
            const property = await getPublicProperty(auction.property_id);
            return { auction, property };
          } catch {
            // Property lookup failing shouldn't drop the whole card — just show it without specs.
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

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-neutral-900">Upcoming Auctions</h2>
          <p className="mt-3 text-neutral-500">
            You are welcome to attend and join in the action at any of our upcoming auctions.
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-8 border-b border-neutral-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-5">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-neutral-500">Loading auctions...</p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-danger-600">{error}</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-neutral-500">
              No auctions in this category right now.
            </p>
          ) : (
            rows.map(({ auction, property }) => (
              <div
                key={auction.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 shadow-sm md:flex-row"
              >
                <div className="relative h-56 w-full shrink-0 bg-neutral-100 md:h-auto md:w-72">
                  {auction.image_url ? (
                    <Image
                      src={auction.image_url}
                      alt={auction.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                      {auction.category_name}
                    </div>
                  )}
                </div>

                <div className="flex-1 px-6 py-5">
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

                  {property && (property.bedrooms || property.bathrooms || property.area_sqft) && (
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
                          <Ruler size={15} /> {property.area_sqft.toLocaleString()} Sq. Ft.
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-dashed border-neutral-200 pt-4">
                    <div>
                      <p className="text-xs text-neutral-500">Current Bid</p>
                      <p className="font-semibold text-brand-600">{formatMoney(auction.current_bid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Reserve Price</p>
                      <p className="font-semibold text-neutral-900">{formatMoney(auction.reserve_price)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-sm text-neutral-500">
                    <Users size={14} />
                    {auction.bidder_count} bidder{auction.bidder_count === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="flex w-full flex-col items-center justify-center gap-3 bg-neutral-50 px-6 py-6 md:w-56">
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                      Bidding ends in
                    </p>
                    <p className="mt-1 text-lg font-bold text-neutral-900">
                      {timeRemaining(auction.ends_at)}
                    </p>
                  </div>
                  <div className="text-center text-sm text-neutral-500">
                    Bid Increment
                    <p className="text-base font-semibold text-neutral-900">
                      {auction.increments[0] ? `$${Number(auction.increments[0]).toLocaleString()}` : "—"}
                    </p>
                  </div>
                  <Link
                    href={session ? `/live-auctions/${auction.id}` : "/login"}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:scale-105"
                  >
                    <Gavel size={15} /> Submit A Bid
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}