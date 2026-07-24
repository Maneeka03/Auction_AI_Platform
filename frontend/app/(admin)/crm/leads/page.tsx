"use client";

import { Plus, RefreshCw, Search, StickyNote } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { Pagination } from "@/components/ui/Pagination";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { PropertyRowMenu } from "@/components/properties/PropertyRowMenu";
import { LeadFormDrawer } from "@/components/crm/LeadFormDrawer";
import { LeadBoard } from "@/components/crm/LeadBoard";
import { SortByDropdown, type SortOrder } from "@/components/crm/SortByDropdown";
import { DateRangeDropdown } from "@/components/crm/DateRangeDropdown";
import { LeadFilterDropdown, EMPTY_LEAD_FILTERS, type LeadFilters } from "@/components/crm/LeadFilterDropdown";
import { ViewToggle, type LeadViewMode } from "@/components/crm/ViewToggle";
import { createLead, deleteLead, listLeads, updateLead } from "@/lib/api/crm";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { can } from "@/lib/auth/permissions";
import { isWithinRange, type DateRange } from "@/lib/utils/dateRangePresets";
import type { Lead, LeadStatus } from "@/types/crm";

const STATUS_BADGE: Record<LeadStatus, string> = {
  new: "bg-sky-500/10 text-sky-700",
  contacted: "bg-amber-500/10 text-amber-700",
  qualified: "bg-purple-500/10 text-purple-700",
  won: "bg-success-500/10 text-success-500",
  lost: "bg-neutral-100 text-neutral-500",
};

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type DrawerState = { mode: "create"; initialStatus?: LeadStatus } | { mode: "edit"; lead: Lead } | null;

const PAGE_SIZE = 10;

export default function LeadsCrmPage() {
  const { accessToken, session } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [openNotesFor, setOpenNotesFor] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [filters, setFilters] = useState<LeadFilters>(EMPTY_LEAD_FILTERS);
  const [viewMode, setViewMode] = useState<LeadViewMode>("list");

  const canManage = session ? can(session.permissions, "lead_management", "full") : false;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setOpenNotesFor(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch everything once — all sorting/filtering below happens client-side.
  const fetchLeads = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listLeads(accessToken, { page: 1, size: 100 });
      setLeads(result.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load leads.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const visibleLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = leads.filter((lead) => {
      const matchesSearch =
        !query ||
        lead.name.toLowerCase().includes(query) ||
        (lead.company_name?.toLowerCase().includes(query) ?? false) ||
        (lead.email?.toLowerCase().includes(query) ?? false) ||
        (lead.phone?.toLowerCase().includes(query) ?? false);

      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(lead.status);

      const matchesSource =
        filters.sources.length === 0 || (lead.source ? filters.sources.includes(lead.source) : false);

      const matchesDate = isWithinRange(lead.created_at, dateRange);

      return matchesSearch && matchesStatus && matchesSource && matchesDate;
    });

    result = [...result].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

    return result;
  }, [leads, search, filters, dateRange, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [search, filters, dateRange, sortOrder]);

  const pagedLeads = useMemo(
    () => visibleLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visibleLeads, page],
  );

  // Grows automatically: any source typed on Add Lead shows up here on the next fetch.
  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    for (const lead of leads) {
      if (lead.source) sources.add(lead.source);
    }
    return Array.from(sources).sort();
  }, [leads]);

  async function handleSubmit(values: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    source: string;
    status: LeadStatus;
    notes: string;
  }) {
    if (!accessToken || !drawer) return;
    const payload = {
      name: values.name,
      company_name: values.companyName || null,
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
                {visibleLeads.length.toLocaleString()} of {leads.length.toLocaleString()} lead
                {leads.length === 1 ? "" : "s"} shown.
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

          <div className="flex flex-wrap items-center gap-2">
            <SortByDropdown value={sortOrder} onChange={setSortOrder} />
            <DateRangeDropdown range={dateRange} onChange={setDateRange} />
            <LeadFilterDropdown filters={filters} availableSources={availableSources} onChange={setFilters} />
            <div className="relative ml-auto w-full max-w-xs">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>

          {actionError ? (
            <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-600">{actionError}</p>
          ) : null}

          {viewMode === "kanban" ? (
            isLoading ? (
              <p className="text-sm text-neutral-500">Loading leads...</p>
            ) : error ? (
              <p className="text-sm text-danger-600">{error}</p>
            ) : (
              <LeadBoard
                leads={visibleLeads}
                canManage={canManage}
                onEdit={(lead) => setDrawer({ mode: "edit", lead })}
                onDelete={handleDelete}
                onQuickAdd={(status) => setDrawer({ mode: "create", initialStatus: status })}
              />
            )
          ) : (
            <div ref={tableRef} className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                    <th className="px-4 py-3 font-medium">Lead Name</th>
                    <th className="px-4 py-3 font-medium">Company Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Mobile No.</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    {canManage ? <th className="w-16 px-4 py-3 text-right font-medium">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={canManage ? 8 : 7} className="px-4 py-8 text-center text-neutral-500">
                        Loading leads...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={canManage ? 8 : 7} className="px-4 py-8 text-center text-danger-600">
                        {error}
                      </td>
                    </tr>
                  ) : visibleLeads.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 8 : 7} className="px-4 py-8 text-center text-neutral-500">
                        No leads match these filters.
                      </td>
                    </tr>
                  ) : (
                    pagedLeads.map((lead) => (
                      <tr key={lead.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                              {initialsFromName(lead.name)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-neutral-900">{lead.name}</span>
                              {lead.notes ? (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenNotesFor((prev) => (prev === lead.id ? null : lead.id))}
                                    title={lead.notes}
                                    aria-label={`View notes for ${lead.name}`}
                                    className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                                  >
                                    <StickyNote size={14} />
                                  </button>
                                  {openNotesFor === lead.id ? (
                                    <div className="absolute left-0 top-6 z-20 w-64 rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-600 shadow-lg">
                                      {lead.notes}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-500">{lead.company_name ?? "—"}</td>
                        <td className="px-4 py-3 text-neutral-500">{lead.email ?? "—"}</td>
                        <td className="px-4 py-3 text-neutral-500">{lead.phone ?? "—"}</td>
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
          )}

          {viewMode === "list" ? (
            <Pagination page={page} total={visibleLeads.length} pageSize={PAGE_SIZE} onPageChange={setPage} itemLabel="lead" />
          ) : null}
        </div>

        {drawer ? (
          <LeadFormDrawer
            lead={drawer.mode === "edit" ? drawer.lead : undefined}
            initialStatus={drawer.mode === "create" ? drawer.initialStatus : undefined}
            onClose={() => setDrawer(null)}
            onSubmit={handleSubmit}
          />
        ) : null}
      </RequirePermission>
    </AdminShell>
  );
}