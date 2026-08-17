import { bidHistory } from "@/lib/mock/auctionActivity";

export function BidHistoryPanel() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900">
          Recent Bid History
        </h3>

        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
          Demo data
        </span>
      </div>

      <ul className="mt-3 divide-y divide-neutral-100">
        {bidHistory.map((bid) => (
          <li key={bid.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">{bid.bidder}</p>
              <p className="text-xs text-neutral-500">
                {bid.property} · {bid.time}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-neutral-900">{bid.amount}</p>
              <span
                className={`text-xs font-medium ${
                  bid.status === "Accepted" ? "text-success-500" : "text-danger-600"
                }`}
              >
                {bid.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}