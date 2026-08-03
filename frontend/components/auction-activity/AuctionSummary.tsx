"use client";

import {
  Clock3,
  Gavel,
  HandCoins,
  Users,
} from "lucide-react";

import { auctionSummary } from "@/lib/mock/auctionActivity";

const stats = [
  {
    title: "Live Auctions",
    value: auctionSummary.liveAuctions,
    icon: Gavel,
    color: "bg-brand-500/10 text-brand-600",
  },
  {
    title: "Active Bidders",
    value: auctionSummary.activeBidders,
    icon: Users,
    color: "bg-success-500/10 text-success-500",
  },
  {
    title: "Today's Bids",
    value: auctionSummary.totalBidsToday,
    icon: HandCoins,
    color: "bg-blue-500/10 text-amber-600",
  },
  {
    title: "Ending Soon",
    value: auctionSummary.endingSoon,
    icon: Clock3,
    color: "bg-danger-500/10 text-danger-600",
  },
];

export function AuctionSummary() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">
                  {stat.title}
                </p>

                <h2 className="mt-3 text-3xl font-semibold text-neutral-900">
                  {stat.value}
                </h2>
              </div>

              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full ${stat.color}`}
              >
                <Icon size={20} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}