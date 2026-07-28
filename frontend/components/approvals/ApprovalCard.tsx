import { ApproverChip } from "@/components/approvals/ApproverChip";
import type { ApprovalItem, ApproverRole } from "@/types/approval";

const outcomeBadge: Record<ApprovalItem["outcome"], { label: string; className: string }> = {
  awaiting_approval: { label: "Awaiting Approval", className: "bg-amber-500/10 text-amber-600" },
  approved: { label: "Approved — Ready to Proceed", className: "bg-success-500/10 text-success-500" },
  rejected: { label: "Rejected", className: "bg-danger-500/10 text-danger-600" },
  cancelled: { label: "Cancelled", className: "bg-neutral-100 text-neutral-500" },
};

interface ApprovalCardProps {
  item: ApprovalItem;
  currentUserRole?: ApproverRole;
  onVote: (itemId: string, role: ApproverRole, status: "approved" | "rejected") => void;
}

export function ApprovalCard({ item, currentUserRole, onVote }: ApprovalCardProps) {
  const approvedCount = item.votes.filter((v) => v.status === "approved").length;
  const badge = outcomeBadge[item.outcome];

  const myVote = currentUserRole ? item.votes.find((v) => v.role === currentUserRole) : undefined;
  const canVote = myVote?.status === "pending" && item.outcome === "awaiting_approval";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">{item.category}</p>
          <h3 className="mt-0.5 text-base font-semibold text-neutral-900">{item.lotTitle}</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Submitted by <span className="font-medium text-neutral-700">{item.submittedBySeller}</span> ·{" "}
            {item.submittedAt}
          </p>
        </div>
        <div className="text-right">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>{badge.label}</span>
          <p className="mt-1.5 text-sm font-semibold text-neutral-900">{item.reservePrice}</p>
          <p className="text-xs text-neutral-500">Reserve price</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {item.votes.map((vote) => (
          <ApproverChip key={vote.role} role={vote.role} name={vote.name} status={vote.status} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
        <p className="text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{approvedCount} of 3</span> approved — needs 2 to proceed
        </p>

        {canVote && currentUserRole ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onVote(item.id, currentUserRole, "rejected")}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onVote(item.id, currentUserRole, "approved")}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
            >
              Approve
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}