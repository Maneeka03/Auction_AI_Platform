"use client";

import { useState } from "react";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { BuyerTopbar } from "@/components/layout/BuyerTopbar";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PaymentModal } from "@/components/properties/PaymentModal";
import { properties as initialProperties } from "@/lib/mock/properties";
import type { DemoPaymentResult, Property } from "@/types/property";

export default function BrowsePropertiesPage() {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [purchasingProperty, setPurchasingProperty] = useState<Property | null>(null);

  function handleConfirmPayment(_result: DemoPaymentResult) {
    if (!purchasingProperty) return;
    setProperties((prev) =>
      prev.map((p) => (p.id === purchasingProperty.id ? { ...p, status: "pending" } : p)),
    );
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} onBuyNow={setPurchasingProperty} />
            ))}
          </div>
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