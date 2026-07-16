"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Property, PropertyCategory } from "@/types/property";

interface AddPropertyDrawerProps {
  onClose: () => void;
  onCreate: (property: Omit<Property, "id" | "listedAt" | "status">) => void;
}

export function AddPropertyDrawer({ onClose, onCreate }: AddPropertyDrawerProps) {
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<PropertyCategory>("Residential");
  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareFeet, setSquareFeet] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const priceNumber = Number(price);
    const squareFeetNumber = Number(squareFeet);

    if (!address.trim() || !price || !squareFeet || Number.isNaN(priceNumber) || Number.isNaN(squareFeetNumber)) {
      setError("Address, price, and square footage are required.");
      return;
    }

    onCreate({
      address,
      category,
      price: priceNumber,
      squareFeet: squareFeetNumber,
      bedrooms: category === "Residential" && bedrooms ? Number(bedrooms) : undefined,
      bathrooms: category === "Residential" && bathrooms ? Number(bathrooms) : undefined,
      description,
      addedBy: "You",
    });
  }

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
          <h2 className="text-lg font-semibold text-neutral-900">Add Property</h2>
          <button type="button" onClick={handleClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Address <span className="text-danger-500">*</span>
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 142 Maple Grove Ave, Austin TX"
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PropertyCategory)}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                  Price ($) <span className="text-danger-500">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                  Square Feet <span className="text-danger-500">*</span>
                </label>
                <input
                  type="number"
                  value={squareFeet}
                  onChange={(e) => setSquareFeet(e.target.value)}
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            {category === "Residential" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-800">Bedrooms</label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-800">Bathrooms</label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
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
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Add Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}