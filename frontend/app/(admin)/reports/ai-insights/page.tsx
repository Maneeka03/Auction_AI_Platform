"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { getAiInsights } from "@/lib/api/reports";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { mockAiInsights } from "@/lib/mock/aiInsights";
import type { AiInsights } from "@/types/report";

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-xl font-semibold text-neutral-900">{value}</p>
      <p className="mt-0.5 text-sm text-neutral-500">{label}</p>
    </div>
  );
}

export default function AiInsightsPage() {
  const { accessToken } = useAuth();
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    getAiInsights(accessToken)
      .then(setInsights)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const isSparse =
  !insights ||
  Number.isNaN(Number(insights.total_revenue)) ||
  insights.buyer_count == null ||
  (Number(insights.total_revenue) === 0 && insights.active_auctions === 0);
  
  const displayInsights = isSparse ? mockAiInsights : insights;

  return (
    <AdminShell>
      <RequirePermission module="ai_configuration" need="view">
        <div className="space-y-6 p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-brand-500" />
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">AI Insights</h1>
              <p className="mt-0.5 text-sm text-neutral-500">Platform-wide intelligence summary.</p>
            </div>
          </div>

          {error ? <p className="text-sm text-danger-600">{error}</p> : null}

          {isSparse && !loading ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              Showing sample data — live figures will appear here once there's real auction activity.
            </div>
          ) : null}

          {loading ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <KpiCard label="Total Revenue" value={`$${Number(displayInsights.total_revenue).toLocaleString()}`} />
                <KpiCard label="Avg Auction Value" value={`$${Number(displayInsights.avg_auction_value).toLocaleString()}`} />
                <KpiCard label="Top Category" value={displayInsights.top_category} />
                <KpiCard label="Active Buyers" value={String(displayInsights.buyer_count)} />
                <KpiCard label="Active Sellers" value={String(displayInsights.seller_count)} />
                <KpiCard label="Live Auctions" value={String(displayInsights.active_auctions)} />
              </div>
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">Summary</p>
                <p className="text-sm leading-relaxed text-neutral-800">{displayInsights.summary}</p>
              </div>
            </>
          )}
        </div>
      </RequirePermission>
    </AdminShell>
  );
}