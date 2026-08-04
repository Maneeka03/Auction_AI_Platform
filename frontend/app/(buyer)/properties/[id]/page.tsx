"use client";

import { ArrowLeft, Bath, BedDouble, BookmarkCheck, BookmarkPlus, Box, Ruler } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentModal } from "@/components/properties/PaymentModal";
import { ModelViewer } from "@/components/properties/ModelViewer";
import { ApiRequestError } from "@/lib/api/client";
import { getProperty } from "@/lib/api/properties";
import { addToWatchlist, removeFromWatchlist, listWatchlist } from "@/lib/api/watchlist";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import { useAuth } from "@/lib/auth/session-context";
import type { Property } from "@/types/property";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function BuyerPropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [show3d, setShow3d] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getProperty(accessToken, params.id)
      .then((p) => {
        setProperty(p);
        if (searchParams.get("buy") === "true") {
          setPurchasing(true);
          router.replace(`/properties/${params.id}`, { scroll: false });
        }
      })
      .catch((err) =>
        setError(err instanceof ApiRequestError ? err.message : "Failed to load property."),
      );
  }, [accessToken, params.id, searchParams, router]);

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
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Back button — pill style */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-200"
        >
          <ArrowLeft size={15} />
          Back to Browse Assets
        </button>

        {error ? (
          <p className="text-sm text-danger-600">{error}</p>
        ) : !property ? (
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-40 rounded-lg bg-neutral-100" />
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="aspect-square rounded-2xl bg-neutral-100" />
              <div className="space-y-4">
                <div className="h-64 rounded-2xl bg-neutral-100" />
                <div className="h-40 rounded-2xl bg-neutral-100" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Title */}
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{property.title}</h1>

            {/* Two-column layout */}
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
              {/* Left — image / 3D viewer */}
              <div className="relative overflow-hidden rounded-2xl bg-neutral-100" style={{ minHeight: "420px" }}>
                {show3d && resolveMinioUrl(property.model_url) ? (
                  <ModelViewer
                    src={resolveMinioUrl(property.model_url)!}
                    className="h-full w-full min-h-[420px]"
                  />
                ) : property.image_url ? (
                  <Image
                    src={resolveMinioUrl(property.image_url) ?? property.image_url}
                    alt={property.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full min-h-[420px] items-center justify-center text-neutral-400">
                    No image
                  </div>
                )}
                {/* Category badge */}
                <span className="absolute left-4 top-4 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold capitalize text-white shadow">
                  {property.category_name}
                </span>
              </div>

              {/* Right — price card + key details */}
              <div className="space-y-4">
                {/* Price / actions card */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-neutral-500">{property.title}</p>
                  <p className="mt-1 text-4xl font-bold text-brand-600">
                    ${Number(property.reserve_price).toLocaleString()}
                  </p>

                  {/* Feature pills */}
                  {(property.bedrooms !== null ||
                    property.bathrooms !== null ||
                    property.area_sqft !== null) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {property.bedrooms !== null && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
                          <BedDouble size={15} /> {property.bedrooms} Beds
                        </span>
                      )}
                      {property.bathrooms !== null && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
                          <Bath size={15} /> {property.bathrooms} Baths
                        </span>
                      )}
                      {property.area_sqft !== null && (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
                          <Ruler size={15} /> {property.area_sqft.toLocaleString()} sqft
                        </span>
                      )}
                    </div>
                  )}

                  {/* 3D View button — only when model exists */}
                  {resolveMinioUrl(property.model_url) && (
                    <button
                      type="button"
                      onClick={() => setShow3d((v) => !v)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-500 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                    >
                      <Box size={16} />
                      {show3d ? "Hide 3D View" : "3D View"}
                    </button>
                  )}

                  {/* Book Now */}
                  <button
                    type="button"
                    disabled={property.status !== "published"}
                    onClick={() => setPurchasing(true)}
                    className="mt-3 w-full rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 py-3 text-sm font-bold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:from-neutral-300 disabled:to-neutral-300 disabled:text-neutral-500"
                  >
                    {property.status === "published"
                      ? "Book Now"
                      : property.status === "sold"
                        ? "Sold"
                        : "Not Available"}
                  </button>

                  {/* Watchlist */}
                  <button
                    type="button"
                    onClick={() => void toggleWatchlist()}
                    disabled={watchlistLoading}
                    className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition ${
                      inWatchlist
                        ? "border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100"
                        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {inWatchlist ? (
                      <><BookmarkCheck size={15} /> Saved</>
                    ) : (
                      <><BookmarkPlus size={15} /> Save to Watchlist</>
                    )}
                  </button>
                </div>

                {/* Key Details card */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-bold text-neutral-900">Key Details</h2>
                  <dl className="space-y-3">
                    {[
                      { label: "Category", value: property.category_name },
                      { label: "Status", value: capitalize(property.status) },
                      { label: "Listed", value: formatDate(property.created_at) },
                      ...(property.seller_name
                        ? [{ label: "Seller", value: property.seller_name }]
                        : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                        <dt className="text-sm text-neutral-400">{label}</dt>
                        <dd className="text-sm font-semibold text-neutral-800">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Description (if any) */}
                {property.description && (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-2 text-base font-bold text-neutral-900">About</h2>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                      {property.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
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
