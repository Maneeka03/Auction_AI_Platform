"use client";

import { X } from "lucide-react";
import { useState } from "react";
import PropertyGalleryUploader from "@/components/admin/PropertyGalleryUploader";
import { useAuth } from "@/lib/auth/session-context";
import type { Property, PropertyImage } from "@/types/property";

interface PropertyImagesDrawerProps {
  property: Property;
  onClose: () => void;
  onUpdate: (images: PropertyImage[]) => void;
}

export function PropertyImagesDrawer({ property, onClose, onUpdate }: PropertyImagesDrawerProps) {
  const { accessToken } = useAuth();
  const [images, setImages] = useState<PropertyImage[]>(property.images);

  function handleChange(updated: PropertyImage[]) {
    setImages(updated);
    onUpdate(updated);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-neutral-900/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Manage Images
            </p>
            <h2 className="truncate text-sm font-semibold text-neutral-900">
              {property.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {accessToken ? (
            <PropertyGalleryUploader
              propertyId={property.id}
              accessToken={accessToken}
              images={images}
              onChange={handleChange}
            />
          ) : (
            <p className="text-sm text-neutral-500">Not authenticated.</p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-neutral-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
