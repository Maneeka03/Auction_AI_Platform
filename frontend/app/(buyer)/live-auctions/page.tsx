"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuctionCard } from "@/components/auctions/AuctionCard";
import { listAuctions } from "@/lib/api/auctions";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Auction, AuctionStatus } from "@/types/auction";

type FilterTab = "all" | AuctionStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live Now" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ended", label: "Ended" },
];

export default function BrowseAuctionsPage() {
  const router = useRouter();
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
      setAuctions(result.items);
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
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Browse Auctions</h1>
          <p className="mt-1 text-sm text-neutral-600">All auctions across every stage.</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchAuctions()}
          aria-label="Refresh"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-brand-500 text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-100"
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
          No auctions in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              role="button"
              tabIndex={0}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("button, a")) return;
                router.push(`/live-auctions/${auction.id}`);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  router.push(`/live-auctions/${auction.id}`);
              }}
              className="cursor-pointer rounded-xl transition-shadow hover:shadow-md"
            >
              <AuctionCard auction={auction} canManage={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
