"use client";

import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { RibbonKpiCard } from "@/components/dashboard/RibbonKpiCard";
import { Button } from "@/components/ui/Button";
import { SortByDropdown, type SortOrder } from "@/components/crm/SortByDropdown";
import { DateRangeDropdown } from "@/components/crm/DateRangeDropdown";
import {EMPTY_REVENUE_FILTERS, RevenueFilterDropdown,type RevenueFilters,} from "@/components/reports/RevenueFilterDropdown";
import { getRevenueStats } from "@/lib/api/reports";
import { ApiRequestError } from "@/lib/api/client";
import { can } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/session-context";
import { mockRevenueStats } from "@/lib/mock/revenueReport";
import { isWithinRange, type DateRange } from "@/lib/utils/dateRangePresets";
import { exportToExcel } from "@/lib/utils/exportToExcel";
import type { RevenueStats } from "@/types/report";

function formatCurrency(value: string | number): string {
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatMonth(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export default function RevenueReportPage() {
  const { session, accessToken } = useAuth();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [filters, setFilters] = useState<RevenueFilters>(EMPTY_REVENUE_FILTERS);

  const canDownload = session ? can(session.permissions, "reports", "full") : false;

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getRevenueStats(accessToken)
      .then(setStats)
      .catch((err) =>
        setError(err instanceof ApiRequestError ? err.message : "Failed to load revenue report."),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  const isSparse = !stats || (Number(stats.total_revenue) === 0 && stats.monthly.length === 0);
  const displayStats = isSparse ? mockRevenueStats : stats;

  const visibleMonthly = useMemo(() => {
    let result = displayStats.monthly.filter((point) => {
      const matchesDate = isWithinRange(point.month, dateRange);
      const matchesSource =
        filters.sources.length === 0 ||
        (filters.sources.includes("auction") && Number(point.auction_amount) > 0) ||
        (filters.sources.includes("direct") && Number(point.direct_amount) > 0);
      return matchesDate && matchesSource;
    });

    result = [...result].sort((a, b) => {
      const diff = new Date(a.month).getTime() - new Date(b.month).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });

    return result;
  }, [displayStats, dateRange, filters, sortOrder]);

  // const chartData = useMemo(
  //   () =>
  //     [...visibleMonthly]
  //       .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  //       .map((point) => ({
  //         month: formatMonth(point.month),
  //         amount: Number(point.amount),
  //       })),
  //   [visibleMonthly],
  // );
  const chartData = useMemo(
  () =>
    [...visibleMonthly]
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      // Highlight: Exclude months where the amount is less than $10
      .filter((point) => Number(point.amount) >= 10) 
      .map((point) => ({
        month: formatMonth(point.month),
        amount: Number(point.amount),
      })),
  [visibleMonthly],
);


  function handleDownload() {
    if (!stats) return;

    const rows: Record<string, string | number>[] = [
      {
        Month: "All Time",
        "Auction Revenue": Number(stats.auction_revenue),
        "Direct Sales Revenue": Number(stats.direct_sales_revenue),
        "Total Revenue": Number(stats.total_revenue),
        "Sales Count": stats.sales_count,
      },
      ...stats.monthly.map((point) => ({
        Month: formatMonth(point.month),
        "Auction Revenue": Number(point.auction_amount),
        "Direct Sales Revenue": Number(point.direct_amount),
        "Total Revenue": Number(point.amount),
        "Sales Count": point.sales_count,
      })),
    ];

    exportToExcel(rows, `revenue-report-${new Date().toISOString().slice(0, 10)}`, "Revenue");
  }

  return (
    <AdminShell>
      <RequirePermission module="reports" need="view">
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Revenue</h1>
              <p className="text-sm text-neutral-500">
                Money actually taken across auction awards and direct Buy Now purchases.
              </p>
            </div>
            {canDownload ? (
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={!stats}
                style={{ width: "auto" }}
                className="shrink-0 self-start sm:self-auto"
              >
                <Download size={16} />
                Download Report
              </Button>
            ) : null}
          </div>

          {error ? <p className="text-sm text-danger-600">{error}</p> : null}

          {isLoading || !stats ? (
            <p className="text-sm text-neutral-500">Loading revenue report...</p>
          ) : (
            <>
              {isSparse ? (
                <p className="text-xs text-neutral-500">
                  Not enough real data yet to look meaningful — showing demo figures below until more
                  activity exists.
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <RibbonKpiCard label="Total Revenue" value={formatCurrency(displayStats.total_revenue)} changePercent={0} changeLabel="all time" accent="success" hideChange />
                <RibbonKpiCard label="Auction Revenue" value={formatCurrency(displayStats.auction_revenue)} changePercent={0} changeLabel="from auction awards" accent="brand" hideChange />
                <RibbonKpiCard label="Direct Sales Revenue" value={formatCurrency(displayStats.direct_sales_revenue)} changePercent={0} changeLabel="from buy now" accent="amber" hideChange />
                <RibbonKpiCard label="Sales Count" value={displayStats.sales_count.toLocaleString()} changePercent={0} changeLabel="completed sales" accent="sky" hideChange />
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-5">
                <h3 className="text-base font-semibold text-neutral-900">Monthly Revenue</h3>
                <div className={chartData.length ? "mt-6 h-64" : "mt-6 h-32"}>
                  {chartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--color-neutral-100)" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: "var(--color-neutral-500)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "var(--color-neutral-500)" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value: number) => formatCurrency(value)}
                        />
                        <Tooltip
                          formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
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
                          radius={[8, 8, 0, 0]}
                          maxBarSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="flex h-full items-center justify-center text-sm text-neutral-500">
                      No revenue recorded for the recent months yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-semibold text-neutral-900">Monthly Details</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <SortByDropdown value={sortOrder} onChange={setSortOrder} />
                    <DateRangeDropdown range={dateRange} onChange={setDateRange} />
                    <RevenueFilterDropdown filters={filters} onChange={setFilters} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
                        <th className="px-5 py-3 font-medium">Month</th>
                        <th className="px-5 py-3 font-medium">Auction Revenue</th>
                        <th className="px-5 py-3 font-medium">Direct Sales Revenue</th>
                        <th className="px-5 py-3 font-medium">Total Revenue</th>
                        <th className="px-5 py-3 font-medium">Sales Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleMonthly.length ? (
                        visibleMonthly.map((point) => (
                          <tr key={point.month} className="border-b border-neutral-50 last:border-0">
                            <td className="px-5 py-3 text-neutral-700">{formatMonth(point.month)}</td>
                            <td className="px-5 py-3 text-neutral-700">
                              {formatCurrency(point.auction_amount)}
                            </td>
                            <td className="px-5 py-3 text-neutral-700">
                              {formatCurrency(point.direct_amount)}
                            </td>
                            <td className="px-5 py-3 font-medium text-neutral-900">
                              {formatCurrency(point.amount)}
                            </td>
                            <td className="px-5 py-3 text-neutral-700">{point.sales_count}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-5 py-6 text-center text-neutral-500">
                            {displayStats.monthly.length
                              ? "No months match these filters."
                              : "No monthly data available yet."}
                          </td>
                        </tr>
                      )}
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

