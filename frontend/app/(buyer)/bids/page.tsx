"use client";

import { Trophy, XCircle, Clock, Gavel } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RibbonKpiCard } from "@/components/dashboard/RibbonKpiCard";
import { getMyBids } from "@/lib/api/bids";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { MyBid } from "@/types/bid";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(value: string | null) {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

function BidResultBadge({ b }: { b: MyBid }) {
  const ended = b.auction.status === "ended";
  const hasWinner = !!b.auction.winner_id;

  if (b.won) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
        <Trophy size={11} /> Won
      </span>
    );
  }
  if (ended && hasWinner) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 ring-1 ring-red-200">
        <XCircle size={11} /> Lost
      </span>
    );
  }
  if (ended) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
        No Sale
      </span>
    );
  }
  if (b.auction.status === "live") {
    return (
      // <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
      //   <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
      //   Active
      // </span>
  
  <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-1 text-xs font-medium text-brand-600 dark:text-white">
    <Clock size={12} /> Active
  </span>
);
    
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-600">
      <Clock size={11} /> Upcoming
    </span>
  );
}

export default function MyBidsPage() {
  const { accessToken } = useAuth();
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getMyBids(accessToken)
      .then(setBids)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load bids."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const won = bids.filter((b) => b.won).length;
  const lost = bids.filter((b) => !b.won && b.auction.status === "ended" && !!b.auction.winner_id).length;
  const noSale = bids.filter((b) => !b.won && b.auction.status === "ended" && !b.auction.winner_id).length;
  const active = bids.filter((b) => b.auction.status === "live").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">My Bids</h1>
          <p className="mt-1 text-sm text-neutral-500">Track all your auction bids and results.</p>
        </div>
        <Link
          href="/browse-auctions"
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <Gavel size={15} /> Browse Auctions
        </Link>
      </div>

      {/* Summary cards */}
      {!loading && bids.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <RibbonKpiCard
            label="Auctions Won"
            value={String(won)}
            changePercent={0}
            changeLabel="total wins"
            accent="success"
            hideChange
          />
          <RibbonKpiCard
            label="Auctions Lost"
            value={String(lost)}
            changePercent={0}
            changeLabel="didn't win"
            accent="danger"
            hideChange
          />
          <RibbonKpiCard
            label="No Sale"
            value={String(noSale)}
            changePercent={0}
            changeLabel="ended unsold"
            accent="neutral"
            hideChange
          />
          <RibbonKpiCard
            label="Active Bids"
            value={String(active)}
            changePercent={0}
            changeLabel="currently live"
            accent="brand"
            hideChange
          />
        </div>
      )}

      {error ? <p className="text-sm text-danger-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : bids.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white py-16 text-center">
          <Gavel size={32} className="mx-auto text-neutral-300" />
          <p className="mt-3 font-medium text-neutral-500">No bids placed yet.</p>
          <Link href="/browse-auctions" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Browse auctions to start bidding
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Property</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">My Max Bid</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Final Bid</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Result</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Date</th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bids.map((b) => (
                <tr key={b.auction.id} className={`hover:bg-neutral-50 ${b.won ? "bg-green-50/30" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{b.auction.title}</p>
                    <p className="text-xs text-neutral-400">{b.auction.category_name}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-600">
                    {formatMoney(b.my_max_bid)}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-700">
                    {formatMoney(b.auction.current_bid)}
                  </td>
                  <td className="px-4 py-3">
                    <BidResultBadge b={b} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(b.auction.ends_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/live-auctions/${b.auction.id}`}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}