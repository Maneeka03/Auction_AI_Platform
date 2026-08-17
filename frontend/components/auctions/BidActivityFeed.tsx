import { Rocket, TrendingUp } from "lucide-react";
import type { Bid } from "@/types/bid";
import { cn } from "@/lib/utils/cn";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function BidActivityFeed({ bids, currentUserId }: { bids: Bid[]; currentUserId?: string }) {
  if (bids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
        <span className="text-2xl">🚀</span>
        <p className="text-sm font-medium text-neutral-700">Waiting for the first bid.</p>
        <p className="text-xs text-neutral-400">Be the first participant to place a bid.</p>
      </div>
    );
  }

  const sorted = [...bids].sort((a, b) => Number(b.amount) - Number(a.amount));

  return (
    <ul className="max-h-72 space-y-1.5 overflow-y-auto">
      {sorted.map((bid, index) => {
        const isMine = bid.bidder_id === currentUserId;
        const isLeading = index === 0;
        return (
          <li
            key={bid.id}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
              isLeading ? "bg-success-500/10" : "bg-neutral-50",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                isLeading ? "bg-success-500/15 text-success-500" : "bg-neutral-100 text-neutral-400",
              )}
            >
              {isLeading ? <Rocket size={14} /> : <TrendingUp size={14} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block font-semibold", isMine ? "text-brand-600" : "text-neutral-700")}>
                {isMine ? "You" : "Bidder"}
                {isLeading ? " · Leading" : ""}
              </span>
              <span className="block text-xs text-neutral-400">{timeAgo(bid.created_at)}</span>
            </span>
            <span className="flex flex-col items-end">
              <span className="font-semibold text-neutral-900">${Number(bid.amount).toLocaleString()}</span>
              <span className="text-[11px] text-neutral-400">{formatTime(bid.created_at)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}