"use client";

import { AlertCircle, ArrowLeft, Clock, Gavel, Lock, Package, Star, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConnectionStatusBadge } from "@/components/bidding/ConnectionStatusBadge";
import { QuickBidButtons } from "@/components/bidding/QuickBidButtons";
import { BidHistoryList } from "@/components/bidding/BidHistoryList";
import { placeBid, listBids } from "@/lib/api/bids";
import { ApiRequestError } from "@/lib/api/client";
import { addToWatchlist, listWatchlist, removeFromWatchlist } from "@/lib/api/watchlist";
import { useAuctionSocket } from "@/lib/hooks/useAuctionSocket";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { useAuth } from "@/lib/auth/session-context";
import { can } from "@/lib/auth/permissions";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import type { Bid } from "@/types/bid";

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

export default function LiveBiddingRoomPage() {
  const params = useParams<{ id: string }>();
  const auctionId = params.id;
  const router = useRouter();
  const { accessToken, session } = useAuth();

  const { auction, connectionState, eventCount } = useAuctionSocket(auctionId, accessToken);
  const countdown = useCountdown(auction?.ends_at ?? new Date().toISOString());

  const [bids, setBids] = useState<Bid[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState<{ code: string; message: string } | null>(null);

  const [isWatched, setIsWatched] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Check if auction's property is already in watchlist
  useEffect(() => {
    if (!accessToken || !auction?.property_id) return;
    listWatchlist(accessToken)
      .then((items) => setIsWatched(items.some((i) => i.property.id === auction.property_id)))
      .catch(() => {});
  }, [accessToken, auction?.property_id]);

  async function toggleWatchlist() {
    if (!accessToken || !auction?.property_id || watchlistLoading) return;
    setWatchlistLoading(true);
    try {
      if (isWatched) {
        await removeFromWatchlist(accessToken, auction.property_id);
        setIsWatched(false);
      } else {
        await addToWatchlist(accessToken, auction.property_id);
        setIsWatched(true);
      }
    } catch {
      // silent
    } finally {
      setWatchlistLoading(false);
    }
  }

  const canBid = session
    ? can(session.permissions, "bid_management", "full") && session.roles.includes("buyer")
    : false;

  useEffect(() => {
    if (!accessToken) return;
    void listBids(accessToken, auctionId).then(setBids).catch(() => {});
  }, [accessToken, auctionId, eventCount]);

  async function submitBid(amount: string) {
    if (!accessToken) return;
    setBidError(null);
    setIsBidding(true);
    try {
      await placeBid(accessToken, auctionId, { amount });
      setCustomAmount("");
    } catch (err) {
      setBidError(
        err instanceof ApiRequestError
          ? { code: err.code, message: err.message }
          : { code: "unknown_error", message: "Failed to place bid." },
      );
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
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <Gavel size={20} className="animate-pulse text-neutral-400" />
          </div>
          <p className="mt-3 text-sm text-neutral-500">Connecting to auction room…</p>
        </div>
      </div>
    );
  }

  const isLive = auction.status === "live";
  const isEnded = auction.status === "ended";
  const iWon = isEnded && !!auction.winner_id && auction.winner_id === session?.id;
  const iLost = isEnded && !!auction.winner_id && auction.winner_id !== session?.id && canBid;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">

      {/* Top bar: back + watchlist */}
      <div className="flex items-center justify-between">
        <Link
          href="/browse-auctions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft size={15} />
          Back to Browse Auctions
        </Link>

        {auction?.property_id ? (
          <button
            type="button"
            onClick={() => void toggleWatchlist()}
            disabled={watchlistLoading}
            title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
              isWatched
                ? "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <Star size={15} fill={isWatched ? "currentColor" : "none"} />
            {isWatched ? "Saved" : "Save to Watchlist"}
          </button>
        ) : null}
      </div>

      {/* Hero card */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

        {/* Image / gradient header */}
        <div className="relative h-52 overflow-hidden bg-neutral-900">
          {resolveMinioUrl(auction.image_url) ? (
            <img
              src={resolveMinioUrl(auction.image_url)!}
              alt={auction.title}
              className="h-full w-full object-cover opacity-70"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package size={48} className="text-neutral-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/30 to-transparent" />

          {/* Category chip top-left */}
          <div className="absolute left-5 top-5">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
              {auction.category_name}
            </span>
          </div>

          {/* Status badges top-right */}
          <div className="absolute right-5 top-5 flex items-center gap-2">
            {/* Show connection badge only for non-live states (Connecting / Reconnecting / Polling) */}
            {connectionState !== "live" && <ConnectionStatusBadge state={connectionState} />}
            {isLive && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Live
              </span>
            )}
            {isEnded && (
              <span className="rounded-full bg-neutral-700 px-3 py-1 text-xs font-semibold text-neutral-300">
                Ended
              </span>
            )}
            {!isLive && !isEnded && (
              <span className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">
                Upcoming
              </span>
            )}
          </div>

          {/* Title + address overlaid bottom */}
          <div className="absolute bottom-5 left-5 right-5">
            <h1 className="text-2xl font-bold leading-tight text-white">{auction.title}</h1>
            {auction.address && (
              <p className="mt-1 text-sm text-white/70">{auction.address}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 lg:grid-cols-4 lg:divide-y-0">
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Current Bid</p>
            <p className="mt-2 text-2xl font-extrabold text-brand-600">{formatMoney(auction.current_bid)}</p>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Reserve Price</p>
            <p className="mt-2 text-2xl font-extrabold text-neutral-800">{formatMoney(auction.reserve_price)}</p>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Bidders</p>
            <p className="mt-2 flex items-center gap-1.5 text-2xl font-extrabold text-neutral-800">
              <Users size={18} className="text-neutral-400" />
              {auction.bidder_count}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              {isEnded ? "Ended" : "Time Left"}
            </p>
            <p className={`mt-2 flex items-center gap-1.5 text-2xl font-extrabold ${isLive ? "text-red-500" : "text-neutral-800"}`}>
              <Clock size={18} className={isLive ? "text-red-400" : "text-neutral-400"} />
              {isEnded ? "—" : countdown.label}
            </p>
          </div>
        </div>

        {/* Access + Bidding */}
        <div className="border-t border-neutral-100 p-6">
          <div className="mb-5">
            <span className="flex w-fit items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600">
              {auction.room_access === "invite_only" ? <Lock size={11} /> : <Users size={11} />}
              {auction.room_access === "invite_only" ? "Invite Only" : "Open to Everyone"}
            </span>
          </div>

          {isEnded ? (
            <div>
              {iWon ? (
                <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
                  <p className="text-lg font-bold text-green-700">🏆 Congratulations — You Won!</p>
                  <p className="mt-1 text-sm text-green-600">
                    You are the highest bidder. Our team will contact you shortly to complete the purchase.
                  </p>
                </div>
              ) : iLost ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
                  <p className="text-base font-semibold text-red-700">You didn&apos;t win this auction.</p>
                  <p className="mt-1 text-sm text-red-500">
                    Another bidder placed a higher bid. Browse more auctions to find your next opportunity.
                  </p>
                  <Link
                    href="/browse-auctions"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Browse More Auctions
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                  This auction has ended{auction.winner_id ? " and a winner has been selected." : " with no sale."}
                </div>
              )}
            </div>
          ) : !isLive ? (
            <div className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
              This auction hasn&apos;t started yet — bidding opens once it goes live.
            </div>
          ) : !canBid ? (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertCircle size={15} /> Only buyer accounts can place bids in this room.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Quick Bid</p>
              <QuickBidButtons
                currentBid={auction.current_bid}
                openingBid={auction.opening_bid}
                increments={auction.increments}
                disabled={isBidding}
                onBid={submitBid}
              />
              <form onSubmit={handleCustomSubmit} className="flex gap-2">
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={`Minimum ${formatMoney(auction.minimum_bid)}`}
                  disabled={isBidding}
                  className="h-12 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="submit"
                  disabled={isBidding || !customAmount}
                  className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  <Gavel size={15} />
                  {isBidding ? "Placing…" : "Place Bid"}
                </button>
              </form>
              {bidError ? (
                bidError.code === "kyc_required" ? (
                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <AlertCircle size={15} />
                    Verify your identity before bidding.{" "}
                    <Link href="/kyc" className="font-medium underline underline-offset-2">Complete KYC</Link>
                  </div>
                ) : (
                  <p className="text-sm text-red-600">{bidError.message}</p>
                )
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Activity */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Activity</h2>
        <div className="mt-4">
          <BidHistoryList bids={bids} currentUserId={session?.id} />
        </div>
      </div>
    </div>
  );
}
