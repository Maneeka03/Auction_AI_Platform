import { Check, Clock, X } from "lucide-react";
import type { ApproverRole, VoteStatus } from "@/types/approval";

const roleLabels: Record<ApproverRole, string> = {
  director: "Director",
  appraiser: "Appraiser",
  legal_finance: "Legal & Finance",
};

const statusStyles: Record<VoteStatus, string> = {
  pending: "bg-neutral-100 text-neutral-500",
  approved: "bg-success-500/10 text-success-500",
  rejected: "bg-danger-500/10 text-danger-600",
};

const statusIcon: Record<VoteStatus, typeof Check> = {
  pending: Clock,
  approved: Check,
  rejected: X,
};

export function ApproverChip({
  role,
  name,
  status,
}: {
  role: ApproverRole;
  name: string;
  status: VoteStatus;
}) {
  const Icon = statusIcon[status];

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${statusStyles[status]}`}>
      <Icon size={14} className="shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium leading-tight">{roleLabels[role]}</p>
        <p className="truncate text-xs leading-tight opacity-80">{name}</p>
      </div>
    </div>
  );
}