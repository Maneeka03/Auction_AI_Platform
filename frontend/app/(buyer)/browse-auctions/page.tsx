"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuctionCard } from "@/components/auctions/AuctionCard";
import { listAuctions } from "@/lib/api/auctions";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { getWsBase } from "@/lib/utils/wsBase";
import type { Auction, AuctionSocketMessage, AuctionStatus } from "@/types/auction";

type FilterTab = "all" | AuctionStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live Now" },
  { key: "upcoming", label: "Upcoming" },
  { key: "ended", label: "Ended" },
];

const POLL_INTERVAL_MS = 5000;

export default function BrowseAuctionsPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial load — shows loading spinner
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
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load auctions.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeTab]);

  // Silent background poll — no spinner, no error flash
  const silentPoll = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await listAuctions(accessToken, {
        page: 1,
        size: 50,
        status: activeTab === "all" ? undefined : activeTab,
      });
      setAuctions(result.items);
      setLastUpdated(new Date());
    } catch {
      // swallow — don't disrupt the UI for a background poll failure
    }
  }, [accessToken, activeTab]);

  // Manual refresh button
  async function handleManualRefresh() {
    setIsRefreshing(true);
    await silentPoll();
    setIsRefreshing(false);
  }

  // Initial load when tab changes
  useEffect(() => {
    void fetchAuctions();
  }, [fetchAuctions]);

  // Auto-poll every 5 s, paused when tab is hidden (fallback when WS is not connected)
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        void silentPoll();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [silentPoll]);

  // Stable key from the set of live auction IDs — only changes when the roster of live auctions
  // changes (tab switch / new page), NOT when bid amounts update.
  const liveAuctionIdsKey = useMemo(
    () =>
      auctions
        .filter((a) => a.status === "live")
        .map((a) => a.id)
        .sort()
        .join(","),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [auctions.map((a) => `${a.id}:${a.status}`).join(",")],
  );

  // Open one WebSocket per live auction; push bid updates directly into the list
  useEffect(() => {
    if (!accessToken || !liveAuctionIdsKey) return;

    const ids = liveAuctionIdsKey.split(",").filter(Boolean);
    const sockets = ids.map((id) => {
      const ws = new WebSocket(
        `${getWsBase()}/api/v1/auctions/${id}/ws?token=${encodeURIComponent(accessToken)}`,
      );
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as AuctionSocketMessage;
          if (msg.auction) {
            setAuctions((prev) => prev.map((a) => (a.id === id ? msg.auction : a)));
            setLastUpdated(new Date());
          }
        } catch {}
      };
      ws.onerror = () => ws.close();
      return ws;
    });

    return () => {
      sockets.forEach((s) => {
        try { s.close(); } catch {}
      });
    };
  }, [liveAuctionIdsKey, accessToken]);

  function formatLastUpdated(date: Date): string {
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 5) return "Just now";
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
  }

  const [, forceRender] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceRender((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-neutral-900">Browse Auctions</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Live
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {lastUpdated ? `Updated ${formatLastUpdated(lastUpdated)}` : "Loading…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleManualRefresh()}
          aria-label="Refresh"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
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

