"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityHeader } from "@/components/auction-activity/activity-header";
import { ActivityFeedPanel } from "@/components/auction-activity/ActivityFeedPanel";
import { BidHistoryPanel } from "@/components/auction-activity/BidHistoryPanel";
import { LiveAuctionsTable } from "@/components/auction-activity/LiveAuctionsTable";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { RibbonKpiCard } from "@/components/dashboard/RibbonKpiCard";
import { listAuctions } from "@/lib/api/auctions";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Auction } from "@/types/auction";

function formatMoney(value: number): string {
  return `$${value.toLocaleString()}`;
}

export default function AuctionActivityPage() {
  const { accessToken } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveAuctions = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listAuctions(accessToken, { page: 1, size: 50, status: "live" });
      setAuctions(result.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load live auctions.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchLiveAuctions();
  }, [fetchLiveAuctions]);

  // Poll for fresh auction state every 15s so the table/KPIs stay live without a socket.
  useEffect(() => {
    const interval = setInterval(() => void fetchLiveAuctions(), 15000);
    return () => clearInterval(interval);
  }, [fetchLiveAuctions]);

  const kpis = useMemo(() => {
    const totalBidders = auctions.reduce((sum, a) => sum + a.bidder_count, 0);

    const now = Date.now();
    const endingSoonCount = auctions.filter((a) => {
      const msLeft = new Date(a.ends_at).getTime() - now;
      return msLeft > 0 && msLeft <= 30 * 60 * 1000;
    }).length;

    const highestBidAuction = auctions.reduce<Auction | null>((top, a) => {
      const value = Number(a.current_bid ?? a.opening_bid ?? 0);
      const topValue = top ? Number(top.current_bid ?? top.opening_bid ?? 0) : -1;
      return value > topValue ? a : top;
    }, null);

    return {
      liveAuctions: auctions.length,
      totalBidders,
      endingSoonCount,
      highestBid: highestBidAuction
        ? formatMoney(Number(highestBidAuction.current_bid ?? highestBidAuction.opening_bid ?? 0))
        : "—",
      highestBidLabel: highestBidAuction ? highestBidAuction.title : "No live auctions",
    };
  }, [auctions]);

  return (
    <AdminShell>
      <RequirePermission module="reports" need="view">
        <div className="space-y-6 p-6">
          <ActivityHeader />

          {error ? <p className="text-sm text-danger-600">{error}</p> : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RibbonKpiCard
              label="Live Auctions"
              value={isLoading ? "—" : String(kpis.liveAuctions)}
              changePercent={0}
              changeLabel="currently running"
              accent="brand"
              hideChange
            />
            <RibbonKpiCard
              label="Active Bidders"
              value={isLoading ? "—" : String(kpis.totalBidders)}
              changePercent={0}
              changeLabel="across live auctions"
              accent="success"
              hideChange
            />
            <RibbonKpiCard
              label="Ending Soon"
              value={isLoading ? "—" : String(kpis.endingSoonCount)}
              changePercent={0}
              changeLabel="within 30 minutes"
              accent="danger"
              hideChange
            />
            <RibbonKpiCard
              label="Highest Bid"
              value={isLoading ? "—" : kpis.highestBid}
              changePercent={0}
              changeLabel={kpis.highestBidLabel}
              accent="amber"
              hideChange
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityFeedPanel />
            <BidHistoryPanel />
          </div>

          <LiveAuctionsTable auctions={auctions} isLoading={isLoading} error={error} />
        </div>
      </RequirePermission>
    </AdminShell>
  );
}