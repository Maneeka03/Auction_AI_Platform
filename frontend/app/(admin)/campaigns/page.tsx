"use client";

import CampaignStats from "@/components/campaigns/CampaignStats";
import CampaignTable from "@/components/campaigns/CampaignTable";
import { mockCampaigns } from "@/components/campaigns/mockCampaigns";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { CampaignFilters } from "@/components/campaigns/CampaignFilters";
import { useState } from "react";

export default function CampaignsPage() {
  const [search, setSearch] = useState("");
const [boardView, setBoardView] = useState(false);
  return (
  <AdminShell>
    <RequirePermission module="marketing_campaigns" need="view">
      <div className="space-y-5 p-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Campaigns
          </h1>

          <p className="text-muted-foreground mt-1">
            Create, schedule and manage marketing campaigns.
          </p>
        </div>

        <button className="rounded-lg bg-primary px-5 py-2.5 text-white">
          + New Campaign
        </button>

      </div>

     <CampaignFilters
  search={search}
  onSearchChange={setSearch}
  boardView={boardView}
  onToggleView={() => setBoardView(!boardView)}
/>
      <CampaignTable campaigns={mockCampaigns} />

    </div>
    </RequirePermission>
  </AdminShell>
  );
}