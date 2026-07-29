"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useCountdown } from "@/lib/hooks/useCountdown";
import type { Auction } from "@/types/auction";

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

interface LiveAuctionsTableProps {
  auctions: Auction[];
  isLoading: boolean;
  error: string | null;
}

export function LiveAuctionsTable({ auctions, isLoading, error }: LiveAuctionsTableProps) {
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

      {isLoading ? (
        <p className="px-5 py-8 text-center text-sm text-neutral-500">
          Loading live auctions...
        </p>
      ) : error ? (
        <p className="px-5 py-8 text-center text-sm text-danger-600">{error}</p>
      ) : auctions.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-neutral-500">
          No live auctions right now.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-5 py-3">Auction</th>
                <th className="px-5 py-3">Current Bid</th>
                <th className="px-5 py-3">Bidders</th>
                <th className="px-5 py-3">Time Left</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {auctions.map((auction) => (
                <LiveAuctionRow key={auction.id} auction={auction} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LiveAuctionRow({ auction }: { auction: Auction }) {
  const router = useRouter();
  const countdown = useCountdown(auction.ends_at);
  const endingSoon = auction.status === "live" && !countdown.isPast && countdown.totalSeconds <= 30 * 60;

  return (
    <tr className="border-b border-neutral-50 hover:bg-neutral-50">
      <td className="px-5 py-4">
        <div>
          <p className="font-medium text-neutral-900">{auction.title}</p>
          <p className="text-xs text-neutral-500">{auction.address}</p>
        </div>
      </td>

      <td className="px-5 py-4 font-semibold text-neutral-900">
        {formatMoney(auction.current_bid ?? auction.opening_bid)}
      </td>

      <td className="px-5 py-4">{auction.bidder_count}</td>

      <td className="px-5 py-4">
        {auction.status === "live" ? (countdown.isPast ? "Ending..." : countdown.label) : "—"}
      </td>

      <td className="px-5 py-4">
        <StatusBadge status={auction.status} endingSoon={endingSoon} />
      </td>

      <td className="px-5 py-4 text-center">
        <Button
          variant="ghost"
          size="sm"
          style={{ width: "auto" }}
          onClick={() => router.push(`/auctions/${auction.id}`)}
        >
          <Eye size={16} />
          View
        </Button>
      </td>
    </tr>
  );
}

function StatusBadge({
  status,
  endingSoon,
}: {
  status: Auction["status"];
  endingSoon: boolean;
}) {
  if (status === "live" && endingSoon) {
    return (
      <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
        Ending Soon
      </span>
    );
  }

  if (status === "live") {
    return (
      <span className="rounded-full bg-success-500/10 px-3 py-1 text-xs font-medium text-success-600">
        Live
      </span>
    );
  }

  if (status === "upcoming") {
    return (
      <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-600">
        Upcoming
      </span>
    );
  }

  return (
    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500">
      Ended
    </span>
  );
}