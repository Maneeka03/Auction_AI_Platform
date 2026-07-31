"use client";

import { useEffect, useState } from "react";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PaymentModal } from "@/components/properties/PaymentModal";
import { getRecommendations } from "@/lib/api/buyer";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Property } from "@/types/property";

export default function RecommendationsPage() {
  const { accessToken } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState<Property | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getRecommendations(accessToken, 24)
      .then(setProperties)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load recommendations."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Recommended Properties &amp; Assets</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Handpicked listings based on your activity and preferences.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-neutral-400">Loading recommendations…</p>
        ) : error ? (
          <p className="text-sm text-danger-600">{error}</p>
        ) : properties.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
            <p className="text-sm text-neutral-500">No recommendations yet.</p>
            <p className="mt-1 text-xs text-neutral-400">
              Browse auctions and add items to your watchlist to get personalised suggestions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} onBuyNow={setPurchasing} detailHref={`/properties/${p.id}`} />
            ))}
          </div>
        )}
      </div>

      {purchasing ? (
        <PaymentModal
          property={purchasing}
          onClose={() => setPurchasing(null)}
          onConfirm={() => {
            setPurchasing(null);
            setProperties((prev) => prev.filter((p) => p.id !== purchasing.id));
          }}
        />
      ) : null}
    </>
  );
}
