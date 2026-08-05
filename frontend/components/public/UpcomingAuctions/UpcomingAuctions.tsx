"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BedDouble, Bath, Ruler, Gavel, Users, Star, TrendingUp, Tag } from "lucide-react";
import { listPublicAuctions } from "@/lib/api/auctions";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import { getPublicProperty } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Auction, AuctionStatus } from "@/types/auction";
import type { Property } from "@/types/property";
import type { Session } from "@/types/auth";

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

function shortCode(id: string): string {
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

const APPRAISER_MANAGER_ROLES = ["auction_manager", "gemologist"];

function targetFor(auctionId: string, session: Session | null): string {
  if (!session) return `/login?redirect=/live-auctions/${auctionId}`;
  if (session.roles.includes("super_admin")) return `/auctions/${auctionId}`;
  if (session.roles.some((r) => APPRAISER_MANAGER_ROLES.includes(r))) return `/auctions?edit=${auctionId}`;
  return `/live-auctions/${auctionId}`;
}

export default function UpcomingAuctions() {
  const { session } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorited, setFavorited] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await listPublicAuctions({ size: 5, status: activeTab === "all" ? undefined : activeTab });
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

  useEffect(() => { void load(); }, [load]);

  function toggleFavorite(id: string) {
    setFavorited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="relative py-20">
      <div className="relative z-20 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">Upcoming Auctions</h2>
          <p className="mt-3 text-neutral-500">
            You are welcome to attend and join in the action at any of our upcoming auctions.
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-8 border-b border-neutral-300 sm:gap-16">
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
            <p className="py-10 text-center text-sm text-neutral-500">No auctions in this category right now.</p>
          ) : (
            rows.map(({ auction, property }, index) => (
              <div
                key={auction.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(targetFor(auction.id, session))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") router.push(targetFor(auction.id, session));
                }}
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  <div className="relative h-52 w-full overflow-hidden bg-neutral-100 sm:h-60 lg:h-auto lg:w-72 lg:shrink-0">
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
                    <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-success-500 text-white shadow-md">
                      <Gavel size={16} />
                    </span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(auction.id); }}
                      aria-label="Save to favorites"
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-110"
                    >
                      <Star
                        size={16}
                        className={favorited.has(auction.id) ? "fill-amber-400 text-amber-400" : "text-neutral-400"}
                      />
                    </button>
                  </div>

                  {/* Main content */}
                  <div className="flex flex-1 flex-col p-4 sm:p-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 sm:text-xl">{auction.title}</h3>
                      <p className="mt-1 text-sm text-neutral-500">{auction.address}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500 sm:text-sm">
                        <span className="font-medium text-neutral-700">Listing ID:</span>
                        <span>{property ? shortCode(property.id) : "—"}</span>
                        <span className="text-neutral-300">•</span>
                        <span className="font-medium text-neutral-700">Item #:</span>
                        <span>{shortCode(auction.id)}</span>
                      </div>

                      {property && (property.bedrooms || property.bathrooms || property.area_sqft) && (
                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-neutral-600">
                          {property.bedrooms != null && (
                            <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1">
                              <BedDouble size={14} /> {property.bedrooms} Beds
                            </span>
                          )}
                          {property.bathrooms != null && (
                            <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1">
                              <Bath size={14} /> {property.bathrooms} Baths
                            </span>
                          )}
                          {property.area_sqft != null && (
                            <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1">
                              <Ruler size={14} /> {property.area_sqft.toLocaleString()} Sq. Ft.
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-neutral-200 p-3">
                          <p className="flex items-center gap-1 text-xs font-medium text-success-500">
                            <TrendingUp size={13} /> Current Bid
                          </p>
                          <p className="mt-1 text-base font-bold text-neutral-900 sm:text-lg">
                            {formatMoney(auction.current_bid)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-neutral-200 p-3">
                          <p className="flex items-center gap-1 text-xs font-medium text-danger-500">
                            <Tag size={13} /> Reserve Price
                          </p>
                          <p className="mt-1 text-base font-bold text-neutral-900 sm:text-lg">
                            {formatMoney(auction.reserve_price)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-neutral-200 p-3">
                          <p className="flex items-center gap-1 text-xs font-medium text-neutral-500">
                            <Users size={13} /> Bidders
                          </p>
                          <p className="mt-1 text-base font-bold text-neutral-900">{auction.bidder_count}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action panel */}
                    <div className="mt-5 rounded-2xl bg-neutral-50 p-4 sm:p-5">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Bidding Ends In</p>
                          <p className="mt-1 text-lg font-bold text-danger-600">{timeRemaining(auction.ends_at, now)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Next Minimum Bid</p>
                          <p className="mt-1 text-base font-semibold text-neutral-900">{formatMoney(auction.minimum_bid)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Bid Increment</p>
                          <p className="mt-1 text-sm font-medium text-neutral-700">
                            {auction.increments.length
                              ? `$${Number(Math.min(...auction.increments.map(Number))).toLocaleString()}`
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={targetFor(auction.id, session)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                      >
                        <Gavel size={15} /> Submit A Bid
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!isLoading && !error && rows.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              href="/live-auctions"
              className="inline-flex items-center gap-2 rounded-full border-2 border-brand-500 px-8 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-500 hover:text-white"
            >
              View All Auctions
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
