"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { listProperties } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { useCategories } from "@/lib/hooks/useCategories";
import type { Property } from "@/types/property";

export default function AdminBrowsePropertiesPage() {
  const { accessToken } = useAuth();
  const { categories } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listProperties(accessToken, {
        page: 1,
        size: 100,
        category_id: activeCategoryId ?? undefined,
      });
      setProperties(result.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load properties.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeCategoryId]);

  useEffect(() => {
    void fetchProperties();
  }, [fetchProperties]);

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl space-y-5 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Browse Properties</h1>
          <p className="mt-1 text-sm text-neutral-600">All properties across every status and category.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategoryId(null)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeCategoryId === null ? "bg-brand-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            All
          </button>
          {categories.map((main) => (
            <div key={main.id} className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveCategoryId(main.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeCategoryId === main.id
                    ? "bg-brand-500 text-white"
                    : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {main.name}
              </button>
              {main.children.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActiveCategoryId(sub.id)}
                  className={`rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeCategoryId === sub.id
                      ? "bg-brand-500 text-white"
                      : "bg-white text-neutral-500 hover:bg-neutral-100"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading properties...</p>
        ) : error ? (
          <p className="text-sm text-danger-600">{error}</p>
        ) : properties.length === 0 ? (
          <p className="text-sm text-neutral-500">No properties found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                detailHref={`/admin/properties/${property.id}`}
                onBuyNow={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
