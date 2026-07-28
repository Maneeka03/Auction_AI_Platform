"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { RibbonKpiCard } from "@/components/dashboard/RibbonKpiCard";
import { getRevenue } from "@/lib/api/reports";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { RevenueStats } from "@/types/report";

function formatUSD(value: string | number): string {
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

export default function RevenuePage() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      setStats(await getRevenue(accessToken));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load revenue data.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const chartData = (stats?.monthly ?? []).map((point) => ({
    month: monthLabel(point.month),
    amount: Math.round(Number(point.amount)),
  }));

  const chartMax = chartData.length
    ? Math.ceil(Math.max(...chartData.map((d) => d.amount)) * 1.2)
    : 100;

  return (
    <AdminShell>
      <RequirePermission module="reports" need="view">
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Revenue</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Combined proceeds from auction awards and direct Buy Now sales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchStats()}
              aria-label="Refresh"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading revenue data...</p>
          ) : error ? (
            <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-600">{error}</p>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <RibbonKpiCard
                  label="Total Revenue"
                  value={formatUSD(stats.total_revenue)}
                  changePercent={0}
                  changeLabel="All-time combined revenue"
                  accent="success"
                  hideChange
                />
                <RibbonKpiCard
                  label="Auction Revenue"
                  value={formatUSD(stats.auction_revenue)}
                  changePercent={0}
                  changeLabel="From awarded auctions"
                  accent="brand"
                  hideChange
                />
                <RibbonKpiCard
                  label="Direct Sales"
                  value={formatUSD(stats.direct_sales_revenue)}
                  changePercent={0}
                  changeLabel="From Buy Now purchases"
                  accent="sky"
                  hideChange
                />
                <RibbonKpiCard
                  label="Total Sales"
                  value={String(stats.sales_count)}
                  changePercent={0}
                  changeLabel="Properties sold"
                  accent="amber"
                  hideChange
                />
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <div className="mb-4 border-b border-neutral-100 pb-4">
                  <h3 className="text-base font-semibold text-neutral-900">Monthly Revenue</h3>
                  <p className="mt-0.5 text-xs text-neutral-500">Last 6 months — auction + direct sales combined</p>
                </div>

                {chartData.length === 0 ? (
                  <p className="py-10 text-center text-sm text-neutral-400">No revenue recorded yet.</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: "var(--color-neutral-500)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, chartMax]}
                          tick={{ fontSize: 11, fill: "var(--color-neutral-500)" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) =>
                            v >= 1_000_000
                              ? `$${(v / 1_000_000).toFixed(1)}M`
                              : v >= 1_000
                                ? `$${(v / 1_000).toFixed(0)}k`
                                : `$${v}`
                          }
                        />
                        <Tooltip
                          formatter={(value: number) => [formatUSD(value), "Revenue"]}
                          contentStyle={{
                            borderRadius: 8,
                            borderColor: "var(--color-neutral-200)",
                            fontSize: 13,
                          }}
                          cursor={{ fill: "var(--color-neutral-100)" }}
                        />
                        <Bar
                          dataKey="amount"
                          fill="var(--color-brand-500)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </RequirePermission>
    </AdminShell>
  );
}
