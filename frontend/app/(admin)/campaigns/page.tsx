"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { Pagination } from "@/components/ui/Pagination";
import CampaignStats from "@/components/campaigns/CampaignStats";
import CampaignTable from "@/components/campaigns/CampaignTable";
import { CampaignFilters } from "@/components/campaigns/CampaignFilters";
import { EMPTY_CAMPAIGN_FILTERS, type CampaignFilters as CampaignFilterValues } from "@/components/campaigns/CampaignFilterDropdown";
import { AddCampaignDrawer } from "@/components/campaigns/AddCampaignDrawer";
import { CampaignDetailsDrawer } from "@/components/campaigns/CampaignDetailsDrawer";
import type { SortOrder } from "@/components/crm/SortByDropdown";
import { createCampaign, deleteCampaign, listCampaigns, sendCampaign, updateCampaign } from "@/lib/api/campaigns";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { can } from "@/lib/auth/permissions";
import { isWithinRange, type DateRange } from "@/lib/utils/dateRangePresets";
import type { Campaign } from "@/types/campaign";

type DrawerState = { mode: "create" } | { mode: "edit"; campaign: Campaign } | null;

const PAGE_SIZE = 10;

export default function CampaignsPage() {
  const { accessToken, session } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [filters, setFilters] = useState<CampaignFilterValues>(EMPTY_CAMPAIGN_FILTERS);

  const canManage = session ? can(session.permissions, "marketing_campaigns", "full") : false;

  // Fetch everything once — sorting/filtering/pagination below happen client-side, same as Leads.
  const fetchCampaigns = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listCampaigns(accessToken, { page: 1, size: 100 });
      setCampaigns(result.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load campaigns.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchCampaigns();
  }, [fetchCampaigns]);

  const visibleCampaigns = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = campaigns.filter((campaign) => {
      const matchesSearch =
        !query ||
        campaign.name.toLowerCase().includes(query) ||
        (campaign.subject?.toLowerCase().includes(query) ?? false) ||
        (campaign.audience?.toLowerCase().includes(query) ?? false);

      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(campaign.status);
      const matchesChannel = filters.channels.length === 0 || filters.channels.includes(campaign.channel);
      const matchesDate = isWithinRange(campaign.created_at, dateRange);

      return matchesSearch && matchesStatus && matchesChannel && matchesDate;
    });

    result = [...result].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

    return result;
  }, [campaigns, search, filters, dateRange, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [search, filters, dateRange, sortOrder]);

  const pagedCampaigns = useMemo(
    () => visibleCampaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visibleCampaigns, page],
  );

  async function handleSubmit(values: {
    name: string;
    channel: Campaign["channel"];
    audience: string;
    subject: string;
    body: string;
    scheduledAt: string;
  }) {
    if (!accessToken || !drawer) return;
    const payload = {
      name: values.name,
      channel: values.channel,
      body: values.body,
      subject: values.subject || null,
      audience: values.audience || null,
      scheduled_at: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
    };

    if (drawer.mode === "create") {
      await createCampaign(accessToken, payload);
    } else {
      await updateCampaign(accessToken, drawer.campaign.id, payload);
    }
    toast.success(drawer.mode === "create" ? "Campaign created successfully" : "Campaign updated successfully");

    setDrawer(null);
    void fetchCampaigns();
  }

  async function handleSend(campaign: Campaign) {
    if (!accessToken) return;
    const confirmed = await Swal.fire({ title: "Send campaign?", text: `"${campaign.name}" will be sent now and this cannot be undone.`, icon: "warning", showCancelButton: true, confirmButtonText: "Send", cancelButtonText: "Cancel" });
    if (!confirmed.isConfirmed) return;

    setActionError(null);
    try {
      await sendCampaign(accessToken, campaign.id);
      toast.success("Campaign sent successfully");
      void fetchCampaigns();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to send campaign.");
    }
  }

  async function handleDelete(campaign: Campaign) {
    if (!accessToken) return;
    const confirmed = await Swal.fire({ title: "Delete campaign?", text: `"${campaign.name}" will be permanently deleted.`, icon: "warning", showCancelButton: true, confirmButtonText: "Delete", cancelButtonText: "Cancel" });
    if (!confirmed.isConfirmed) return;

    setActionError(null);
    try {
      await deleteCampaign(accessToken, campaign.id);
      toast.success("Campaign deleted successfully");
      void fetchCampaigns();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to delete campaign.");
    }
  }

  return (
    <AdminShell>
      <RequirePermission module="marketing_campaigns" need="view">
        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Campaigns</h1>
              <p className="mt-1 text-sm text-neutral-600">Create, schedule and manage marketing campaigns.</p>
            </div>
            <div className="flex flex-wrap gap-2">
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
                  onClick={() => setDrawer({ mode: "create" })}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  <Plus size={16} /> New Campaign
                </button>
              ) : null}
            </div>
          </div>

          <CampaignStats campaigns={campaigns} />

          <CampaignFilters
            search={search}
            onSearchChange={setSearch}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {actionError ? (
            <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-600">{actionError}</p>
          ) : null}

          <CampaignTable
            campaigns={pagedCampaigns}
            isLoading={isLoading}
            error={error}
            canManage={canManage}
            onView={setViewingCampaign}
            onEdit={(campaign) => setDrawer({ mode: "edit", campaign })}
            onSend={handleSend}
            onDelete={handleDelete}
          />

          <Pagination
            page={page}
            total={visibleCampaigns.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="campaign"
          />
        </div>

        {drawer ? (
          <AddCampaignDrawer
            campaign={drawer.mode === "edit" ? drawer.campaign : undefined}
            onClose={() => setDrawer(null)}
            onSubmit={handleSubmit}
          />
        ) : null}

        {viewingCampaign ? (
          <CampaignDetailsDrawer campaign={viewingCampaign} onClose={() => setViewingCampaign(null)} />
        ) : null}
      </RequirePermission>
    </AdminShell>
  );
}
