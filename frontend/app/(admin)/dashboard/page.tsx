"use client";

import { Clock, Gavel, UserPlus } from "lucide-react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { CategoryMixDonut } from "@/components/dashboard/CategoryMixDonut";
import { ListPanel } from "@/components/dashboard/ListPanel";
import { RevenueBarChart } from "@/components/dashboard/RevenueBarChart";
import { RibbonKpiCard } from "@/components/dashboard/RibbonKpiCard";
import { WeeklySignupsChart } from "@/components/dashboard/WeeklySignupsChart";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { useAuth } from "@/lib/auth/session-context";
import {
  auctionsEndingSoon,
  categoryMix,
  monthlyRevenue,
  recentSales,
  recentlyRegistered,
  ribbonKpis,
  weeklySignups,
  welcomeBanner,
} from "@/lib/mock/superAdminDashboard";

export default function SuperAdminDashboardPage() {
  const { session } = useAuth();
  const firstName = session?.full_name.split(" ")[0] ?? "there";

  return (
    <AdminShell>
       <RequirePermission module="reports" need="view">
      <div className="space-y-6 p-6">
        <WelcomeBanner name={firstName} {...welcomeBanner} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ribbonKpis.map((kpi) => (
            <RibbonKpiCard key={kpi.label} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <WeeklySignupsChart data={weeklySignups} changePercent={12.5} />
          <div className="lg:col-span-2">
            <RevenueBarChart data={monthlyRevenue} totalLabel="$400K" changePercent={12} />
          </div>
          <CategoryMixDonut data={categoryMix} />
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ListPanel title="Recent Sales" items={recentSales} viewAllHref="/reports/revenue" icon={Gavel} />
          <ListPanel title="Recently Registered" items={recentlyRegistered} viewAllHref="/crm/buyers" icon={UserPlus} />
          <ListPanel title="Auctions Ending Soon" items={auctionsEndingSoon} viewAllHref="/auctions" icon={Clock} />
        </div>
      </div>
      </RequirePermission>
    </AdminShell>
  );
}