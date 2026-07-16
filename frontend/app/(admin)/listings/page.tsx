"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { AddPropertyDrawer } from "@/components/properties/AddPropertyDrawer";
import { EditPropertyDrawer } from "@/components/properties/EditPropertyDrawer";
import { PropertyRowMenu } from "@/components/properties/PropertyRowMenu";
import { PropertyStatusBadge } from "@/components/properties/PropertyStatusBadge";
import { PropertyThumbnail } from "@/components/properties/PropertyThumbnail";
import { properties as initialProperties } from "@/lib/mock/properties";
import type { Property } from "@/types/property";

function formatPrice(value: number): string {
  return `$${value.toLocaleString()}`;
}

export default function ListingsPage() {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  function handleCreate(newProperty: Omit<Property, "id" | "listedAt" | "status">) {
    const property: Property = {
      ...newProperty,
      id: `prop-${Date.now()}`,
      status: "available",
      listedAt: new Date().toLocaleDateString(),
    };
    setProperties((prev) => [property, ...prev]);
    setShowAddDrawer(false);
  }

  function handleSave(updates: Partial<Property>) {
    if (!editingProperty) return;
    setProperties((prev) =>
      prev.map((p) => (p.id === editingProperty.id ? { ...p, ...updates } : p)),
    );
    setEditingProperty(null);
  }

  function handleDelete(property: Property) {
    const confirmed = window.confirm(`Remove ${property.address}? This can't be undone from here.`);
    if (!confirmed) return;
    setProperties((prev) => prev.filter((p) => p.id !== property.id));
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
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Listed</th>
                  <th className="w-20 px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.length === 0 ? (
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
                          <PropertyThumbnail imageSrc={property.imageSrc} category={property.category} />
                          <span className="font-medium text-neutral-900">{property.address}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{property.category}</td>
                      <td className="px-4 py-3 text-neutral-600">{formatPrice(property.price)}</td>
                      <td className="px-4 py-3">
                        <PropertyStatusBadge status={property.status} />
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{property.listedAt}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <PropertyRowMenu
                            onEdit={() => setEditingProperty(property)}
                            onDelete={() => handleDelete(property)}
                          />
                        </div>
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