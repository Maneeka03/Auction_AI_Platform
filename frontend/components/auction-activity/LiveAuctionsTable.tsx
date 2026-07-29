"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { liveAuctions } from "@/lib/mock/auctionActivity";

export function LiveAuctionsTable() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-5 py-4">
        <h3 className="text-base font-semibold text-neutral-900">
          Live Auctions
        </h3>

        <p className="mt-1 text-sm text-neutral-500">
          Monitor all active auctions currently running.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-5 py-3">Auction</th>
              <th className="px-5 py-3">Current Bid</th>
              <th className="px-5 py-3">Highest Bidder</th>
              <th className="px-5 py-3">Bidders</th>
              <th className="px-5 py-3">Bid Count</th>
              <th className="px-5 py-3">Time Left</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {liveAuctions.map((auction) => (
              <tr
                key={auction.id}
                className="border-b border-neutral-50 hover:bg-neutral-50"
              >
                <td className="px-5 py-4">
                  <div>
                    <p className="font-medium text-neutral-900">
                      {auction.property}
                    </p>

                    <p className="text-xs text-neutral-500">
                      {auction.id}
                    </p>
                  </div>
                </td>

                <td className="px-5 py-4 font-semibold text-neutral-900">
                  {auction.currentBid}
                </td>

                <td className="px-5 py-4">
                  {auction.highestBidder}
                </td>

                <td className="px-5 py-4">
                  {auction.bidders}
                </td>

                <td className="px-5 py-4">
                  {auction.bidCount}
                </td>

                <td className="px-5 py-4">
                  {auction.timeLeft}
                </td>

                <td className="px-5 py-4">
                  <StatusBadge status={auction.status} />
                </td>

                <td className="px-5 py-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ width: "auto" }}
                  >
                    <Eye size={16} />
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "Live") {
    return (
      <span className="rounded-full bg-success-500/10 px-3 py-1 text-xs font-medium text-success-600">
        Live
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
      Ending Soon
    </span>
  );
}