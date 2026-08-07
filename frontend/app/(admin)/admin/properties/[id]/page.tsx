"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Bath, BedDouble, Box, Gavel, Lock, Ruler, ShieldCheck, Tag, TrendingUp, Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { ModelViewer } from "@/components/properties/ModelViewer";
import { getProperty } from "@/lib/api/properties";
import { listPublicAuctions } from "@/lib/api/auctions";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import type { Auction } from "@/types/auction";
import type { Property } from "@/types/property";

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

function formatDate(value: string): string {
  const date = new Date(value);
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st"
    : day % 10 === 2 && day !== 12 ? "nd"
    : day % 10 === 3 && day !== 13 ? "rd"
    : "th";
  return `${day}${suffix} ${date.toLocaleDateString("en-US", { month: "short" })} ${date.getFullYear()}`;
}

function timeRemaining(endsAt: string, now: number): string {
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${mins}m`;
}

export default function AdminPropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [show3d, setShow3d] = useState(false);
  const [relatedAuction, setRelatedAuction] = useState<Auction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const listing = await getProperty(accessToken, params.id);
      setProperty(listing);
      setActiveImage(
        resolveMinioUrl(listing.image_url ?? listing.images?.[0]?.image_url ?? null),
      );
      try {
        const auctionPage = await listPublicAuctions({ size: 50 });
        setRelatedAuction(auctionPage.items.find((a) => a.property_id === listing.id) ?? null);
      } catch {
        setRelatedAuction(null);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load property.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const gallery = property
    ? [property.image_url, ...(property.images?.map((img) => img.image_url) ?? [])]
        .map(resolveMinioUrl)
        .filter((url, i, all): url is string => !!url && all.indexOf(url) === i)
    : [];

  const modelUrl = property ? resolveMinioUrl(property.model_url) : null;

  return (
    <AdminShell>
      {/* Purple hero header */}
      <div className="relative min-h-[130px] overflow-hidden bg-[#ffffff] px-8 py-5">
        {/* <Image
          src="/images/property-detail/hero-bg.png"
          alt=""
          fill
          className="object-contain object-top opacity-40"
          priority
        /> */}
        <div className="relative z-10">
          <Link
            href="/admin/properties"
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition hover:bg-black/35"
          >
            <ArrowLeft size={16} /> Back to Browse Assets
          </Link>
          <h1 className="text-3xl font-bold text-black md:text-2xl">
            {isLoading ? "Loading…" : (property?.title ?? "Property not found")}
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1600px] px-8 py-2">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-96 rounded-2xl bg-neutral-100" />
            <div className="h-8 w-1/2 rounded-lg bg-neutral-100" />
          </div>
        ) : error || !property ? (
          <p className="text-sm text-danger-600">{error ?? "Property not found."}</p>
        ) : (
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
            {/* Left: image gallery + description */}
            <div className="space-y-6">
              <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-neutral-200 md:h-[480px]">
                {show3d && modelUrl ? (
                  <ModelViewer src={modelUrl} className="h-full w-full" />
                ) : activeImage ? (
                  <Image
                    src={activeImage}
                    alt={property.title}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-400">
                    No image available
                  </div>
                )}
                <span className="absolute left-4 top-4 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white capitalize">
                  {property.category_name}
                </span>
              </div>

              {gallery.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {gallery.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => { setShow3d(false); setActiveImage(url); }}
                      className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        activeImage === url
                          ? "border-brand-500"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image src={url} alt="" fill className="object-contain" unoptimized />
                    </button>
                  ))}
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold text-neutral-900">About this property</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-600">
                  {property.description ?? "No description provided."}
                </p>
              </div>
            </div>

            {/* Right: price panel */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8">
              <p className="text-sm text-neutral-500">{property.address}</p>
              <p className="mt-3 text-3xl font-bold text-brand-600">
                {formatMoney(property.reserve_price)}
              </p>

              {/* Feature pills — horizontal single row */}
              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                {property.bedrooms != null && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
                    <BedDouble size={15} /> {property.bedrooms} Beds
                  </span>
                )}
                {property.bathrooms != null && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
                    <Bath size={15} /> {property.bathrooms} Baths
                  </span>
                )}
                {property.area_sqft != null && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
                    <Ruler size={15} /> {property.area_sqft.toLocaleString()} sqft
                  </span>
                )}
                {property.custom_fields &&
                  Object.entries(property.custom_fields).slice(0, 3).map(([key, val]) => (
                    <span
                      key={key}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700"
                    >
                      <Tag size={13} className="shrink-0 text-neutral-400" />
                      <span className="text-neutral-500 text-xs">{key}:</span>
                      <span>{val}</span>
                    </span>
                  ))}
              </div>

              {modelUrl ? (
                <button
                  type="button"
                  onClick={() => setShow3d((v) => !v)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-brand-500 px-6 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-500 hover:text-white"
                >
                  <Box size={16} /> {show3d ? "View in 2D" : "3D View"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border-2 border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-400"
                >
                  <Box size={16} /> 3D View — Coming Soon
                </button>
              )}

              <Link
                href={relatedAuction ? `/auctions/${relatedAuction.id}` : "/auctions"}
                className="mt-3 flex w-full items-center justify-center rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:scale-105"
              >
                Book Now
              </Link>

              {relatedAuction && (
                <div className="mt-8 rounded-2xl border border-neutral-200 p-6">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    <Gavel size={16} className="text-brand-600" /> This property is up for auction
                  </h3>
                  <div className="mt-4 flex items-center gap-6 border-b border-dashed border-neutral-200 pb-4">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-success-500">
                        <TrendingUp size={13} /> Current Bid
                      </p>
                      <p className="mt-0.5 font-semibold text-neutral-900">
                        {formatMoney(relatedAuction.current_bid)}
                      </p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-danger-500">
                        <Tag size={13} /> Reserve
                      </p>
                      <p className="mt-0.5 font-semibold text-neutral-900">
                        {formatMoney(relatedAuction.reserve_price)}
                      </p>
                    </div>
                    <div className="text-xs text-neutral-500">
                      <p className="flex items-center gap-1.5">
                        <Users size={13} /> {relatedAuction.bidder_count} bidder
                        {relatedAuction.bidder_count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  {relatedAuction.status === "live" ? (
                    <>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-danger-600">
                        Bidding ends in
                      </p>
                      <p className="text-lg font-bold text-danger-600">
                        {timeRemaining(relatedAuction.ends_at, now)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-sky-600">
                        Upcoming Auction
                      </p>
                      <p className="text-lg font-bold text-sky-600">
                        Starts On: {formatDate(relatedAuction.starts_at)}
                      </p>
                    </>
                  )}
                  <Link
                    href={`/auctions/${relatedAuction.id}`}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-brand-500 px-6 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-500 hover:text-white"
                  >
                    <Gavel size={15} /> Go to Live Auction
                  </Link>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-600">
                  <ShieldCheck size={13} /> KYC Verified Sellers
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-xs font-medium text-neutral-600">
                  <Lock size={13} className="text-brand-600" /> Escrow Protected
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-200 p-6">
                <h3 className="text-sm font-semibold text-neutral-900">Key Details</h3>
                <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  {[
                    { label: "Category", value: property.category_name },
                    { label: "Status", value: property.status },
                    { label: "Listed", value: formatDate(property.created_at) },
                    ...(property.seller_name ? [{ label: "Seller", value: property.seller_name }] : []),
                    ...(property.custom_fields
                      ? Object.entries(property.custom_fields).map(([k, v]) => ({ label: k, value: v }))
                      : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</dt>
                      <dd className="mt-0.5 break-words font-medium capitalize text-neutral-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
