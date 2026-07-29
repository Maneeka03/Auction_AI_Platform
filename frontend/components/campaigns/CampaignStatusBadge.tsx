import type { CampaignStatus } from "@/types/campaign";

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
}

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sent: "Sent",
  archived: "Archived",
};

const STATUS_STYLE: Record<CampaignStatus, string> = {
  draft: "bg-neutral-100 text-neutral-500",
  scheduled: "bg-amber-500/10 text-amber-700",
  sent: "bg-success-500/10 text-success-500",
  archived: "bg-neutral-100 text-neutral-400",
};

export default function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}