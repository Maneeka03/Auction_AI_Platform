"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { getConversionRates, getMarketingPerformance } from "@/lib/api/reports";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { ConversionRates, MarketingPerformance } from "@/types/report";

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-2xl font-semibold text-neutral-900">{value}</p>
      <p className="mt-0.5 text-sm text-neutral-500">{label}</p>
    </div>
  );
}

function pct(n: number) { return `${(n * 100).toFixed(1)}%`; }

export default function MarketingPage() {
  const { accessToken } = useAuth();
  const [marketing, setMarketing] = useState<MarketingPerformance | null>(null);
  const [conversion, setConversion] = useState<ConversionRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([getMarketingPerformance(accessToken), getConversionRates(accessToken)])
      .then(([m, c]) => { setMarketing(m); setConversion(c); })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <AdminShell>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Marketing Performance</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Campaign results and conversion funnel.</p>
        </div>
        {error ? <p className="text-sm text-danger-600">{error}</p> : null}
        {loading || !marketing || !conversion ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : (
          <>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-neutral-700">Campaigns</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <KpiCard label="Total Campaigns" value={String(marketing.total_campaigns)} />
                <KpiCard label="Sent" value={String(marketing.sent_campaigns)} />
                <KpiCard label="Total Leads" value={String(marketing.total_leads)} />
                <KpiCard label="Converted Leads" value={`${marketing.converted_leads} (${pct(marketing.conversion_rate)})`} />
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-neutral-700">Conversion Funnel</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiCard label="Lead → Buyer" value={pct(conversion.lead_to_buyer)} />
                <KpiCard label="Browse → Bid" value={pct(conversion.browse_to_bid)} />
                <KpiCard label="Bid → Win" value={pct(conversion.bid_to_win)} />
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
