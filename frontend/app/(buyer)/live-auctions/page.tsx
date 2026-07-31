"use client";

import { Clock, Gavel, Lock, Package, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { listAuctions } from "@/lib/api/auctions";
import { useAuth } from "@/lib/auth/session-context";
import type { Auction, AuctionStatus } from "@/types/auction";

type FilterTab = "all" | AuctionStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live Now" },
  { key: "upcoming", label: "Upcoming" },
];

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

function timeLabel(auction: Auction): string {
  const date = auction.status === "live" ? auction.ends_at : auction.starts_at;
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AuctionCard({ auction }: { auction: Auction }) {
  const isLive = auction.status === "live";

  return (
    <Link
      href={`/live-auctions/${auction.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Image banner */}
      <div className="relative h-44 overflow-hidden bg-neutral-100">
        {auction.image_url ? (
          <img
            src={auction.image_url}
            alt={auction.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package size={36} className="text-neutral-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute left-3 top-3">
          {isLive ? (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Live Now
            </span>
          ) : (
            <span className="rounded-full bg-sky-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow">
              Upcoming
            </span>
          )}
        </div>

        {/* Category */}
        <p className="absolute bottom-3 left-3 text-xs font-medium text-white/80">
          {auction.category_name}
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-sm font-semibold text-neutral-900 group-hover:text-brand-600">
          {auction.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-neutral-400">{auction.address}</p>

        {/* Bid stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-neutral-50 px-3 py-2">
            <p className="text-xs text-neutral-400">Current Bid</p>
            <p className="mt-0.5 text-sm font-bold text-brand-600">{formatMoney(auction.current_bid)}</p>
          </div>
          <div className="rounded-lg bg-neutral-50 px-3 py-2">
            <p className="text-xs text-neutral-400">Reserve</p>
            <p className="mt-0.5 text-sm font-bold text-neutral-700">{formatMoney(auction.reserve_price)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            {auction.room_access === "invite_only" ? (
              <><Lock size={11} /> Invite only</>
            ) : (
              <><Users size={11} /> {auction.bidder_count} bidder{auction.bidder_count !== 1 ? "s" : ""}</>
            )}
          </span>
          <span className="flex items-center gap-1 text-xs text-neutral-400">
            <Clock size={11} />
            {isLive ? "Ends" : "Starts"} {timeLabel(auction)}
          </span>
        </div>

        {/* CTA */}
        <div className="mt-3">
          <span className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
            isLive
              ? "bg-brand-500 text-white group-hover:bg-brand-600"
              : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
          }`}>
            <Gavel size={13} />
            {isLive ? "Place Bid" : "View Details"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="h-44 bg-neutral-100" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 rounded bg-neutral-100" />
        <div className="h-3 w-1/2 rounded bg-neutral-100" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-12 rounded-lg bg-neutral-100" />
          <div className="h-12 rounded-lg bg-neutral-100" />
        </div>
        <div className="h-8 rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}

export default function BrowseAuctionsPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuctions = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listAuctions(accessToken, {
        page: 1,
        size: 50,
        status: activeTab === "all" ? undefined : activeTab,
      });
      setAuctions(result.items.filter((a) => a.status !== "ended"));
    } catch {
      setError("Failed to load auctions.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeTab]);

  useEffect(() => { void fetchAuctions(); }, [fetchAuctions]);

  const liveCount = auctions.filter((a) => a.status === "live").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Browse Auctions</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {liveCount > 0 ? (
              <><span className="font-medium text-red-500">{liveCount} live</span> auction{liveCount !== 1 ? "s" : ""} happening now</>
            ) : (
              "Bid on properties in real time."
            )}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 rounded-xl border border-neutral-200 bg-white p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : auctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <Gavel size={24} className="text-neutral-400" />
          </div>
          <p className="mt-4 text-base font-medium text-neutral-700">No auctions right now</p>
          <p className="mt-1 text-sm text-neutral-400">
            {activeTab === "live"
              ? "No live auctions at the moment. Check upcoming ones."
              : "Check back soon for new auctions."}
          </p>
          {activeTab !== "all" && (
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="mt-5 rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              View All Auctions
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}
