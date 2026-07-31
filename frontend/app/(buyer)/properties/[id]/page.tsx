"use client";

import { ArrowLeft, Bath, BedDouble, BookmarkPlus, BookmarkCheck, MapPin, Ruler } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentModal } from "@/components/properties/PaymentModal";
import { ApiRequestError } from "@/lib/api/client";
import { getProperty } from "@/lib/api/properties";
import { addToWatchlist, removeFromWatchlist, listWatchlist } from "@/lib/api/watchlist";
import { useAuth } from "@/lib/auth/session-context";
import type { Property } from "@/types/property";

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
      {icon}
      {label}
    </span>
  );
}

export default function BuyerPropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getProperty(accessToken, params.id)
      .then(setProperty)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load property."));
  }, [accessToken, params.id]);

  // Check if already in watchlist
  useEffect(() => {
    if (!accessToken) return;
    listWatchlist(accessToken)
      .then((items) => setInWatchlist(items.some((item) => item.property.id === params.id)))
      .catch(() => {});
  }, [accessToken, params.id]);

  async function toggleWatchlist() {
    if (!accessToken || watchlistLoading) return;
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(accessToken, params.id);
        setInWatchlist(false);
      } else {
        await addToWatchlist(accessToken, params.id);
        setInWatchlist(true);
      }
    } catch {
      // silent
    } finally {
      setWatchlistLoading(false);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft size={15} />
          Back to Recommended Assets
        </button>

        {error ? (
          <p className="text-sm text-danger-600">{error}</p>
        ) : !property ? (
          <div className="animate-pulse space-y-4">
            <div className="h-72 rounded-2xl bg-neutral-100" />
            <div className="h-8 w-2/3 rounded-lg bg-neutral-100" />
            <div className="h-4 w-1/3 rounded-lg bg-neutral-100" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {/* Image */}
            <div className="relative h-72 bg-neutral-100 sm:h-96">
              {property.image_url ? (
                <Image
                  src={property.image_url}
                  alt={property.title}
                  fill
                  sizes="(max-width:1024px) 100vw, 960px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400 capitalize">
                  {property.category_name}
                </div>
              )}
              <span className="absolute left-4 top-4 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold capitalize text-white shadow">
                {property.category_name}
              </span>
            </div>

            {/* Content */}
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
              {/* Left: details */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{property.title}</h1>
                <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                  <MapPin size={14} />
                  {property.address}
                </div>

                {property.bedrooms !== null || property.bathrooms !== null || property.area_sqft !== null ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {property.bedrooms !== null ? (
                      <Feature icon={<BedDouble size={16} />} label={`${property.bedrooms} Beds`} />
                    ) : null}
                    {property.bathrooms !== null ? (
                      <Feature icon={<Bath size={16} />} label={`${property.bathrooms} Baths`} />
                    ) : null}
                    {property.area_sqft !== null ? (
                      <Feature icon={<Ruler size={16} />} label={`${property.area_sqft.toLocaleString()} sqft`} />
                    ) : null}
                  </div>
                ) : null}

                {property.description ? (
                  <div className="mt-6">
                    <h2 className="text-sm font-semibold text-neutral-700">About this property</h2>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                      {property.description}
                    </p>
                  </div>
                ) : null}

                {property.seller_name ? (
                  <p className="mt-6 text-xs text-neutral-400">Listed by {property.seller_name}</p>
                ) : null}
              </div>

              {/* Right: price + actions */}
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Reserve Price</p>
                  <p className="mt-1 text-3xl font-bold text-brand-600">
                    ${Number(property.reserve_price).toLocaleString()}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={property.status !== "published"}
                  onClick={() => setPurchasing(true)}
                  className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
                >
                  {property.status === "published"
                    ? "Buy Now"
                    : property.status === "sold"
                      ? "Sold"
                      : "Not Yet Available"}
                </button>

                <button
                  type="button"
                  onClick={() => void toggleWatchlist()}
                  disabled={watchlistLoading}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors ${
                    inWatchlist
                      ? "border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {inWatchlist ? (
                    <><BookmarkCheck size={16} /> Saved to Watchlist</>
                  ) : (
                    <><BookmarkPlus size={16} /> Add to Watchlist</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {purchasing && property ? (
        <PaymentModal
          property={property}
          onClose={() => setPurchasing(false)}
          onConfirm={() => {
            setPurchasing(false);
            router.back();
          }}
        />
      ) : null}
    </>
  );
}
