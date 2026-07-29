"use client";

import { Mail, MessageSquare, Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Campaign, CampaignChannel } from "@/types/campaign";
import CampaignStatusBadge from "./CampaignStatusBadge";

interface CampaignDetailsDrawerProps {
  campaign: Campaign;
  onClose: () => void;
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

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "—";
}

/** Read-only slide-in panel showing full details for a campaign. */
export function CampaignDetailsDrawer({ campaign, onClose }: CampaignDetailsDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  const ChannelIcon = CHANNEL_ICON[campaign.channel];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div
        className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${isVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h2 className="text-lg font-semibold text-neutral-900">Campaign Details</h2>
          <button type="button" onClick={handleClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
              <ChannelIcon size={18} />
            </span>
            <div>
              <p className="font-medium text-neutral-900">{campaign.name}</p>
              {campaign.subject ? <p className="text-sm text-neutral-500">{campaign.subject}</p> : null}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3.5 py-3">
              <span className="text-sm text-neutral-500">Status</span>
              <CampaignStatusBadge status={campaign.status} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3.5 py-3">
              <span className="text-sm text-neutral-500">Channel</span>
              <span className="text-sm font-medium text-neutral-800">{CHANNEL_LABEL[campaign.channel]}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3.5 py-3">
              <span className="text-sm text-neutral-500">Audience</span>
              <span className="text-sm font-medium text-neutral-800">{campaign.audience ?? "—"}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3.5 py-3">
              <span className="text-sm text-neutral-500">Scheduled</span>
              <span className="text-sm font-medium text-neutral-800">{formatDateTime(campaign.scheduled_at)}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3.5 py-3">
              <span className="text-sm text-neutral-500">Sent</span>
              <span className="text-sm font-medium text-neutral-800">{formatDateTime(campaign.sent_at)}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3.5 py-3">
              <span className="text-sm text-neutral-500">Created</span>
              <span className="text-sm font-medium text-neutral-800">{formatDateTime(campaign.created_at)}</span>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-neutral-800">Message</p>
              <div className="whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-sm text-neutral-700">
                {campaign.body}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-100 p-5">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}