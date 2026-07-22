import { CalendarPlus, Gavel, Lock, Pencil, Trash2, Users, XCircle } from "lucide-react";
import type { Auction } from "@/types/auction";
import { buildGoogleCalendarUrl } from "@/lib/utils/googleCalendar";

const statusStyles: Record<Auction["status"], string> = {
  live: "bg-danger-500/10 text-danger-600",
  upcoming: "bg-sky-500/10 text-sky-600",
  ended: "bg-neutral-100 text-neutral-500",
};

const statusLabels: Record<Auction["status"], string> = {
  live: "Live Now",
  upcoming: "Upcoming",
  ended: "Ended",
};

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface AuctionCardProps {
  auction: Auction;
  canManage?: boolean;
  onEdit?: (auction: Auction) => void;
  onEndAuction?: (auction: Auction) => void;
  onDelete?: (auction: Auction) => void;
}

export function AuctionCard({ auction, canManage, onEdit, onEndAuction, onDelete }: AuctionCardProps) {
  const calendarUrl = buildGoogleCalendarUrl({
    title: auction.title,
    description: `Auction for ${auction.title} (${auction.category_name}). Reserve price: ${formatMoney(auction.reserve_price)}.`,
    startsAt: auction.starts_at,
    endsAt: auction.ends_at,
  });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{auction.category_name}</p>
          <h3 className="mt-0.5 text-base font-semibold text-neutral-900">{auction.title}</h3>
          <p className="text-xs text-neutral-500">{auction.address}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[auction.status]}`}>
          {auction.status === "live" ? (
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-danger-500 align-middle" />
          ) : null}
          {statusLabels[auction.status]}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-neutral-500">Current Bid</p>
          <p className="font-semibold text-neutral-900">{formatMoney(auction.current_bid)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Reserve Price</p>
          <p className="font-semibold text-neutral-900">{formatMoney(auction.reserve_price)}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        {formatDateTime(auction.starts_at)} – {formatDateTime(auction.ends_at)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
            auction.room_access === "invite_only"
              ? "bg-amber-500/10 text-amber-700"
              : "bg-sky-500/10 text-sky-700"
          }`}
        >
          {auction.room_access === "invite_only" ? <Lock size={11} /> : <Users size={11} />}
          {auction.room_access === "invite_only" ? "Invite Only" : "Open to Everyone"}
        </span>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
            auction.bidder_count > 0 ? "bg-success-500/10 text-success-500" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          <Gavel size={11} />
          {auction.bidder_count} bidders
        </span>
      </div>

      
       <a href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        <CalendarPlus size={15} /> Add to Google Calendar
      </a>

      {canManage && auction.status !== "ended" ? (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onEdit?.(auction)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            type="button"
            onClick={() => onEndAuction?.(auction)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-danger-200 py-2 text-sm font-medium text-danger-600 hover:bg-danger-500/5"
          >
            <XCircle size={14} /> End Auction
          </button>
        </div>
      ) : null}

      {canManage && auction.bidder_count === 0 ? (
        <button
          type="button"
          onClick={() => onDelete?.(auction)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-danger-200 py-2 text-sm font-medium text-danger-600 hover:bg-danger-500/5"
        >
          <Trash2 size={14} /> Delete Auction
        </button>
      ) : null}
    </div>
  );
}