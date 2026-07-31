"use client";

import { ArrowLeft, Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import Image from "next/image";
// Link removed — back button now uses router.back() to return to referrer (e.g. /recommendations)
// import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api/client";
import { getPublicProperty } from "@/lib/api/properties";
import Navbar from "@/components/public/Navbar/Navbar";
import type { Property } from "@/types/property";

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
      {icon}
      {label}
    </span>
  );
}

export default function PublicPropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicProperty(params.id)
      .then(setProperty)
      .catch((err) =>
        setError(err instanceof ApiRequestError ? err.message : "Failed to load property."),
      );
  }, [params.id]);

  function handleBookNow() {
    router.push("/login?redirect=/recommendations");
  }

  return (
    <>
      <Navbar solid />
      <main className="mx-auto w-full max-w-[1200px] px-8 pt-32 pb-12">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft size={15} /> Back
        </button>

        {error ? (
          <p className="mt-8 text-red-500">{error}</p>
        ) : !property ? (
          <p className="mt-8 text-neutral-500">Loading property...</p>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative h-[420px] overflow-hidden rounded-2xl bg-neutral-100">
              {property.image_url ? (
                <Image
                  src={property.image_url}
                  alt={property.title}
                  fill
                  sizes="(max-width:1024px) 100vw, 60vw"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-400">
                  {property.category_name}
                </div>
              )}
              <span className="absolute left-4 top-4 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold capitalize text-white">
                {property.category_name}
              </span>
            </div>

            <div className="flex flex-col">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                {property.title}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-neutral-500">
                <MapPin className="h-4 w-4" />
                <span>{property.address}</span>
              </div>

              <p className="mt-6 text-3xl font-bold tracking-tight text-brand-600">
                ${Number(property.reserve_price).toLocaleString()}
              </p>

              {property.bedrooms !== null || property.bathrooms !== null || property.area_sqft !== null ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {property.bedrooms !== null ? (
                    <Feature icon={<BedDouble className="h-4 w-4" />} label={`${property.bedrooms} Beds`} />
                  ) : null}
                  {property.bathrooms !== null ? (
                    <Feature icon={<Bath className="h-4 w-4" />} label={`${property.bathrooms} Baths`} />
                  ) : null}
                  {property.area_sqft !== null ? (
                    <Feature icon={<Ruler className="h-4 w-4" />} label={`${property.area_sqft.toLocaleString()} sqft`} />
                  ) : null}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleBookNow}
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                Book Now
              </button>
              {property.seller_name ? (
                <p className="mt-3 text-center text-xs text-neutral-400">
                  Listed by {property.seller_name}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {property?.description ? (
          <section className="mt-12 max-w-3xl">
            <h2 className="text-lg font-semibold text-neutral-900">About this property</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-neutral-600">
              {property.description}
            </p>
          </section>
        ) : null}
      </main>
    </>
  );
}
