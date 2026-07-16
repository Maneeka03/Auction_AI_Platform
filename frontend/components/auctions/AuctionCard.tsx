import { CalendarPlus, Gavel, Lock, Users } from "lucide-react";
import type { AuctionListItem, AuctionViewerRole } from "@/types/auction";
import { buildGoogleCalendarUrl } from "@/lib/utils/googleCalendar";

const statusStyles: Record<AuctionListItem["status"], string> = {
  live: "bg-danger-500/10 text-danger-600",
  upcoming: "bg-sky-500/10 text-sky-600",
  ended: "bg-neutral-100 text-neutral-500",
};

const statusLabels: Record<AuctionListItem["status"], string> = {
  live: "Live Now",
  upcoming: "Upcoming",
  ended: "Ended",
};

const viewerLabels: Record<AuctionViewerRole, string> = {
  customer: "Customer",
  admin: "Admin",
  supervisor: "Supervisor",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AuctionCard({ auction }: { auction: AuctionListItem }) {
  const calendarUrl = buildGoogleCalendarUrl({
    title: auction.lotTitle,
    description: `Auction for ${auction.lotTitle} (${auction.category}). Reserve price: ${auction.reservePrice}.`,
    startsAt: auction.startsAt,
    endsAt: auction.endsAt,
  });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{auction.category}</p>
          <h3 className="mt-0.5 text-base font-semibold text-neutral-900">{auction.lotTitle}</h3>
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
          <p className="font-semibold text-neutral-900">{auction.currentBid}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Reserve Price</p>
          <p className="font-semibold text-neutral-900">{auction.reservePrice}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        {formatDateTime(auction.startsAt)} – {formatDateTime(auction.endsAt)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
          {auction.roomAccess === "invite_only" ? <Lock size={11} /> : <Users size={11} />}
          {auction.roomAccess === "invite_only" ? "Invite Only" : "Open to Everyone"}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">
          <Gavel size={11} />
          {auction.bidderCount} bidders
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {auction.visibleTo.map((role) => (
          <span key={role} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {viewerLabels[role]}
          </span>
        ))}
      </div>
      
       <a href={calendarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        <CalendarPlus size={15} /> Add to Google Calendar
      </a>
    </div>
  );
}