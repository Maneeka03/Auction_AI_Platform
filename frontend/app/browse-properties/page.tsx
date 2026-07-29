"use client";

import { useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api/client";
import { listPublicProperties } from "@/lib/api/properties";
import { FeaturedAssetCard } from "@/components/public/FeaturedAssets/FeaturedAssetCard";
import Navbar from "@/components/public/Navbar/Navbar";
import type { Property } from "@/types/property";

const PAGE_SIZE = 12;

export default function BrowsePropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listPublicProperties({ page, size: PAGE_SIZE })
      .then((result) => {
        if (!active) return;
        setProperties((prev) => (page === 1 ? result.items : [...prev, ...result.items]));
        setTotal(result.total);
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiRequestError ? err.message : "Failed to load properties.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-[1600px] px-8 py-16">
        <header className="mb-10">
          <span className="text-m font-bold uppercase tracking-[0.2em] text-brand-500">
            Explore
          </span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900">All Properties</h1>
          <p className="mt-2 text-neutral-500">
            {total > 0 ? `${total} properties available` : "Browse every published listing."}
          </p>
        </header>

        {error ? (
          <p className="text-red-500">{error}</p>
        ) : loading && properties.length === 0 ? (
          <p className="text-neutral-500">Loading properties...</p>
        ) : properties.length === 0 ? (
          <p className="text-neutral-500">No properties available right now.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {properties.map((property) => (
                <FeaturedAssetCard key={property.id} property={property} />
              ))}
            </div>

            {properties.length < total ? (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={loading}
                  className="rounded-xl border border-brand-500 px-8 py-3 text-sm font-semibold text-brand-500 transition-colors hover:bg-brand-500 hover:text-white disabled:opacity-60"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
