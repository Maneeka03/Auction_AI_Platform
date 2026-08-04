"use client";

import { Bookmark, Gavel, MapPin, Package, Search, ShoppingBag, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RibbonKpiCard } from "@/components/dashboard/RibbonKpiCard";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { listAuctions } from "@/lib/api/auctions";
import { getBuyerDashboard } from "@/lib/api/buyer";
import { listProperties } from "@/lib/api/properties";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import { useAuth } from "@/lib/auth/session-context";
import type { Auction } from "@/types/auction";
import type { RibbonKpi } from "@/types/dashboard";
import type { BuyerDashboard } from "@/types/portal";
import type { Property } from "@/types/property";

const QUICK_LINKS = [
  { label: "Browse Auctions", href: "/browse-auctions", icon: Gavel, desc: "Join live auctions now" },
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

function AuctionCard({ a }: { a: Auction }) {
  const imgSrc = resolveMinioUrl(a.image_url);
  const currentPrice = a.current_bid ?? a.opening_bid;
  return (
    <Link href={`/live-auctions/${a.id}`} className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <div className="relative h-40 w-full bg-white">
        {imgSrc ? (
          <Image src={imgSrc} alt={a.title} fill className="object-contain transition-transform duration-200 group-hover:scale-105" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package size={28} className="text-neutral-300" />
          </div>
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          Live
        </span>
      </div>
      <div className="p-4">
        <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
          {a.category_name}
        </span>
        <p className="mt-1.5 truncate text-sm font-semibold text-neutral-900">{a.title}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-400">
          <MapPin size={11} /> {a.address}
        </p>
        <div className="mt-3">
          <p className="text-xs text-neutral-400">Current bid</p>
          <p className="text-sm font-bold text-brand-600">${Number(currentPrice).toLocaleString()}</p>
        </div>
      </div>
    </Link>
  );
}

function ListingCard({ p }: { p: Property }) {
  const imgSrc = resolveMinioUrl(p.image_url);
  return (
    <Link href={`/properties/${p.id}`} className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <div className="relative h-40 w-full bg-white">
        {imgSrc ? (
          <Image src={imgSrc} alt={p.title} fill className="object-contain transition-transform duration-200 group-hover:scale-105" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package size={28} className="text-neutral-300" />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
          Listed
        </span>
      </div>
      <div className="p-4">
        <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
          {p.category_name}
        </span>
        <p className="mt-1.5 truncate text-sm font-semibold text-neutral-900">{p.title}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-400">
          <MapPin size={11} /> {p.address}
        </p>
        <div className="mt-3">
          <p className="text-xs text-neutral-400">Reserve price</p>
          <p className="text-sm font-bold text-brand-600">${Number(p.reserve_price).toLocaleString()}</p>
        </div>
      </div>
    </Link>
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
        <div className="h-4 w-20 rounded bg-neutral-100 pt-1" />
      </div>
    </div>
  );
}

export default function BuyerHomePage() {
  const { session, accessToken } = useAuth();
  const firstName = session?.full_name.split(" ")[0] ?? "there";

  const [stats, setStats] = useState<BuyerDashboard | null>(null);
  const [liveAuctions, setLiveAuctions] = useState<Auction[]>([]);
  const [publishedListings, setPublishedListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      getBuyerDashboard(accessToken),
      listAuctions(accessToken, { status: "live", size: 3 }),
      listProperties(accessToken, { status: "published", size: 3 }),
    ])
      .then(([dash, auctionsPage, propsPage]) => {
        setStats(dash);
        // Live auctions take priority; fill remaining slots up to 3 with published listings
        const lives = auctionsPage.items.slice(0, 3);
        const remaining = Math.max(0, 3 - lives.length);
        setLiveAuctions(lives);
        setPublishedListings(propsPage.items.slice(0, remaining));
      })
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const totalItems = liveAuctions.length + publishedListings.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <WelcomeBanner
        name={firstName}
        message="Discover auctions, track your bids, and win your next asset."
        primaryAction={{ label: "Browse Auctions", href: "/browse-auctions" }}
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

      {/* Recommended Properties & Assets */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Recommended Properties & Assets
            </h2>
            {liveAuctions.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                {liveAuctions.length} Live
              </span>
            )}
          </div>
          <Link href="/browse-auctions" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            Browse all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : totalItems === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
            <Package size={28} className="mx-auto mb-2 text-neutral-300" />
            <p className="text-sm text-neutral-500">No active auctions or listings right now. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveAuctions.map((a) => <AuctionCard key={a.id} a={a} />)}
            {publishedListings.map((p) => <ListingCard key={p.id} p={p} />)}
          </div>
        )}
      </div>

      {!loading && stats?.active_bids === 0 && stats?.purchases === 0 && totalItems === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
          <ShoppingBag size={32} className="mx-auto mb-3 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-600">Your dashboard is empty</p>
          <p className="mt-1 text-xs text-neutral-400">Start by browsing live auctions and placing your first bid.</p>
          <Link
            href="/browse-auctions"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Gavel size={15} /> Browse Auctions
          </Link>
        </div>
      )}
    </div>
  );
}
