"use client";

import { ArrowLeft, Bath, BedDouble, BookmarkCheck, BookmarkPlus, Box, Ruler, Tag } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentModal } from "@/components/properties/PaymentModal";
import { ModelViewer } from "@/components/properties/ModelViewer";
import { ApiRequestError } from "@/lib/api/client";
import { getProperty, listPublicProperties } from "@/lib/api/properties";
import { addToWatchlist, removeFromWatchlist, listWatchlist } from "@/lib/api/watchlist";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import { useAuth } from "@/lib/auth/session-context";
import type { Property } from "@/types/property";
import Link from "next/link";
import toast from "react-hot-toast";

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
  const [similar, setSimilar] = useState<Property[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);
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
        setActiveImage(resolveMinioUrl(p.image_url ?? p.images?.[0]?.image_url ?? null));
        if (searchParams.get("buy") === "true") {
          setPurchasing(true);
          router.replace(`/properties/${params.id}`, { scroll: false });
        }
        listPublicProperties({ category_id: p.category_id, size: 10 })
          .then((res) => setSimilar(res.items.filter((i) => i.id !== p.id).slice(0, 4)))
          .catch(() => {});
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
      toast.success("Removed from watchlist");
    } else {
      await addToWatchlist(accessToken, params.id);
      setInWatchlist(true);
      toast.success("Saved to watchlist");
    }
  } catch {
    toast.error("Unable to update watchlist");
  } finally {
    setWatchlistLoading(false);
  }
}

  const gallery = property
    ? [property.image_url, ...(property.images?.map((img) => img.image_url) ?? [])]
        .map(resolveMinioUrl)
        .filter((url, i, all): url is string => !!url && all.indexOf(url) === i)
    : [];

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
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

            {/* Category breadcrumb */}
            <p className="text-sm text-neutral-400">
              <Link href="/properties" className="hover:text-brand-600">All Properties</Link>
              <span className="mx-1.5">›</span>
              <span className="text-neutral-600">{property.category_name}</span>
            </p>

            {/* Two-column layout */}
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
              {/* Left — image gallery + description */}
              <div className="space-y-4">
                {/* Image / 3D viewer */}
                <div className="relative overflow-hidden rounded-2xl bg-white" style={{ minHeight: "420px" }}>
                  {show3d && resolveMinioUrl(property.model_url) ? (
                    <ModelViewer
                      src={resolveMinioUrl(property.model_url)!}
                      className="h-full w-full min-h-[420px]"
                    />
                  ) : activeImage ? (
                    <Image
                      src={activeImage}
                      alt={property.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 640px"
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full min-h-[420px] items-center justify-center text-neutral-400">
                      No image
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold capitalize text-white shadow">
                    {property.category_name}
                  </span>
                </div>

                {/* Thumbnail strip */}
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

                {/* Description */}
                {property.description && (
                  <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-2 text-base font-bold text-neutral-900">About</h2>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                      {property.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Right — price card + actions */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <p className="text-sm text-neutral-500">{property.title}</p>
                  <p className="mt-1 text-4xl font-bold text-brand-600">
                    ${Number(property.reserve_price).toLocaleString()}
                  </p>

                  {/* Feature pills — horizontal single row */}
                  {(property.bedrooms !== null ||
                    property.bathrooms !== null ||
                    property.area_sqft !== null ||
                    (property.custom_fields && Object.keys(property.custom_fields).length > 0)) && (
                    <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
                      {property.bedrooms !== null && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
                          <BedDouble size={15} /> {property.bedrooms} Beds
                        </span>
                      )}
                      {property.bathrooms !== null && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
                          <Bath size={15} /> {property.bathrooms} Baths
                        </span>
                      )}
                      {property.area_sqft !== null && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
                          <Ruler size={15} /> {property.area_sqft.toLocaleString()} sqft
                        </span>
                      )}
                      {property.custom_fields &&
                        Object.entries(property.custom_fields).slice(0, 3).map(([key, val]) => (
                          <span
                            key={key}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700"
                          >
                            <Tag size={13} className="shrink-0 text-neutral-400" />
                            <span className="text-neutral-500 text-xs">{key}:</span>
                            <span>{val}</span>
                          </span>
                        ))}
                    </div>
                  )}

                  {/* 3D View button */}
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
                    className="mt-3 w-full rounded-2xl bg-violet-600 py-3 text-sm font-bold text-white shadow transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                    // className="mt-3 w-full rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 py-3 text-sm font-bold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:from-neutral-300 disabled:to-neutral-300 disabled:text-neutral-500"
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

                {/* Key Details */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-bold text-neutral-900">Key Details</h2>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {[
                      { label: "Category", value: property.category_name },
                      { label: "Status", value: capitalize(property.status) },
                      { label: "Listed", value: formatDate(property.created_at) },
                      ...(property.seller_name
                        ? [{ label: "Seller", value: property.seller_name }]
                        : []),
                      ...(property.custom_fields
                        ? Object.entries(property.custom_fields).map(([k, v]) => ({ label: k, value: v }))
                        : []),
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <dt className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{label}</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-neutral-900 break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>

            {/* Similar properties in same category */}
            {similar.length > 0 && (
              <div className="mt-4">
                <h2 className="mb-4 text-lg font-bold text-neutral-900">
                  More in {property.category_name}
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {similar.map((item) => (
                    <Link
                      key={item.id}
                      href={`/properties/${item.id}`}
                      className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
                    >
                      <div className="relative h-36 bg-neutral-100">
                        {resolveMinioUrl(item.image_url) ? (
                          <Image
                            src={resolveMinioUrl(item.image_url)!}
                            alt={item.title}
                            fill
                            className="object-contain transition group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-neutral-300 text-xs">No image</div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-semibold text-neutral-900">{item.title}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">{item.category_name}</p>
                        <p className="mt-1 text-sm font-bold text-brand-600">${Number(item.reserve_price).toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
