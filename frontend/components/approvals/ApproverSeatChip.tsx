import { Check, Clock, X } from "lucide-react";
import type { ApproverSeat, PropertyVote } from "@/types/property";

const seatLabels: Record<ApproverSeat, string> = {
  director: "Director",
  appraiser: "Appraiser",
  legal_finance: "Legal & Finance",
};

export function ApproverSeatChip({ seat, vote }: { seat: ApproverSeat; vote: PropertyVote | undefined }) {
  const status: "pending" | "approved" | "rejected" =
    vote === undefined ? "pending" : vote.approved ? "approved" : "rejected";

  const styles: Record<typeof status, string> = {
    pending: "bg-neutral-100 text-neutral-500",
    approved: "bg-success-500/10 text-success-500",
    rejected: "bg-danger-500/10 text-danger-600",
  };

  const Icon = status === "pending" ? Clock : status === "approved" ? Check : X;

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${styles[status]}`}>
      <Icon size={14} className="shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium leading-tight">{seatLabels[seat]}</p>
        <p className="truncate text-xs leading-tight opacity-80">
          {vote ? vote.voter_name : "Awaiting decision"}
        </p>
      </div>
    </div>
  );
}