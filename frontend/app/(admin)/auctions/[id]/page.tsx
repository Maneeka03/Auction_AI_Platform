"use client";

import { ArrowLeft, Clock, Gavel, Lock, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuctionCommentPanel } from "@/components/auctions/AuctionCommentPanel";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { BidHistoryList } from "@/components/bidding/BidHistoryList";
import { ConnectionStatusBadge } from "@/components/bidding/ConnectionStatusBadge";
import { AdminShell } from "@/components/layout/AdminShell";
import { listBids } from "@/lib/api/bids";
import { useAuth } from "@/lib/auth/session-context";
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

  const { auction, comments, connection, send } = useAuctionRoom(auctionId, accessToken);
  const countdown = useCountdown(auction?.ends_at ?? new Date().toISOString());
  const [bids, setBids] = useState<Bid[]>([]);

  const isSuperAdmin = session?.roles.includes("super_admin") ?? false;

  useEffect(() => {
    if (!accessToken || !isSuperAdmin) return;
    void listBids(accessToken, auctionId)
      .then(setBids)
      .catch(() => {});
  }, [accessToken, auctionId, isSuperAdmin, auction?.current_bid, auction?.bidder_count]);

  return (
    <AdminShell>
      <RequirePermission module="auction_management" need="view">
        {!isSuperAdmin ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <ShieldAlert size={22} />
            </span>
            <h2 className="text-lg font-semibold text-neutral-900">Super admins only</h2>
            <p className="max-w-sm text-sm text-neutral-500">
              The auction room is available to super admins for now. Bidder and seller rooms are
              coming next.
            </p>
            <Link href="/auctions" className="mt-2 text-sm font-medium text-brand-600">
              Back to auctions
            </Link>
          </div>
        ) : (
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
                <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-7rem)]">
                  <AuctionCommentPanel
                    comments={comments}
                    currentUserId={session?.id}
                    onSend={send}
                  />
                </div>

                <div className="space-y-5">
                  <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                    {auction.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
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
                        <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs capitalize text-neutral-600">
                          {auction.status}
                        </span>
                      </div>
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
            )}
          </div>
        )}
      </RequirePermission>
    </AdminShell>
  );
}
