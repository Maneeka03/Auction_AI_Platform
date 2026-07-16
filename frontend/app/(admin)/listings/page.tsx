"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { AddPropertyDrawer } from "@/components/properties/AddPropertyDrawer";
import { EditPropertyDrawer } from "@/components/properties/EditPropertyDrawer";
import { CategoryBadge } from "@/components/properties/CategoryBadge";
import { PropertyStatusBadge } from "@/components/properties/PropertyStatusBadge";
import { PropertyThumbnail } from "@/components/properties/PropertyThumbnail";
import { createProperty, listProperties, updateProperty } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Property } from "@/types/property";

function formatPrice(value: string): string {
  return `$${Number(value).toLocaleString()}`;
}

export default function ListingsPage() {
  const { accessToken } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listProperties(accessToken, { page: 1, size: 50 });
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

  async function handleCreate(payload: Parameters<typeof createProperty>[1]) {
    if (!accessToken) return;
    await createProperty(accessToken, payload);
    setShowAddDrawer(false);
    void fetchProperties();
  }

  async function handleSave(updates: Parameters<typeof updateProperty>[2]) {
    if (!accessToken || !editingProperty) return;
    await updateProperty(accessToken, editingProperty.id, updates);
    setEditingProperty(null);
    void fetchProperties();
  }

  return (
    <AdminShell>
      <RequirePermission module="asset_management" need="full">
        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Listings</h1>
              <p className="mt-1 text-sm text-neutral-600">Properties available for direct purchase.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddDrawer(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              <Plus size={16} /> Add Property
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                  <th className="px-4 py-3 font-medium">Title / Address</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Reserve Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="w-20 px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                      Loading properties...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-danger-600">
                      {error}
                    </td>
                  </tr>
                ) : properties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                      No properties listed yet.
                    </td>
                  </tr>
                ) : (
                  properties.map((property) => (
                    <tr key={property.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <PropertyThumbnail imageUrl={property.image_url} category={property.category} />
                          <div>
                            <p className="font-medium text-neutral-900">{property.title}</p>
                            <p className="text-xs text-neutral-500">{property.address}</p>
                          </div>
                        </div>
                      </td>
                       <td className="px-4 py-3">
                        <CategoryBadge category={property.category} />
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{formatPrice(property.reserve_price)}</td>
                      <td className="px-4 py-3">
                        <PropertyStatusBadge status={property.status} />
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(property.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingProperty(property)}
                          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAddDrawer ? (
          <AddPropertyDrawer onClose={() => setShowAddDrawer(false)} onCreate={handleCreate} />
        ) : null}
        {editingProperty ? (
          <EditPropertyDrawer
            property={editingProperty}
            onClose={() => setEditingProperty(null)}
            onSave={handleSave}
          />
        ) : null}
      </RequirePermission>
    </AdminShell>
  );
}