import { Gavel, LogIn, TimerReset, TrendingUp } from "lucide-react";
import { activityFeed } from "@/lib/mock/auctionActivity";

const typeStyles: Record<string, { icon: typeof Gavel; color: string }> = {
  bid: { icon: TrendingUp, color: "bg-brand-500/10 text-brand-600" },
  outbid: { icon: Gavel, color: "bg-danger-500/10 text-danger-600" },
  joined: { icon: LogIn, color: "bg-success-500/10 text-success-500" },
  ending: { icon: TimerReset, color: "bg-blue-500/10 text-amber-600" },
};

export function ActivityFeedPanel() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900">
          Live Activity Feed
        </h3>

        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
          Demo data
        </span>
      </div>

      <ul className="mt-3 divide-y divide-neutral-100">
        {activityFeed.map((event) => {
          const style = typeStyles[event.type] ?? typeStyles.bid;
          const Icon = style.icon;

          return (
            <li key={event.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.color}`}>
                <Icon size={16} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-900">
                  {event.user ? <span className="font-medium">{event.user} </span> : null}
                  {event.message}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">{event.auction}</p>
              </div>

              <span className="shrink-0 text-xs text-neutral-400">{event.time}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}