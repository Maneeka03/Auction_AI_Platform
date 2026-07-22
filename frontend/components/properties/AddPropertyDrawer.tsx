"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { useAuth } from "@/lib/auth/session-context";
import { useCategories } from "@/lib/hooks/useCategories";
import { isRealEstateCategory } from "@/lib/utils/categoryVisuals";
import { uploadImage } from "@/lib/utils/uploadImage";
import type { CreatePropertyRequest } from "@/types/property";

interface AddPropertyDrawerProps {
  onClose: () => void;
  onCreate: (payload: CreatePropertyRequest) => Promise<void>;
}

export function AddPropertyDrawer({ onClose, onCreate }: AddPropertyDrawerProps) {
  const { accessToken } = useAuth();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [description, setDescription] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [areaSqft, setAreaSqft] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMain = categories.find(
    (main) => main.id === categoryId || main.children.some((child) => child.id === categoryId),
  );
  const showResidentialFields = isRealEstateCategory(selectedMain?.name);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setImageFile(file);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !address.trim() || !reservePrice || !categoryId) {
      setError("Title, address, category, and reserve price are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        if (!accessToken) {
          setError("You must be signed in to upload an image.");
          setIsSubmitting(false);
          return;
        }
        setIsUploadingImage(true);
        try {
          imageUrl = await uploadImage(accessToken, imageFile, "property");
        } finally {
          setIsUploadingImage(false);
        }
      }

      await onCreate({
        title,
        address,
        category_id: categoryId,
        reserve_price: reservePrice,
        description: description || undefined,
        image_url: imageUrl,
        bedrooms: showResidentialFields && bedrooms ? Number(bedrooms) : undefined,
        bathrooms: showResidentialFields && bathrooms ? Number(bathrooms) : undefined,
        area_sqft: areaSqft ? Number(areaSqft) : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
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
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Photo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative h-36 w-full overflow-hidden rounded-lg border border-neutral-200">
                  <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="absolute right-2 top-2 rounded-full bg-neutral-900/60 p-1 text-white hover:bg-neutral-900/80"
                    aria-label="Remove photo"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-36 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 text-neutral-400 hover:border-brand-300 hover:text-brand-500"
                >
                  <ImagePlus size={22} />
                  <span className="text-xs">Click to upload a photo</span>
                </button>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Title <span className="text-danger-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Modern Downtown Family Home"
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

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
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Category <span className="text-danger-500">*</span>
              </label>
              {categoriesLoading ? (
                <p className="text-xs text-neutral-500">Loading categories...</p>
              ) : (
                <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
              )}
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

            {showResidentialFields ? (
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
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Square Feet</label>
              <input
                type="number"
                value={areaSqft}
                onChange={(e) => setAreaSqft(e.target.value)}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

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
              disabled={isSubmitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isUploadingImage ? "Uploading photo..." : isSubmitting ? "Creating..." : "Add Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}