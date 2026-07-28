"use client";

import { Clock, Gavel, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { CategoryMixDonut } from "@/components/dashboard/CategoryMixDonut";
import { ListPanel } from "@/components/dashboard/ListPanel";
import { RevenueBarChart } from "@/components/dashboard/RevenueBarChart";
import { RibbonKpiCard } from "@/components/dashboard/RibbonKpiCard";
import { WeeklySignupsChart } from "@/components/dashboard/WeeklySignupsChart";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { getDashboardStats } from "@/lib/api/reports";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { RevenueSummaryCard } from "@/components/dashboard/RevenueSummaryCard";

import {
  auctionsEndingSoon,
  categoryMix as mockCategoryMix,
  monthlyRevenue as mockMonthlyRevenue,
  recentSales,
  recentlyRegistered,
  ribbonKpis as mockRibbonKpis,
  weeklySignups as mockWeeklySignups,
  welcomeBanner,
} from "@/lib/mock/superAdminDashboard";
import type { DashboardStats } from "@/types/report";

const CATEGORY_COLOR: Record<string, string> = {
  residential: "var(--color-brand-500)",
  commercial: "var(--color-amber-500)",
};

const CATEGORY_LABEL: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
};

export default function SuperAdminDashboardPage() {
  const { session, accessToken } = useAuth();
  const firstName = session?.full_name.split(" ")[0] ?? "there";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getDashboardStats(accessToken)
      .then(setStats)
      .catch((err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Failed to load dashboard.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  const isSparse = true;

  const categoryMixData =
    stats &&
    !isSparse &&
    stats.category_mix.reduce((sum, c) => sum + c.count, 0) > 0
      ? stats.category_mix.map((entry) => {
          const total = stats.category_mix.reduce((sum, c) => sum + c.count, 0);
          return {
            name: CATEGORY_LABEL[entry.category] ?? entry.category,
            percent: Math.round((entry.count / total) * 100),
            color: CATEGORY_COLOR[entry.category] ?? "var(--color-neutral-400)",
          };
        })
      : mockCategoryMix;

  const weeklySignupsData =
    stats && !isSparse
      ? stats.weekly_signups.map((point) => ({
          day: new Date(point.week).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          value: point.count,
        }))
      : mockWeeklySignups;

  const signupsChangePercent =
    weeklySignupsData.length >= 2 && weeklySignupsData[0].value > 0
      ? Math.round(
          ((weeklySignupsData[weeklySignupsData.length - 1].value -
            weeklySignupsData[0].value) /
            weeklySignupsData[0].value) *
            100,
        )
      : 0;

  return (
    <AdminShell>
      <RequirePermission module="reports" need="view">
        <div className="space-y-6 p-6">
          <WelcomeBanner name={firstName} {...welcomeBanner} />

          {error ? <p className="text-sm text-danger-600">{error}</p> : null}

          {isLoading || !stats ? (
            <p className="text-sm text-neutral-500">Loading dashboard...</p>
          ) : (
            <>
              {isSparse ? (
                <p className="text-xs text-neutral-500">
                  Not enough real data yet to look meaningful — showing demo
                  figures below until more activity exists.
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {isSparse ? (
                  mockRibbonKpis.map((kpi) => (
                    <RibbonKpiCard key={kpi.label} {...kpi} />
                  ))
                ) : (
                  <>
                    <RibbonKpiCard
                      label="Total Buyers & Sellers"
                      value={(
                        stats.total_buyers + stats.total_sellers
                      ).toLocaleString()}
                      changePercent={0}
                      changeLabel={`${stats.total_buyers} buyers · ${stats.total_sellers} sellers`}
                      accent="brand"
                      hideChange
                    />
                    <RibbonKpiCard
                      label="Active Auctions"
                      value={stats.active_auctions.toLocaleString()}
                      changePercent={0}
                      changeLabel="live right now"
                      accent="success"
                      hideChange
                    />
                    <RibbonKpiCard
                      label="Total Listings"
                      value={stats.total_listings.toLocaleString()}
                      changePercent={0}
                      changeLabel={`${stats.published_listings} published · ${stats.sold_listings} sold`}
                      accent="amber"
                      hideChange
                    />
                    <RibbonKpiCard
                      label="Pending Approvals"
                      value={stats.pending_approvals.toLocaleString()}
                      changePercent={0}
                      changeLabel="awaiting sign-off"
                      accent="sky"
                      hideChange
                    />
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <WeeklySignupsChart
                  data={weeklySignupsData}
                  changePercent={signupsChangePercent}
                />
                <div className="lg:col-span-2">
                  {isSparse ? (
                    <RevenueBarChart
                      data={mockMonthlyRevenue}
                      totalLabel={`$${(mockMonthlyRevenue.reduce((sum, m) => sum + m.value, 0) * 1000).toLocaleString()}`}
                      changePercent={12}
                    />
                  ) : (
                    <RevenueSummaryCard total={stats.total_revenue} />
                  )}
                </div>
                <CategoryMixDonut data={categoryMixData} />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ListPanel
              title="Recent Sales"
              items={recentSales}
              viewAllHref="/reports/revenue"
              icon={Gavel}
              isDemo
            />
            <ListPanel
              title="Recently Registered"
              items={recentlyRegistered}
              viewAllHref="/crm/buyers"
              icon={UserPlus}
              isDemo
            />
            <ListPanel
              title="Auctions Ending Soon"
              items={auctionsEndingSoon}
              viewAllHref="/auctions"
              icon={Clock}
              isDemo
            />
          </div>
        </div>
      </RequirePermission>
    </AdminShell>
  );
}
