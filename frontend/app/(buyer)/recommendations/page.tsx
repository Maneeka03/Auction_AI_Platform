"use client";

import { Clock, Gavel, MapPin, Package, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentModal } from "@/components/properties/PaymentModal";
import { listAuctions } from "@/lib/api/auctions";
import { getProperty, listProperties } from "@/lib/api/properties";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import { useAuth } from "@/lib/auth/session-context";
import type { Auction } from "@/types/auction";
import type { Property } from "@/types/property";


function markViewed(id: string, categoryId: string) {
  try {
    const prev: string[] = JSON.parse(localStorage.getItem("provenix_viewed") ?? "[]");
    const updated = [id, ...prev.filter((v) => v !== id)].slice(0, 100);
    localStorage.setItem("provenix_viewed", JSON.stringify(updated));
    localStorage.setItem("provenix_last_category", categoryId);
  } catch {}
}

function readViewed(): string[] {
  try {
    return JSON.parse(localStorage.getItem("provenix_viewed") ?? "[]");
  } catch {
    return [];
  }
}

function readLastCategory(): string {
  try {
    return localStorage.getItem("provenix_last_category") ?? "";
  } catch {
    return "";
  }
}

// Sort items: last-viewed category first, then previously-clicked items, then rest.
function prioritize<T extends { id: string; category_id: string }>(
  items: T[],
  viewedIds: string[],
  lastCategoryId: string,
): T[] {
  return [...items].sort((a, b) => {
    const aCat = lastCategoryId && a.category_id === lastCategoryId ? 0 : 1;
    const bCat = lastCategoryId && b.category_id === lastCategoryId ? 0 : 1;
    if (aCat !== bCat) return aCat - bCat;
    const ai = viewedIds.indexOf(a.id);
    const bi = viewedIds.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function LiveAuctionCard({ a }: { a: Auction }) {
  const imgSrc = resolveMinioUrl(a.image_url);
  const currentPrice = a.current_bid ?? a.opening_bid;
  return (
    <div className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/live-auctions/${a.id}`} className="block" onClick={() => markViewed(a.id, a.category_id)}>
        <div className="relative h-44 w-full bg-white">
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
        <div className="p-4 pb-3">
          <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
            {a.category_name}
          </span>
          <p className="mt-1.5 truncate text-sm font-semibold text-neutral-900">{a.title}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-400">
            <MapPin size={11} /> {a.address}
          </p>
          <div className="mt-2">
            <p className="text-xs text-neutral-400">Current bid</p>
            <p className="text-sm font-bold text-brand-600">${Number(currentPrice).toLocaleString()}</p>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Link
          href={`/live-auctions/${a.id}`}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-500 py-2 text-sm font-semibold text-white hover:bg-green-600"
        >
          <Gavel size={14} /> Bid Now
        </Link>
      </div>
    </div>
  );
}

function UpcomingAuctionCard({ a }: { a: Auction }) {
  const imgSrc = resolveMinioUrl(a.image_url);
  return (
    <div className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <div className="relative h-44 w-full bg-white">
        {imgSrc ? (
          <Image src={imgSrc} alt={a.title} fill className="object-contain transition-transform duration-200 group-hover:scale-105" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package size={28} className="text-neutral-300" />
          </div>
        )}
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
          <Clock size={10} /> Upcoming
        </span>
      </div>
      <div className="p-4 pb-3">
        <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
          {a.category_name}
        </span>
        <p className="mt-1.5 truncate text-sm font-semibold text-neutral-900">{a.title}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-400">
          <MapPin size={11} /> {a.address}
        </p>
        <div className="mt-2">
          <p className="text-xs text-neutral-400">Starting bid</p>
          <p className="text-sm font-bold text-neutral-700">${Number(a.opening_bid).toLocaleString()}</p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white cursor-not-allowed opacity-80"
        >
          <Clock size={14} /> Upcoming Auction
        </button>
      </div>
    </div>
  );
}

function ListingCard({ p, onBuyNow }: { p: Property; onBuyNow: (p: Property) => void }) {
  const imgSrc = resolveMinioUrl(p.image_url);
  return (
    <div className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/properties/${p.id}`} className="block" onClick={() => markViewed(p.id, p.category_id)}>
        <div className="relative h-44 w-full bg-white">
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
        <div className="p-4 pb-3">
          <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
            {p.category_name}
          </span>
          <p className="mt-1.5 truncate text-sm font-semibold text-neutral-900">{p.title}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-400">
            <MapPin size={11} /> {p.address}
          </p>
          <div className="mt-2">
            <p className="text-xs text-neutral-400">Reserve price</p>
            <p className="text-sm font-bold text-brand-600">${Number(p.reserve_price).toLocaleString()}</p>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => onBuyNow(p)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <ShoppingBag size={14} /> Buy Now
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="h-44 bg-neutral-100" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-16 rounded bg-neutral-100" />
        <div className="h-4 w-3/4 rounded bg-neutral-100" />
        <div className="h-3 w-1/2 rounded bg-neutral-100" />
        <div className="mt-2 h-8 rounded bg-neutral-100" />
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [liveAuctions, setLiveAuctions] = useState<Auction[]>([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState<Auction[]>([]);
  const [listings, setListings] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<Property | null>(null);
  const [viewedIds, setViewedIds] = useState<string[]>([]);
  const [lastCategoryId, setLastCategoryId] = useState("");

  // Read last-clicked order and last category from localStorage on mount.
  useEffect(() => {
    setViewedIds(readViewed());
    setLastCategoryId(readLastCategory());
  }, []);

  // Auto-open PaymentModal when redirected from landing page with ?buy=<id>
  useEffect(() => {
    const buyId = searchParams.get("buy");
    if (!buyId || !accessToken) return;
    getProperty(accessToken, buyId)
      .then((property) => {
        setPurchasing(property);
        router.replace("/recommendations", { scroll: false });
      })
      .catch(() => {});
  }, [accessToken, searchParams, router]);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    Promise.all([
      listAuctions(accessToken, { status: "live", size: 100 }),
      listAuctions(accessToken, { status: "upcoming", size: 100 }),
      listProperties(accessToken, { status: "published", size: 100 }),
    ])
      .then(([livePage, upcomingPage, propsPage]) => {
        setLiveAuctions(livePage.items);
        setUpcomingAuctions(upcomingPage.items);
        setListings(propsPage.items);
      })
      .catch(() => setError("Failed to load properties."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  const totalItems = liveAuctions.length + upcomingAuctions.length + listings.length;

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Recommended Properties &amp; Assets</h1>
            <p className="mt-1 text-sm text-neutral-600">
              All live auctions, upcoming auctions, and listed properties.
            </p>
          </div>
          <div className="flex gap-2">
            {liveAuctions.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                {liveAuctions.length} Live
              </span>
            )}
            {upcomingAuctions.length > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <Clock size={11} /> {upcomingAuctions.length} Upcoming
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="text-sm text-danger-600">{error}</p>
        ) : totalItems === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
            <Package size={28} className="mx-auto mb-2 text-neutral-300" />
            <p className="text-sm text-neutral-500">No active auctions or listings right now.</p>
            <p className="mt-1 text-xs text-neutral-400">Check back soon for new properties.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {prioritize(liveAuctions, viewedIds, lastCategoryId).map((a) => <LiveAuctionCard key={a.id} a={a} />)}
            {prioritize(upcomingAuctions, viewedIds, lastCategoryId).map((a) => <UpcomingAuctionCard key={a.id} a={a} />)}
            {prioritize(listings, viewedIds, lastCategoryId).map((p) => <ListingCard key={p.id} p={p} onBuyNow={setPurchasing} />)}
          </div>
        )}
      </div>

      {purchasing ? (
        <PaymentModal
          property={purchasing}
          onClose={() => setPurchasing(null)}
          onConfirm={() => {
            setPurchasing(null);
            setListings((prev) => prev.filter((p) => p.id !== purchasing.id));
          }}
        />
      ) : null}
    </>
  );
}
