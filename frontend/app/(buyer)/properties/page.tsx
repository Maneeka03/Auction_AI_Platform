"use client";

import { useCallback, useEffect, useState } from "react";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { BuyerTopbar } from "@/components/layout/BuyerTopbar";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PaymentModal } from "@/components/properties/PaymentModal";
import { listProperties } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { DemoPaymentResult, Property } from "@/types/property";

export default function BrowsePropertiesPage() {
  const { accessToken } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingProperty, setPurchasingProperty] = useState<Property | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listProperties(accessToken, { page: 1, size: 50, status: "published" });
      setProperties(result.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load properties.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchProperties();
  }, [fetchProperties]);

  function handleConfirmPayment(_result: DemoPaymentResult) {
    // No real purchase endpoint yet — demo-only until the auction
    // award/purchase flow is wired in.
  }

  return (
    <RequirePermission module="asset_management" need="view">
      <div className="min-h-screen bg-neutral-50">
        <BuyerTopbar />

        <div className="mx-auto max-w-6xl space-y-5 p-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Browse Properties</h1>
            <p className="mt-1 text-sm text-neutral-600">Buy residential and commercial properties directly.</p>
          </div>

          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading properties...</p>
          ) : error ? (
            <p className="text-sm text-danger-600">{error}</p>
          ) : properties.length === 0 ? (
            <p className="text-sm text-neutral-500">No properties available right now.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} onBuyNow={setPurchasingProperty} />
              ))}
            </div>
          )}
        </div>
      </div>

      {purchasingProperty ? (
        <PaymentModal
          property={purchasingProperty}
          onClose={() => setPurchasingProperty(null)}
          onConfirm={handleConfirmPayment}
        />
      ) : null}
    </RequirePermission>
  );
}