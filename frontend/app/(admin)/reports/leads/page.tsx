"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { RibbonKpiCard } from "@/components/dashboard/RibbonKpiCard";
import { listLeads } from "@/lib/api/crm";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Lead, LeadStatus } from "@/types/crm";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  won: "Won",
  lost: "Lost",
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-sky-50 text-sky-700",
  contacted: "bg-amber-50 text-amber-700",
  qualified: "bg-violet-50 text-violet-700",
  won: "bg-green-50 text-green-700",
  lost: "bg-neutral-100 text-neutral-600",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function LeadReportPage() {
  const { accessToken } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      try {
        const firstPage = await listLeads(accessToken, { page: 1, size: 100 });
        const pages = Math.ceil(firstPage.total / firstPage.size);
        const rest = await Promise.all(
          Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
            listLeads(accessToken, { page: index + 2, size: firstPage.size }),
          ),
        );
        setLeads([...firstPage.items, ...rest.flatMap((page) => page.items)]);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Failed to load lead report.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [accessToken]);

  const statusData = useMemo(() => {
    const counts = new Map<LeadStatus, number>();
    leads.forEach((lead) => counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1));
    return (Object.keys(STATUS_LABELS) as LeadStatus[]).map((status) => ({
      status: STATUS_LABELS[status],
      count: counts.get(status) ?? 0,
    }));
  }, [leads]);

  const sourceData = useMemo(() => {
    const counts = new Map<string, number>();
    leads.forEach((lead) => {
      const source = lead.source?.trim() || "Unspecified";
      counts.set(source, (counts.get(source) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [leads]);

  const qualified = leads.filter((lead) => lead.status === "qualified").length;
  const won = leads.filter((lead) => lead.status === "won").length;
  const conversionRate = leads.length ? Math.round((won / leads.length) * 100) : 0;

  return (
    <AdminShell>
      <RequirePermission module="reports" need="view">
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Lead Reports</h1>
            <p className="text-sm text-neutral-500">Track lead sources, pipeline stages, and conversion performance.</p>
          </div>

          {error ? <p className="text-sm text-danger-600">{error}</p> : null}

          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading lead report...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <RibbonKpiCard label="Total Leads" value={leads.length.toLocaleString()} changePercent={0} changeLabel="all recorded leads" accent="brand" hideChange />
                <RibbonKpiCard label="Qualified Leads" value={qualified.toLocaleString()} changePercent={0} changeLabel="ready for follow-up" accent="sky" hideChange />
                <RibbonKpiCard label="Won Leads" value={won.toLocaleString()} changePercent={0} changeLabel="converted opportunities" accent="success" hideChange />
                <RibbonKpiCard label="Conversion Rate" value={`${conversionRate}%`} changePercent={0} changeLabel="won out of all leads" accent="amber" hideChange />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <ReportChart title="Leads by Status" data={statusData} dataKey="status" />
                <ReportChart title="Leads by Source" data={sourceData} dataKey="source" />
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white">
                <div className="border-b border-neutral-100 px-5 py-4">
                  <h2 className="text-base font-semibold text-neutral-900">Lead Data</h2>
                  <p className="mt-1 text-sm text-neutral-500">Scroll to review all available leads.</p>
                </div>
                <div className="max-h-[30rem] overflow-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="sticky top-0 bg-white shadow-[0_1px_0_var(--color-neutral-100)]">
                      <tr className="text-xs uppercase tracking-wide text-neutral-500">
                        <th className="px-5 py-3 font-medium">Lead</th><th className="px-5 py-3 font-medium">Company</th><th className="px-5 py-3 font-medium">Source</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id} className="border-t border-neutral-100">
                          <td className="px-5 py-3"><p className="font-medium text-neutral-900">{lead.name}</p><p className="text-xs text-neutral-500">{lead.email ?? lead.phone ?? "—"}</p></td>
                          <td className="px-5 py-3 text-neutral-700">{lead.company_name ?? "—"}</td>
                          <td className="px-5 py-3 text-neutral-700">{lead.source ?? "Unspecified"}</td>
                          <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[lead.status]}`}>{STATUS_LABELS[lead.status]}</span></td>
                          <td className="px-5 py-3 text-neutral-700">{formatDate(lead.created_at)}</td>
                        </tr>
                      ))}
                      {leads.length === 0 ? <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-500">No leads recorded yet.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </RequirePermission>
    </AdminShell>
  );
}

function ReportChart({ title, data, dataKey }: { title: string; data: { count: number; [key: string]: string | number }[]; dataKey: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-neutral-100)" />
            <XAxis dataKey={dataKey} tick={{ fontSize: 11, fill: "var(--color-neutral-500)" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-neutral-500)" }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "var(--color-neutral-100)" }} contentStyle={{ borderRadius: 8, borderColor: "var(--color-neutral-200)", fontSize: 13 }} />
            <Bar dataKey="count" name="Leads" fill="var(--color-brand-500)" radius={[6, 6, 0, 0]} maxBarSize={46} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
