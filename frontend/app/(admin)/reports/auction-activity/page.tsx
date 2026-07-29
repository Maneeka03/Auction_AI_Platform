"use client";

import { ActivityHeader } from "@/components/auction-activity/activity-header";
import { SummaryCards } from "@/components/auction-activity/summary-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { AuctionSummary } from "@/components/auction-activity/AuctionSummary";
import { LiveAuctionsTable } from "@/components/auction-activity/LiveAuctionsTable";

export default function AuctionActivityPage() {
  return (
    <AdminShell>
      <RequirePermission module="reports" need="view">
        <div className="space-y-6 p-6">
          <ActivityHeader />
          <SummaryCards />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Live Activity Feed</CardTitle>
              </CardHeader>
              <CardContent className="h-[450px] flex items-center justify-center text-muted-foreground">
                Coming Soon
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Auctions</CardTitle>
              </CardHeader>
              <CardContent className="h-[450px] flex items-center justify-center text-muted-foreground">
                Coming Soon
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Bid History</CardTitle>
            </CardHeader>

            <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
              Coming Soon
            </CardContent>
          </Card>
        </div>
        <LiveAuctionsTable />
      </RequirePermission>
    </AdminShell>
  );
}
