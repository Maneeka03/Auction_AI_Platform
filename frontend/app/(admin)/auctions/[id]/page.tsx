"use client";

import { ArrowLeft, Clock, Gavel, Lock, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BiddingChatPanel } from "@/components/bidding/BiddingChatPanel";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { BidHistoryList } from "@/components/bidding/BidHistoryList";
import { ConnectionStatusBadge } from "@/components/bidding/ConnectionStatusBadge";
import { AdminShell } from "@/components/layout/AdminShell";
import { listBids } from "@/lib/api/bids";
import { awardAuctionToHighest, endAuction } from "@/lib/api/auctions";
import { useAuth } from "@/lib/auth/session-context";
import { can } from "@/lib/auth/permissions";
import { useAuctionRoom } from "@/lib/hooks/useAuctionRoom";
import { useCountdown } from "@/lib/hooks/useCountdown";
import type { Bid } from "@/types/bid";

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

export default function AdminAuctionRoomPage() {
  const params = useParams<{ id: string }>();
  const auctionId = params.id;
  const { accessToken, session } = useAuth();

  const { auction, connection, chatMessages, sendChat } = useAuctionRoom(auctionId, accessToken);

  // Roles that can post in the bidding chat (auction managers are view-only).
  const canPostChat = session
    ? (["super_admin", "gemologist"] as const).some((r) => session.roles.includes(r))
    : false;
  const countdown = useCountdown(auction?.ends_at ?? new Date().toISOString());
  const [bids, setBids] = useState<Bid[]>([]);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = session ? can(session.permissions, "auction_management", "full") : false;
  const canViewBids = session ? can(session.permissions, "bid_management", "view") : false;

  useEffect(() => {
    if (!accessToken || !canViewBids) return;
    void listBids(accessToken, auctionId)
      .then(setBids)
      .catch(() => {});
  }, [accessToken, auctionId, canViewBids, auction?.current_bid, auction?.bidder_count]);

  async function handleAwardHighest() {
    if (!accessToken) return;
    setIsActing(true);
    setActionError(null);
    try {
      await awardAuctionToHighest(accessToken, auctionId);
    } catch {
      setActionError("Failed to award auction. Ensure there are active bids.");
    } finally {
      setIsActing(false);
    }
  }

  async function handleEnd() {
    if (!accessToken) return;
    setIsActing(true);
    setActionError(null);
    try {
      await endAuction(accessToken, auctionId);
    } catch {
      setActionError("Failed to end auction.");
    } finally {
      setIsActing(false);
    }
  }

  return (
    <AdminShell>
      <RequirePermission module="auction_management" need="view">
        <div className="space-y-5 p-6">
          <Link
            href="/auctions"
            className="flex w-fit items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700"
          >
            <ArrowLeft size={15} /> Back to auctions
          </Link>

          {!auction ? (
            <p className="text-sm text-neutral-500">Connecting to the auction room...</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="h-[480px] lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]">
                <BiddingChatPanel
                  messages={chatMessages}
                  currentUserId={session?.id}
                  canSend={canPostChat}
                  onSend={sendChat}
                />
              </div>

              <div className="space-y-5">
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  {auction.image_url ? (
                    <img
                      src={auction.image_url}
                      alt={auction.title}
                      className="h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-52 w-full items-center justify-center bg-neutral-100 text-neutral-400">
                      <Gavel size={40} />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                          {auction.category_name}
                        </p>
                        <h1 className="mt-0.5 text-xl font-semibold text-neutral-900">
                          {auction.title}
                        </h1>
                        <p className="text-sm text-neutral-500">{auction.address}</p>
                      </div>
                      <ConnectionStatusBadge state={connection} />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-neutral-50 p-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-neutral-500">Current Bid</p>
                        <p className="text-lg font-semibold text-neutral-900">
                          {formatMoney(auction.current_bid)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Reserve Price</p>
                        <p className="text-lg font-semibold text-neutral-900">
                          {formatMoney(auction.reserve_price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Bidders</p>
                        <p className="flex items-center gap-1 text-lg font-semibold text-neutral-900">
                          <Users size={16} /> {auction.bidder_count}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">
                          {auction.status === "ended" ? "Ended" : "Time Left"}
                        </p>
                        <p
                          className={`flex items-center gap-1 text-lg font-semibold ${
                            auction.status === "live" ? "text-danger-600" : "text-neutral-900"
                          }`}
                        >
                          <Clock size={16} /> {auction.status === "ended" ? "—" : countdown.label}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
                        {auction.room_access === "invite_only" ? (
                          <Lock size={11} />
                        ) : (
                          <Users size={11} />
                        )}
                        {auction.room_access === "invite_only" ? "Invite Only" : "Open to Everyone"}
                      </span>
                    </div>

                    {canManage && auction.status !== "ended" && (
                      <div className="mt-5 border-t border-neutral-100 pt-5">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                          Auction Controls
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleAwardHighest()}
                            disabled={isActing || !auction.current_bid}
                            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                          >
                            {isActing ? "Processing…" : "Award to Highest Bidder"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleEnd()}
                            disabled={isActing}
                            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                          >
                            {isActing ? "Processing…" : "End (No Sale)"}
                          </button>
                        </div>
                        {actionError && (
                          <p className="mt-2 text-sm text-red-600">{actionError}</p>
                        )}
                      </div>
                    )}

                    {auction.status === "ended" && (
                      <div className="mt-5 border-t border-neutral-100 pt-5">
                        {auction.winner_id ? (
                          <div className="rounded-lg bg-green-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-widest text-green-600">
                              Winner
                            </p>
                            <p className="mt-0.5 text-base font-semibold text-green-800">
                              {auction.winner_name ?? "—"}
                            </p>
                            <p className="text-xs text-green-600">Auction closed — winner selected.</p>
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-500">Auction closed with no sale.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {canViewBids && (
                  <div className="rounded-xl border border-neutral-200 bg-white p-6">
                    <h2 className="text-sm font-semibold text-neutral-900">Bid Activity</h2>
                    <div className="mt-3">
                      <BidHistoryList bids={bids} currentUserId={session?.id} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </RequirePermission>
    </AdminShell>
  );
}
