import type { Campaign } from "@/types/campaign";
import { RibbonKpiCard } from "@/components/dashboard/RibbonKpiCard";

interface CampaignStatsProps {
  campaigns: Campaign[];
}

export default function CampaignStats({ campaigns }: CampaignStatsProps) {
  const total = campaigns.length;
  const draft = campaigns.filter((c) => c.status === "draft").length;
  const scheduled = campaigns.filter((c) => c.status === "scheduled").length;
  const sent = campaigns.filter((c) => c.status === "sent").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <RibbonKpiCard label="Campaigns" value={String(total)} changePercent={0} changeLabel="total created" accent="brand" hideChange />
      <RibbonKpiCard label="Draft" value={String(draft)} changePercent={0} changeLabel="not yet scheduled" accent="neutral" hideChange />
      <RibbonKpiCard label="Scheduled" value={String(scheduled)} changePercent={0} changeLabel="queued to send" accent="amber" hideChange />
      <RibbonKpiCard label="Sent" value={String(sent)} changePercent={0} changeLabel="successfully delivered" accent="success" hideChange />
    </div>
  );
}