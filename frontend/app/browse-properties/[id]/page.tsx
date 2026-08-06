"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Ruler,
  Box,
  Gavel,
  ShieldCheck,
  Lock,
  TrendingUp,
  Tag,
  Users,
} from "lucide-react";
import Navbar from "@/components/public/Navbar/Navbar";
import Footer from "@/components/public/Footer/Footer";
import { ModelViewer } from "@/components/properties/ModelViewer";
import { getPublicProperty, listPublicProperties } from "@/lib/api/properties";
import { listPublicCategories } from "@/lib/api/categories";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import { listPublicAuctions } from "@/lib/api/auctions";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Property } from "@/types/property";
import type { Auction } from "@/types/auction";

function formatMoney(value: string | null): string {
  return value ? `$${Number(value).toLocaleString()}` : "—";
}

function timeRemaining(endsAt: string, now: number): string {
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${mins}m`;
}

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [show3d, setShow3d] = useState(false);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [relatedAuction, setRelatedAuction] = useState<Auction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const listing = await getPublicProperty(params.id);
      setProperty(listing);
      setActiveImage(resolveMinioUrl(listing.image_url ?? listing.images[0]?.image_url ?? null));

      // Fetch same-category, a broader set, and the category tree in parallel.
      const [sameCategory, broader, categoryTree] = await Promise.all([
        listPublicProperties({ category_id: listing.category_id, size: 20 }),
        listPublicProperties({ size: 50 }),
        listPublicCategories(),
      ]);

      // Find which parent category contains the current listing's category.
      const parentCategory = categoryTree.find((parent) =>
        parent.children.some((child) => child.id === listing.category_id),
      );
      // Sibling categories = other children of the same parent.
      const siblingIds = new Set(
        (parentCategory?.children ?? [])
          .map((c) => c.id)
          .filter((id) => id !== listing.category_id),
      );

      // Priority scoring:
      // 0 = exact same subcategory (or category if it has no parent)
      // 1 = sibling subcategory (different child of same parent)
      // 2 = anything else
      function score(item: Property): number {
        if (item.category_id === listing.category_id) return 0;
        if (siblingIds.has(item.category_id)) return 1;
        return 2;
      }

      const seen = new Set<string>([listing.id]);
      const candidates: Property[] = [];

      for (const item of [...sameCategory.items, ...broader.items]) {
        if (!seen.has(item.id)) {
          candidates.push(item);
          seen.add(item.id);
        }
      }

      candidates.sort((a, b) => score(a) - score(b));
      setSimilar(candidates.slice(0, 4));

      try {
        const auctionPage = await listPublicAuctions({ size: 50 });
        setRelatedAuction(
          auctionPage.items.find((a) => a.property_id === listing.id) ?? null,
        );
      } catch {
        setRelatedAuction(null); 
      }
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Failed to load property.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const gallery = property
    ? [
        property.image_url,
        ...property.images.map((img) => img.image_url),
      ]
      .map(resolveMinioUrl)
      .filter(
        (url, index, all): url is string => !!url && all.indexOf(url) === index,
      )
    : [];

  const modelUrl = property ? resolveMinioUrl(property.model_url) : null;

  function formatDate(value: string): string {
    const date = new Date(value);
    const day = date.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
          ? "nd"
          : day % 10 === 3 && day !== 13
            ? "rd"
            : "th";
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day}${suffix} ${month} ${year}`;
  }

  return (
    <div className="min-h-screen bg-neutral-50 ">
      <Navbar solid />
      <div
        className="relative w-full overflow-hidden pt-16"
        style={{ aspectRatio: "1812 / 629" }}
      >
        <Image
          src="/images/property-detail/hero-bg.png"
          alt=""
          fill
          className="object-cover object-top"
          priority
        />
      </div>

      <div className="relative z-20 mx-auto -mt-24 w-full max-w-[1600px] px-8 pb-12 sm:-mt-40 lg:-mt-90">
        <Link
          href="/browse-properties"
          className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition hover:bg-black/35"
        >
          <ArrowLeft size={16} /> Back to Browse Assets
        </Link>
        <h1 className="mb-5 text-3xl font-bold text-white md:text-4xl">
          {isLoading ? "Loading..." : (property?.title ?? "Property not found")}
        </h1>

        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading property...</p>
        ) : error || !property ? (
          <p className="text-sm text-danger-600">
            {error ?? "Property not found."}
          </p>
        ) : (
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="relative h-96 w-full overflow-hidden rounded-2xl bg-white md:h-[480px]">
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
                <span className="absolute left-4 top-4 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  {property.category_name}
                </span>
              </div>

              {gallery.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {gallery.map((url) => (
                    <button
                      key={url}
                      onClick={() => {
                        setShow3d(false);
                        setActiveImage(url);
                      }}
                      className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        activeImage === url
                          ? "border-brand-500"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        className="object-contain bg-white"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
              {!isLoading && property && (
                <div className="mt-10">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    About this property
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-600">
                    {property.description ?? "No description provided."}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white p-10">
              <p className="flex items-center gap-2 text-sm text-neutral-500">
                {property.address}
              </p>
              <p className="mt-3 text-3xl font-bold text-brand-600">
                {formatMoney(property.reserve_price)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {property.bedrooms != null && (
                  <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
                    <BedDouble size={15} /> {property.bedrooms} Beds
                  </span>
                )}
                {property.bathrooms != null && (
                  <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
                    <Bath size={15} /> {property.bathrooms} Baths
                  </span>
                )}
                {property.area_sqft != null && (
                  <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
                    <Ruler size={15} /> {property.area_sqft.toLocaleString()}{" "}
                    sqft
                  </span>
                )}
              </div>

              {modelUrl ? (
                <button
                  type="button"
                  onClick={() => setShow3d((value) => !value)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-brand-500 px-6 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-500 hover:text-white"
                >
                  <Box size={16} /> {show3d ? "View in 2D" : "3D View"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Real 3D viewing isn't built yet"
                  className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border-2 border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-400"
                >
                  <Box size={16} /> 3D View 
                </button>
              )}

              <Link
                href={
                  session
                    ? relatedAuction
                      ? `/live-auctions/${relatedAuction.id}`
                      : "/browse-auctions"
                    : `/login?redirect=/browse-properties/${params.id}`
                }
                className="mt-3 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:scale-105"
              >
                Book Now
              </Link>

              {relatedAuction && (
                <div className="mt-8 rounded-2xl border border-neutral-200 p-6">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    <Gavel size={16} className="text-brand-600" /> This property
                    is up for auction
                  </h3>
                  <div className="mt-4 flex flex-col items-start gap-3 border-b border-dashed border-neutral-200 pb-4 sm:flex-row sm:items-center sm:gap-6">
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
                    href={
                      session
                        ? `/live-auctions/${relatedAuction.id}`
                        : `/login?redirect=/live-auctions/${relatedAuction.id}`
                    }
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-brand-500 px-6 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-500 hover:text-white"
                  >
                    <Gavel size={15} /> Go to Live Auction
                  </Link>
                </div>
              )}

              <div className="mt-8 rounded-2xl border border-neutral-200 p-6">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Key Details
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Category</dt>
                    <dd className="font-medium text-neutral-900">
                      {property.category_name}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Status</dt>
                    <dd className="font-medium capitalize text-neutral-900">
                      {property.status}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Listed</dt>
                    <dd className="font-medium text-neutral-900">
                      {formatDate(property.created_at)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 flex gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-600">
                  <ShieldCheck size={13} className="text-green-600" /> KYC
                  Verified Sellers
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-xs font-medium text-neutral-600">
                  <Lock size={13} className="text-brand-600" /> Escrow Protected
                </span>
              </div>
            </div>
          </div>
        )}

        {!isLoading && similar.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-neutral-900">
              Similar Properties
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((item) => (
                <Link
                  key={item.id}
                  href={`/browse-properties/${item.id}`}
                  className="group overflow-hidden rounded-2xl border border-neutral-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-white">
                    {item.image_url ? (
                      <Image
                        src={resolveMinioUrl(item.image_url)!}
                        alt={item.title}
                        fill
                        className="object-contain transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                        {item.category_name}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="truncate text-sm font-semibold text-neutral-900">
                      {item.title}
                    </h3>
                    <p className="truncate text-xs text-neutral-500">
                      {item.address}
                    </p>
                    <p className="mt-2 font-semibold text-brand-600">
                      {formatMoney(item.reserve_price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
