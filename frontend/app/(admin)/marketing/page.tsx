"use client";

import { Bell, Mail, MessageSquare, Plus, RefreshCw, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { PropertyRowMenu } from "@/components/properties/PropertyRowMenu";
import { CampaignFormDrawer } from "@/components/marketing/CampaignFormDrawer";
import {
  createCampaign,
  deleteCampaign,
  listCampaigns,
  sendCampaign,
  updateCampaign,
} from "@/lib/api/campaigns";
import { ApiRequestError } from "@/lib/api/client";
import { can } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/session-context";
import type { Campaign, CampaignStatus, CreateCampaignRequest } from "@/types/campaign";

type FilterTab = "all" | CampaignStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "scheduled", label: "Scheduled" },
  { key: "sent", label: "Sent" },
  { key: "archived", label: "Archived" },
];

const channelIcon: Record<string, React.ReactNode> = {
  email: <Mail size={14} className="text-blue-500" />,
  sms: <MessageSquare size={14} className="text-green-500" />,
  push: <Bell size={14} className="text-orange-500" />,
};

const statusStyles: Record<CampaignStatus, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  scheduled: "bg-blue-50 text-blue-700",
  sent: "bg-green-50 text-green-700",
  archived: "bg-neutral-100 text-neutral-400",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CampaignsPage() {
  const { accessToken, session } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const canManage = session ? can(session.permissions, "marketing_campaigns", "full") : false;

  const fetchCampaigns = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listCampaigns(accessToken, {
        page: 1,
        size: 50,
        status: activeTab === "all" ? undefined : activeTab,
      });
      setCampaigns(result.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load campaigns.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeTab]);

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  async function handleCreate(payload: CreateCampaignRequest) {
    if (!accessToken) return;
    await createCampaign(accessToken, payload);
    setShowCreateDrawer(false);
    void fetchCampaigns();
  }

  async function handleSaveEdit(payload: CreateCampaignRequest) {
    if (!accessToken || !editingCampaign) return;
    await updateCampaign(accessToken, editingCampaign.id, payload);
    setEditingCampaign(null);
    void fetchCampaigns();
  }

  async function handleSend(campaign: Campaign) {
    if (!accessToken) return;
    const confirmed = window.confirm(
      `Send "${campaign.name}" now? This will deliver the message to the audience and can't be undone.`,
    );
    if (!confirmed) return;
    setActionError(null);
    try {
      await sendCampaign(accessToken, campaign.id);
      void fetchCampaigns();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to send campaign.");
    }
  }

  async function handleDelete(campaign: Campaign) {
    if (!accessToken) return;
    const confirmed = window.confirm(`Delete "${campaign.name}"? This can't be undone.`);
    if (!confirmed) return;
    setActionError(null);
    try {
      await deleteCampaign(accessToken, campaign.id);
      void fetchCampaigns();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to delete campaign.");
    }
  }

  return (
    <AdminShell>
      <RequirePermission module="marketing_campaigns" need="view">
        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Campaigns</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Create and send marketing campaigns across email, SMS, and push.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void fetchCampaigns()}
                aria-label="Refresh"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
              >
                <RefreshCw size={16} />
              </button>
              {canManage ? (
                <button
                  type="button"
                  onClick={() => setShowCreateDrawer(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  <Plus size={16} /> New Campaign
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-brand-500 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {actionError ? (
            <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-600">{actionError}</p>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Audience</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Scheduled / Sent</th>
                  <th className="w-32 px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                      Loading campaigns...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-danger-600">
                      {error}
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                      No campaigns found.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3 font-medium text-neutral-900">{campaign.name}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 capitalize text-neutral-600">
                          {channelIcon[campaign.channel]}
                          {campaign.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{campaign.audience ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyles[campaign.status]}`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {campaign.sent_at
                          ? formatDate(campaign.sent_at)
                          : formatDate(campaign.scheduled_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (campaign.status === "draft" || campaign.status === "scheduled") ? (
                            <button
                              type="button"
                              onClick={() => void handleSend(campaign)}
                              className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                            >
                              <Send size={12} /> Send
                            </button>
                          ) : null}
                          {canManage ? (
                            <PropertyRowMenu
                              onEdit={() => setEditingCampaign(campaign)}
                              onDelete={() => void handleDelete(campaign)}
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showCreateDrawer ? (
          <CampaignFormDrawer onClose={() => setShowCreateDrawer(false)} onSubmit={handleCreate} />
        ) : null}
        {editingCampaign ? (
          <CampaignFormDrawer
            campaign={editingCampaign}
            onClose={() => setEditingCampaign(null)}
            onSubmit={handleSaveEdit}
          />
        ) : null}
      </RequirePermission>
    </AdminShell>
  );
}
