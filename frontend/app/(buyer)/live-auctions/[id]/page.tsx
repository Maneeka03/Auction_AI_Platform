"use client";

import { AlertCircle, ArrowLeft, Clock, Gavel, Lock, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BuyerTopbar } from "@/components/layout/BuyerTopbar";
import { ConnectionStatusBadge } from "@/components/bidding/ConnectionStatusBadge";
import { QuickBidButtons } from "@/components/bidding/QuickBidButtons";
import { BidHistoryList } from "@/components/bidding/BidHistoryList";
import { placeBid, listBids } from "@/lib/api/bids";
import { ApiRequestError } from "@/lib/api/client";
import { useAuctionSocket } from "@/lib/hooks/useAuctionSocket";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { useAuth } from "@/lib/auth/session-context";
import { can } from "@/lib/auth/permissions";
import type { Bid } from "@/types/bid";

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

export default function LiveBiddingRoomPage() {
  const params = useParams<{ id: string }>();
  const auctionId = params.id;
  const { accessToken, session } = useAuth();

  const { auction, connectionState, lastEvent } = useAuctionSocket(auctionId, accessToken);
  const countdown = useCountdown(auction?.ends_at ?? new Date().toISOString());

  const [bids, setBids] = useState<Bid[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  const canBid = session ? can(session.permissions, "bid_management", "full") && session.roles.includes("buyer") : false;

  useEffect(() => {
    if (!accessToken) return;
    void listBids(accessToken, auctionId).then(setBids).catch(() => {});
  }, [accessToken, auctionId, lastEvent]);

  async function submitBid(amount: string) {
    if (!accessToken) return;
    setBidError(null);
    setIsBidding(true);
    try {
      await placeBid(accessToken, auctionId, { amount });
      setCustomAmount("");
    } catch (err) {
      setBidError(err instanceof ApiRequestError ? err.message : "Failed to place bid.");
    } finally {
      setIsBidding(false);
    }
  }

  function handleCustomSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!customAmount) return;
    void submitBid(Number(customAmount).toFixed(2));
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <BuyerTopbar />
        <div className="mx-auto max-w-3xl p-6">
          <p className="text-sm text-neutral-500">Connecting to the auction room...</p>
        </div>
      </div>
    );
  }

  const isLive = auction.status === "live";
  const isEnded = auction.status === "ended";

  return (
    <div className="min-h-screen bg-neutral-50">
      <BuyerTopbar />

      <div className="mx-auto max-w-3xl space-y-5 p-6">
        <Link href="/auctions" className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700">
          <ArrowLeft size={15} /> Back to auctions
        </Link>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{auction.category}</p>
              <h1 className="mt-0.5 text-xl font-semibold text-neutral-900">{auction.title}</h1>
              <p className="text-sm text-neutral-500">{auction.address}</p>
            </div>
            <ConnectionStatusBadge state={connectionState} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-neutral-50 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-neutral-500">Current Bid</p>
              <p className="text-lg font-semibold text-neutral-900">{formatMoney(auction.current_bid)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Reserve Price</p>
              <p className="text-lg font-semibold text-neutral-900">{formatMoney(auction.reserve_price)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Bidders</p>
              <p className="flex items-center gap-1 text-lg font-semibold text-neutral-900">
                <Users size={16} /> {auction.bidder_count}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">{isEnded ? "Ended" : "Time Left"}</p>
              <p className={`flex items-center gap-1 text-lg font-semibold ${isLive ? "text-danger-600" : "text-neutral-900"}`}>
                <Clock size={16} /> {isEnded ? "—" : countdown.label}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
              {auction.room_access === "invite_only" ? <Lock size={11} /> : <Users size={11} />}
              {auction.room_access === "invite_only" ? "Invite Only" : "Open to Everyone"}
            </span>
          </div>

          <div className="mt-6 border-t border-neutral-100 pt-5">
            {isEnded ? (
              <p className="rounded-lg bg-neutral-100 px-3 py-2.5 text-sm text-neutral-600">
                This auction has ended{auction.winner_id ? " and a winner has been selected." : " with no sale."}
              </p>
            ) : !isLive ? (
              <p className="rounded-lg bg-sky-500/10 px-3 py-2.5 text-sm text-sky-700">
                This auction hasn&apos;t started yet — bidding opens once it goes live.
              </p>
            ) : !canBid ? (
              <p className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700">
                <AlertCircle size={15} /> Only buyer accounts can place bids in this room.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-neutral-800">Quick Bid</p>
                <QuickBidButtons
                  currentBid={auction.current_bid}
                  openingBid={auction.opening_bid}
                  increments={auction.increments}
                  disabled={isBidding}
                  onBid={submitBid}
                />

                <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-1">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={`Minimum ${formatMoney(auction.minimum_bid)}`}
                    disabled={isBidding}
                    className="h-11 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <button
                    type="submit"
                    disabled={isBidding || !customAmount}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    <Gavel size={15} /> {isBidding ? "Placing..." : "Place Bid"}
                  </button>
                </form>

                {bidError ? <p className="text-sm text-danger-600">{bidError}</p> : null}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-neutral-900">Bid Activity</h2>
          <div className="mt-3">
            <BidHistoryList bids={bids} currentUserId={session?.id} />
          </div>
        </div>
      </div>
    </div>
  );
}