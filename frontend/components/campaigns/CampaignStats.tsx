import { CalendarClock, CheckCircle2, Megaphone, PenLine } from "lucide-react";
import type { Campaign } from "@/types/campaign";

interface CampaignStatsProps {
  campaigns: Campaign[];
}

const CARDS = [
  { key: "total", title: "Campaigns", icon: Megaphone, iconClass: "bg-brand-500/10 text-brand-600" },
  { key: "draft", title: "Draft", icon: PenLine, iconClass: "bg-neutral-200/60 text-neutral-500" },
  { key: "scheduled", title: "Scheduled", icon: CalendarClock, iconClass: "bg-blue-500/10 text-amber-600" },
  { key: "sent", title: "Sent", icon: CheckCircle2, iconClass: "bg-success-500/10 text-success-500" },
] as const;

export default function CampaignStats({ campaigns }: CampaignStatsProps) {
  const values = {
    total: campaigns.length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    scheduled: campaigns.filter((c) => c.status === "scheduled").length,
    sent: campaigns.filter((c) => c.status === "sent").length,
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.key} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">{card.title}</p>
                <p className="mt-1.5 text-2xl font-semibold text-neutral-900">{values[card.key]}</p>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${card.iconClass}`}>
                <Icon size={18} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}