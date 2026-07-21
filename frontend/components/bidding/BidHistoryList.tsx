import type { Bid } from "@/types/bid";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

export function BidHistoryList({ bids, currentUserId }: { bids: Bid[]; currentUserId?: string }) {
  if (bids.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-400">No bids yet — be the first.</p>;
  }

  const sorted = [...bids].sort((a, b) => Number(b.amount) - Number(a.amount));

  return (
    <ul className="max-h-64 space-y-1 overflow-y-auto">
      {sorted.map((bid, index) => {
        const isMine = bid.bidder_id === currentUserId;
        return (
          <li
            key={bid.id}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              index === 0 ? "bg-success-500/10" : "bg-neutral-50"
            }`}
          >
            <span className={isMine ? "font-semibold text-brand-600" : "text-neutral-600"}>
              {isMine ? "You" : "Bidder"}
              {index === 0 ? " · Leading" : ""}
            </span>
            <span className="flex items-center gap-3">
              <span className="font-semibold text-neutral-900">${Number(bid.amount).toLocaleString()}</span>
              <span className="text-xs text-neutral-400">{formatTime(bid.created_at)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}