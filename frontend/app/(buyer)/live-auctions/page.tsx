"use client";

import { Gavel, Lock, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BuyerTopbar } from "@/components/layout/BuyerTopbar";
import { listAuctions } from "@/lib/api/auctions";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Auction, AuctionStatus } from "@/types/auction";

type FilterTab = "all" | AuctionStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live Now" },
  { key: "upcoming", label: "Upcoming" },
];

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
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
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load auctions.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeTab]);

  useEffect(() => {
    void fetchAuctions();
  }, [fetchAuctions]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <BuyerTopbar />

      <div className="mx-auto max-w-6xl space-y-5 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Live Auctions</h1>
          <p className="mt-1 text-sm text-neutral-600">Bid on properties in real time.</p>
        </div>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key ? "bg-brand-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading auctions...</p>
        ) : error ? (
          <p className="text-sm text-danger-600">{error}</p>
        ) : auctions.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
            No auctions in this category right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => (
              <Link
                key={auction.id}
                href={`/live-auctions/${auction.id}`}
                className="block rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{auction.category}</p>
                    <h3 className="mt-0.5 text-base font-semibold text-neutral-900">{auction.title}</h3>
                    <p className="text-xs text-neutral-500">{auction.address}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      auction.status === "live" ? "bg-danger-500/10 text-danger-600" : "bg-sky-500/10 text-sky-600"
                    }`}
                  >
                    {auction.status === "live" ? "Live Now" : "Upcoming"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-neutral-500">Current Bid</p>
                    <p className="font-semibold text-neutral-900">{formatMoney(auction.current_bid)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Reserve Price</p>
                    <p className="font-semibold text-neutral-900">{formatMoney(auction.reserve_price)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
                    {auction.room_access === "invite_only" ? <Lock size={11} /> : <Users size={11} />}
                    {auction.room_access === "invite_only" ? "Invite Only" : "Open"}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
                    <Gavel size={11} /> {auction.bidder_count} bidders
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}