"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui/Select";
import type { Property, UpdatePropertyRequest } from "@/types/property";

interface EditPropertyDrawerProps {
  property: Property;
  onClose: () => void;
  onSave: (updates: UpdatePropertyRequest) => Promise<void>;
}

export function EditPropertyDrawer({ property, onClose, onSave }: EditPropertyDrawerProps) {
  const [reservePrice, setReservePrice] = useState(property.reserve_price);
  const [status, setStatus] = useState<"draft" | "published">(
    property.status === "sold" ? "published" : property.status,
  );
  const [description, setDescription] = useState(property.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!reservePrice) {
      setError("A reserve price is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ reserve_price: reservePrice, status, description });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSold = property.status === "sold";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div
        className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${isVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h2 className="text-lg font-semibold text-neutral-900">Edit Property</h2>
          <button type="button" onClick={handleClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Address</label>
              <input
                value={property.address}
                disabled
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 text-sm text-neutral-500"
              />
              <p className="mt-1 text-xs text-neutral-400">Address cannot be changed here.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Reserve Price ($) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Status</label>
              {isSold ? (
                <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                  Sold — set only by an award, cannot be edited here.
                </p>
              ) : (
                <Select
                  value={status}
                  onChange={(v) => setStatus(v as "draft" | "published")}
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                  ]}
                />
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isSold}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
              />
            </div>

            {error ? <p className="text-sm text-danger-600">{error}</p> : null}
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-neutral-100 pt-5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSold}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}