"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Gavel, Star, TrendingUp, Tag, Users } from "lucide-react";
import type { Property } from "@/types/property";
import type { Auction } from "@/types/auction";

interface Props {
  property: Property;
  auction: Auction;
  now: number;
  loggedIn: boolean;
  favorited: boolean;
  onToggleFavorite: () => void;
}

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

function timeRemaining(endsAt: string, now: number): string {
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1_000);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  return `${hours}h ${mins}m ${secs}s`;
}

export default function AuctionPropertyCard({
  property,
  auction,
  now,
  loggedIn,
  favorited,
  onToggleFavorite,
}: Props) {
  const router = useRouter();
  const detailTarget = `/browse-properties/${property.id}`;
  const bidTarget = loggedIn ? `/live-auctions/${auction.id}` : "/login";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(detailTarget)}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && router.push(detailTarget)
      }
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-56 w-full overflow-hidden bg-neutral-100">
        {property.image_url ? (
          <Image
            src={property.image_url}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            {property.category_name}
          </div>
        )}
        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-success-500 text-white shadow-md">
          <Gavel size={16} />
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label="Save to favorites"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-110"
        >
          <Star
            size={16}
            className={
              favorited ? "fill-amber-400 text-amber-400" : "text-neutral-400"
            }
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="truncate text-base font-semibold text-neutral-900">
          {property.title}
        </h3>
        <p className="truncate text-xs text-neutral-500">{property.address}</p>

        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-dashed border-neutral-200 pt-3">
          <div>
            <p className="flex items-center gap-1 text-xs font-medium text-success-500">
              <TrendingUp size={12} /> Current Bid
            </p>
            <p className="text-sm font-bold text-neutral-900">
              {formatMoney(auction.current_bid)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs font-medium text-danger-500">
              <Tag size={12} /> Reserve Price
            </p>
            <p className="text-sm font-bold text-neutral-900">
              {formatMoney(auction.reserve_price)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-semibold text-danger-600">
            {timeRemaining(auction.ends_at, now)}
          </span>
          <span className="flex items-center gap-1 text-neutral-500">
            <Users size={12} /> {auction.bidder_count} bidder
            {auction.bidder_count === 1 ? "" : "s"}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(bidTarget);
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition group-hover:scale-105"
        >
          <Gavel size={14} /> Submit A Bid
        </button>
      </div>
    </div>
  );
}
