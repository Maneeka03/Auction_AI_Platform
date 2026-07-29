"use client";

import { Bell, Mail, MessageSquare } from "lucide-react";
import type { Campaign, CampaignChannel } from "@/types/campaign";
import CampaignStatusBadge from "./CampaignStatusBadge";
import { CampaignRowMenu } from "./CampaignRowMenu";

interface CampaignTableProps {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  canManage: boolean;
  onView: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
  onSend: (campaign: Campaign) => void;
  onDelete: (campaign: Campaign) => void;
}

const CHANNEL_ICON: Record<CampaignChannel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  push: Bell,
};

const CHANNEL_LABEL: Record<CampaignChannel, string> = {
  email: "Email",
  sms: "SMS",
  push: "Push",
};

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function CampaignTable({
  campaigns,
  isLoading,
  error,
  canManage,
  onView,
  onEdit,
  onSend,
  onDelete,
}: CampaignTableProps) {
  const columnCount = 7;

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <th className="px-4 py-3 font-medium">Campaign</th>
            <th className="px-4 py-3 font-medium">Channel</th>
            <th className="px-4 py-3 font-medium">Audience</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Scheduled</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="w-16 px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columnCount} className="px-4 py-8 text-center text-neutral-500">
                Loading campaigns...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columnCount} className="px-4 py-8 text-center text-danger-600">
                {error}
              </td>
            </tr>
          ) : campaigns.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="px-4 py-8 text-center text-neutral-500">
                No campaigns match these filters.
              </td>
            </tr>
          ) : (
            campaigns.map((campaign) => {
              const ChannelIcon = CHANNEL_ICON[campaign.channel];
              return (
                <tr key={campaign.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{campaign.name}</p>
                    {campaign.subject ? <p className="text-xs text-neutral-500">{campaign.subject}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-neutral-600">
                      <ChannelIcon size={14} className="text-neutral-400" />
                      {CHANNEL_LABEL[campaign.channel]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{campaign.audience ?? "—"}</td>
                  <td className="px-4 py-3">
                    <CampaignStatusBadge status={campaign.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(campaign.scheduled_at)}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(campaign.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">
                      <CampaignRowMenu
                        onView={() => onView(campaign)}
                        onEdit={canManage && campaign.status !== "sent" ? () => onEdit(campaign) : undefined}
                        onSend={canManage && campaign.status !== "sent" ? () => onSend(campaign) : undefined}
                        onDelete={canManage ? () => onDelete(campaign) : undefined}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}