"use client";

import { Bookmark, Gavel, MapPin, Package, Search, ShoppingBag, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RibbonKpiCard } from "@/components/dashboard/RibbonKpiCard";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { getBuyerDashboard, getRecommendations } from "@/lib/api/buyer";
import { listProperties } from "@/lib/api/properties";
import { useAuth } from "@/lib/auth/session-context";
import type { RibbonKpi } from "@/types/dashboard";
import type { BuyerDashboard } from "@/types/portal";
import type { Property } from "@/types/property";

const QUICK_LINKS = [
  { label: "Browse Auctions", href: "/live-auctions", icon: Gavel, desc: "Join live auctions now" },
  { label: "My Watchlist", href: "/watchlist", icon: Star, desc: "Track your saved items" },
  { label: "Previous Bids", href: "/bids", icon: Bookmark, desc: "Review your bid history" },
  { label: "Saved Searches", href: "/saved-searches", icon: Search, desc: "Your saved filters" },
];

function buildKpis(stats: BuyerDashboard): RibbonKpi[] {
  return [
    { label: "Active Bids", value: String(stats.active_bids), changePercent: 0, changeLabel: "currently active", accent: "brand" },
    { label: "Watchlist", value: String(stats.watchlist), changePercent: 0, changeLabel: "items saved", accent: "sky" },
    { label: "Auctions Won", value: String(stats.won_auctions), changePercent: 0, changeLabel: "total wins", accent: "success" },
    { label: "Purchases", value: String(stats.purchases), changePercent: 0, changeLabel: "completed", accent: "amber" },
  ];
}

function PropertyCard({ p }: { p: Property }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      {p.image_url ? (
        <img src={p.image_url} alt={p.title} className="h-40 w-full object-cover transition-transform duration-200 group-hover:scale-105" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-neutral-100">
          <Package size={28} className="text-neutral-300" />
        </div>
      )}
      <div className="p-4">
        <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
          {p.category_name}
        </span>
        <p className="mt-1.5 truncate text-sm font-semibold text-neutral-900">{p.title}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-400">
          <MapPin size={11} /> {p.address}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-bold text-brand-600">
            ${Number(p.reserve_price).toLocaleString()}
          </p>
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            Live
          </span>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="h-40 bg-neutral-100" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-16 rounded bg-neutral-100" />
        <div className="h-4 w-3/4 rounded bg-neutral-100" />
        <div className="h-3 w-1/2 rounded bg-neutral-100" />
        <div className="flex justify-between pt-1">
          <div className="h-4 w-20 rounded bg-neutral-100" />
          <div className="h-4 w-10 rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

export default function BuyerHomePage() {
  const { session, accessToken } = useAuth();
  const firstName = session?.full_name.split(" ")[0] ?? "there";

  const [stats, setStats] = useState<BuyerDashboard | null>(null);
  const [newListings, setNewListings] = useState<Property[]>([]);
  const [recommendations, setRecommendations] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      getBuyerDashboard(accessToken),
      listProperties(accessToken, { status: "published", size: 6 }),
      getRecommendations(accessToken, 6).catch(() => [] as Property[]),
    ])
      .then(([dash, page, recs]) => {
        setStats(dash);
        setNewListings(page.items);
        setRecommendations(recs);
      })
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <WelcomeBanner
        name={firstName}
        message="Discover auctions, track your bids, and win your next asset."
        primaryAction={{ label: "Browse Auctions", href: "/live-auctions" }}
        secondaryAction={{ label: "My Watchlist", href: "/watchlist" }}
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

      {/* Quick Links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50"
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

      {/* New Listings */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">New Listings</h2>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              Just Added
            </span>
          </div>
          <Link href="/properties" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            Browse all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : newListings.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
            <Package size={28} className="mx-auto mb-2 text-neutral-300" />
            <p className="text-sm text-neutral-500">No published listings yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {newListings.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </div>

      {/* Recommended */}
      {recommendations.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Recommended for You</h2>
              <Sparkles size={14} className="text-brand-400" />
            </div>
            <Link href="/recommendations" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        </div>
      )}

      {!loading && stats?.active_bids === 0 && stats?.purchases === 0 && newListings.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
          <ShoppingBag size={32} className="mx-auto mb-3 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-600">Your dashboard is empty</p>
          <p className="mt-1 text-xs text-neutral-400">Start by browsing live auctions and placing your first bid.</p>
          <Link
            href="/live-auctions"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Gavel size={15} /> Browse Auctions
          </Link>
        </div>
      )}
    </div>
  );
}
