import { ApproverSeatChip } from "@/components/approvals/ApproverSeatChip";
import type { ApproverSeat, Property, PropertyStatus } from "@/types/property";

const SEATS: ApproverSeat[] = ["director", "appraiser", "legal_finance"];

const outcomeBadge: Record<PropertyStatus, { label: string; className: string }> = {
  draft: { label: "Awaiting Approval", className: "bg-amber-500/10 text-amber-600" },
  published: { label: "Approved — Live", className: "bg-success-500/10 text-success-500" },
  rejected: { label: "Rejected", className: "bg-danger-500/10 text-danger-600" },
  sold: { label: "Sold", className: "bg-brand-500/10 text-brand-600" },
};

interface PropertyApprovalCardProps {
  property: Property;
  currentUserSeat?: ApproverSeat;
  onVote: (propertyId: string, approved: boolean) => void;
  isVoting?: boolean;
}

export function PropertyApprovalCard({
  property,
  currentUserSeat,
  onVote,
  isVoting,
}: PropertyApprovalCardProps) {
  const approvedCount = property.votes.filter((v) => v.approved).length;
  const badge = outcomeBadge[property.status];

  const myVote = currentUserSeat ? property.votes.find((v) => v.seat === currentUserSeat) : undefined;
  const canVote = property.status === "draft" && currentUserSeat !== undefined && myVote === undefined;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{property.category_name}</p>
          <h3 className="mt-0.5 text-base font-semibold text-neutral-900">{property.title}</h3>
          <p className="text-xs text-neutral-500">{property.address}</p>
          <p className="mt-1 text-sm text-neutral-500">
            Submitted by{" "}
            <span className="font-medium text-neutral-700">{property.seller_name ?? "Unknown Seller"}</span> ·{" "}
            {new Date(property.created_at).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>
          <p className="mt-1.5 text-sm font-semibold text-neutral-900">
            ${Number(property.reserve_price).toLocaleString()}
          </p>
          <p className="text-xs text-neutral-500">Reserve price</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {SEATS.map((seat) => (
          <ApproverSeatChip
            key={seat}
            seat={seat}
            vote={property.votes.find((v) => v.seat === seat)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
        <p className="text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{approvedCount} of 3</span> approved — needs 2 to
          proceed
        </p>

        {canVote ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isVoting}
              onClick={() => onVote(property.id, false)}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={isVoting}
              onClick={() => onVote(property.id, true)}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              Approve
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}