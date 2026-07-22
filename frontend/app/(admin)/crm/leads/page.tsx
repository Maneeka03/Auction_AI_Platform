"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { PropertyRowMenu } from "@/components/properties/PropertyRowMenu";
import { LeadFormDrawer } from "@/components/crm/LeadFormDrawer";
import { createLead, deleteLead, listLeads, updateLead } from "@/lib/api/crm";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { can } from "@/lib/auth/permissions";
import type { Lead, LeadStatus } from "@/types/crm";

type FilterTab = "all" | LeadStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const STATUS_BADGE: Record<LeadStatus, string> = {
  new: "bg-sky-500/10 text-sky-700",
  contacted: "bg-amber-500/10 text-amber-700",
  qualified: "bg-purple-500/10 text-purple-700",
  won: "bg-success-500/10 text-success-500",
  lost: "bg-neutral-100 text-neutral-500",
};

type DrawerState = { mode: "create" } | { mode: "edit"; lead: Lead } | null;

export default function LeadsCrmPage() {
  const { accessToken, session } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const canManage = session ? can(session.permissions, "lead_management", "full") : false;

  const fetchLeads = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listLeads(accessToken, {
        page: 1,
        size: 100,
        status: activeTab === "all" ? undefined : activeTab,
      });
      setLeads(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load leads.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeTab]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  async function handleSubmit(values: {
    name: string;
    email: string;
    phone: string;
    source: string;
    status: LeadStatus;
    notes: string;
  }) {
    if (!accessToken || !drawer) return;
    const payload = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || null,
      source: values.source || null,
      status: values.status,
      notes: values.notes || null,
    };

    if (drawer.mode === "create") {
      await createLead(accessToken, payload);
    } else {
      await updateLead(accessToken, drawer.lead.id, payload);
    }

    setDrawer(null);
    void fetchLeads();
  }

  async function handleDelete(lead: Lead) {
    if (!accessToken) return;
    const confirmed = window.confirm(`Delete lead "${lead.name}"? This can't be undone.`);
    if (!confirmed) return;

    setActionError(null);
    try {
      await deleteLead(accessToken, lead.id);
      void fetchLeads();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to delete lead.");
    }
  }

  return (
    <AdminShell>
      <RequirePermission module="lead_management" need="view">
        <div className="space-y-5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Leads</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {total.toLocaleString()} lead{total === 1 ? "" : "s"} in the pipeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void fetchLeads()}
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
                  <Plus size={16} /> Add Lead
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key ? "bg-brand-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {actionError ? (
            <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-600">{actionError}</p>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  {canManage ? <th className="w-16 px-4 py-3 text-right font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="px-4 py-8 text-center text-neutral-500">
                      Loading leads...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="px-4 py-8 text-center text-danger-600">
                      {error}
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="px-4 py-8 text-center text-neutral-500">
                      No leads in this stage yet.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-neutral-900">{lead.name}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {lead.email ?? "—"}
                        {lead.phone ? <span className="block text-xs text-neutral-400">{lead.phone}</span> : null}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{lead.source ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[lead.status]}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{new Date(lead.updated_at).toLocaleDateString()}</td>
                      {canManage ? (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end">
                            <PropertyRowMenu
                              onEdit={() => setDrawer({ mode: "edit", lead })}
                              onDelete={() => void handleDelete(lead)}
                            />
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {drawer ? (
          <LeadFormDrawer
            lead={drawer.mode === "edit" ? drawer.lead : undefined}
            onClose={() => setDrawer(null)}
            onSubmit={handleSubmit}
          />
        ) : null}
      </RequirePermission>
    </AdminShell>
  );
}