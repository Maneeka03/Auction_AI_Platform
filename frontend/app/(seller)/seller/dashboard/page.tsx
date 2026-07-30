"use client";

import { Clock, Gavel, Package, Plus, Radio, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RibbonKpiCard } from "@/components/dashboard/RibbonKpiCard";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { getSellerDashboard, getMyListings } from "@/lib/api/seller";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { RibbonKpi } from "@/types/dashboard";
import type { SellerDashboard } from "@/types/portal";
import type { Property } from "@/types/property";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  published: "bg-green-50 text-green-700",
  sold: "bg-brand-50 text-brand-700",
  rejected: "bg-red-50 text-red-600",
};

const QUICK_LINKS = [
  { label: "Submit Listing", href: "/seller/listings/new", icon: Plus, desc: "Add a new property" },
  { label: "Active Auctions", href: "/seller/auctions", icon: Gavel, desc: "Manage live auctions" },
  { label: "Pending Approval", href: "/seller/pending", icon: Clock, desc: "Track review status" },
  { label: "Request Live Auction", href: "/seller/auctions", icon: Radio, desc: "Go live with a property" },
];

function buildKpis(stats: SellerDashboard): RibbonKpi[] {
  return [
    { label: "Total Listings", value: String(stats.total_listings), changePercent: 0, changeLabel: "all time", accent: "brand" },
    { label: "Active Auctions", value: String(stats.active_auctions), changePercent: 0, changeLabel: "currently live", accent: "sky" },
    { label: "Total Earnings", value: `$${Number(stats.total_earnings).toLocaleString()}`, changePercent: 0, changeLabel: "lifetime revenue", accent: "success" },
    { label: "Pending Payouts", value: `$${Number(stats.pending_payouts).toLocaleString()}`, changePercent: 0, changeLabel: "in escrow", accent: "amber" },
  ];
}

export default function SellerDashboardPage() {
  const { session, accessToken } = useAuth();
  const firstName = session?.full_name.split(" ")[0] ?? "there";

  const [stats, setStats] = useState<SellerDashboard | null>(null);
  const [recentListings, setRecentListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      getSellerDashboard(accessToken),
      getMyListings(accessToken).catch(() => [] as Property[]),
    ])
      .then(([dash, listings]) => {
        setStats(dash);
        setRecentListings(listings.slice(0, 5));
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const pendingCount = recentListings.filter((l) => l.status === "draft").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <WelcomeBanner
        name={firstName}
        message="Manage your listings, track auctions, and monitor your earnings."
        primaryAction={{ label: "Submit Listing", href: "/seller/listings/new" }}
        secondaryAction={{ label: "My Listings", href: "/seller/listings" }}
      />

      {error ? <p className="text-sm text-danger-600">{error}</p> : null}

      {/* KPI Cards */}
      {loading || !stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {buildKpis(stats).map((kpi) => (
            <RibbonKpiCard key={kpi.label} {...kpi} hideChange />
          ))}
        </div>
      )}

      {/* Approval alert */}
      {pendingCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{pendingCount} listing{pendingCount > 1 ? "s" : ""}</span> pending approval from the review panel.
            </p>
          </div>
          <Link href="/seller/pending" className="text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap">
            View →
          </Link>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.href}
                className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 hover:border-brand-300 hover:bg-brand-50 transition-colors"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon size={17} />
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{link.label}</p>
                  <p className="text-xs text-neutral-400">{link.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Listings */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Recent Listings</h2>
          <Link href="/seller/listings" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="h-40 animate-pulse rounded-xl border border-neutral-200 bg-neutral-100" />
        ) : recentListings.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
            <Package size={28} className="mx-auto mb-2 text-neutral-300" />
            <p className="text-sm text-neutral-500">No listings yet.</p>
            <Link
              href="/seller/listings/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              <Plus size={14} /> Submit your first listing
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-neutral-500">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-500">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-500">Reserve</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentListings.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{p.title}</td>
                    <td className="px-4 py-3 text-neutral-500">{p.category_name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">
                      ${Number(p.reserve_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[p.status] ?? "bg-neutral-100 text-neutral-600"}`}>
                        {p.status === "draft" ? "Pending" : p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Earnings Summary */}
      {stats && (Number(stats.total_earnings) > 0 || Number(stats.pending_payouts) > 0) && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Earnings Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <TrendingUp size={18} />
                </span>
                <div>
                  <p className="text-xs text-neutral-500">Total Earned</p>
                  <p className="text-xl font-semibold text-neutral-900">
                    ${Number(stats.total_earnings).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Wallet size={18} />
                </span>
                <div>
                  <p className="text-xs text-neutral-500">Pending Payouts</p>
                  <p className="text-xl font-semibold text-neutral-900">
                    ${Number(stats.pending_payouts).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
