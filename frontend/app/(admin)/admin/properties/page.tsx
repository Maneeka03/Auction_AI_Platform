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

  const [selectedParentId, setSelectedParentId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedParent = categories.find((c) => c.id === selectedParentId) ?? null;
  const subcategories = selectedParent?.children ?? [];

  // Active filter: subcategory takes priority over parent, otherwise null = all
  const activeCategoryId = selectedSubId || selectedParentId || null;

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

  function handleParentChange(id: string) {
    setSelectedParentId(id);
    setSelectedSubId("");
  }

  function handleReset() {
    setSelectedParentId("");
    setSelectedSubId("");
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl space-y-5 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Browse Properties</h1>
          <p className="mt-1 text-sm text-neutral-600">All properties across every status and category.</p>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 items-end gap-3 sm:flex sm:flex-wrap">
          {/* Category dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-500">Category</label>
            <select
              value={selectedParentId}
              onChange={(e) => handleParentChange(e.target.value)}
              className="h-9 w-full min-w-0 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:min-w-[180px]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory dropdown — always visible, disabled when no parent or no children */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-500">Subcategory</label>
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              disabled={subcategories.length === 0}
              className="h-9 w-full min-w-0 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 sm:min-w-[180px]"
            >
              <option value="">
                {subcategories.length === 0 ? "No subcategories" : "All Subcategories"}
              </option>
              {subcategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset */}
          {(selectedParentId || selectedSubId) && (
            <button
              type="button"
              onClick={handleReset}
              className="h-9 rounded-lg border border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Clear
            </button>
          )}
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
