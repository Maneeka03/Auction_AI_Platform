"use client";

import { Box, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { CategoryCustomFields } from "@/components/properties/CategoryCustomFields";
import { useAuth } from "@/lib/auth/session-context";
import { useCategories } from "@/lib/hooks/useCategories";
import { isRealEstateCategory } from "@/lib/utils/categoryVisuals";
import { uploadImage } from "@/lib/utils/uploadImage";
import type { CreatePropertyRequest } from "@/types/property";


interface AddPropertyDrawerProps {
  onClose: () => void;
  // galleryImageUrls are every uploaded photo; the page attaches them to the gallery after create,
  // so one image or many are stored the same way (the first also becomes the cover image_url).
  onCreate: (payload: CreatePropertyRequest, galleryImageUrls: string[]) => Promise<void>;
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([]);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const selectedMain = categories.find(
    (main) => main.id === categoryId || main.children.some((child) => child.id === categoryId),
  );
  const showResidentialFields = isRealEstateCategory(selectedMain?.name);
  // parentCategoryId is set only when a subcategory is selected
  const parentCategoryId =
    selectedMain && selectedMain.id !== categoryId ? selectedMain.id : undefined;

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    setCustomFieldValues({});
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setImagePreviews([]);
      return;
    }
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [imageFiles]);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    event.target.value = "";

    const startIndex = imageFiles.length;
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImageUrls((prev) => [...prev, ...newFiles.map(() => null)]);

    if (!accessToken) return;
    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(
        newFiles.map((file) => uploadImage(accessToken, file, "property")),
      );
      setImageUrls((prev) => {
        const next = [...prev];
        uploaded.forEach((url, i) => { next[startIndex + i] = url; });
        return next;
      });
    } catch {
      setError("Image upload failed. Please try again.");
      // Remove the failed files
      setImageFiles((prev) => prev.slice(0, startIndex));
      setImageUrls((prev) => prev.slice(0, startIndex));
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleModelSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setModelFile(file);
    event.target.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !address.trim() || !reservePrice || !categoryId) {
      setError("Title, address, category, and reserve price are required.");
      return;
    }

    if ((imageFiles.length > 0 || modelFile) && !accessToken) {
      setError("You must be signed in to upload files.");
      return;
    }

    setIsSubmitting(true);
    try {
      let modelUrl: string | undefined;
      if (accessToken && modelFile) {
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("file", modelFile);
          const res = await fetch(`/api/v1/uploads/file?purpose=property`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData,
          });
          if (res.ok) modelUrl = ((await res.json()) as { url: string }).url;
        } finally {
          setIsUploading(false);
        }
      }

      const uploadedUrls = imageUrls.filter((u): u is string => u !== null);

      await onCreate(
        {
          title,
          address,
          category_id: categoryId,
          reserve_price: reservePrice,
          description: description || undefined,
          image_url: uploadedUrls[0],
          model_url: modelUrl,
          bedrooms: showResidentialFields && bedrooms ? Number(bedrooms) : undefined,
          bathrooms: showResidentialFields && bathrooms ? Number(bathrooms) : undefined,
          area_sqft: areaSqft ? Number(areaSqft) : undefined,
          custom_fields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
        },
        uploadedUrls.slice(1),
      );
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
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Photos</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              {imagePreviews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={preview}
                      className="relative h-24 overflow-hidden rounded-lg border border-neutral-200"
                    >
                      <img src={preview} alt="" className="h-full w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-1 top-1 rounded-full bg-neutral-900/60 p-1 text-white hover:bg-neutral-900/80"
                        aria-label="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 text-neutral-400 hover:border-brand-300 hover:text-brand-500"
                  >
                    <ImagePlus size={20} />
                    <span className="text-xs">Add more</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-36 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 text-neutral-400 hover:border-brand-300 hover:text-brand-500"
                >
                  <ImagePlus size={22} />
                  <span className="text-xs">Click to upload one or more photos</span>
                </button>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">3D Model (.glb)</label>
              <input
                ref={modelInputRef}
                type="file"
                accept=".glb,model/gltf-binary"
                onChange={handleModelSelect}
                className="hidden"
              />
              {modelFile ? (
                <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
                  <span className="flex min-w-0 items-center gap-2">
                    <Box size={16} className="shrink-0 text-brand-500" />
                    <span className="truncate">{modelFile.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setModelFile(null)}
                    className="shrink-0 text-neutral-400 hover:text-neutral-600"
                    aria-label="Remove model"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => modelInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 py-3 text-sm text-neutral-400 hover:border-brand-300 hover:text-brand-500"
                >
                  <Box size={18} /> Upload a .glb model
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
                <>
                  <CategorySelect categories={categories} value={categoryId} onChange={handleCategoryChange} />
                  {categoryId && (
                    <div className="mt-4">
                      <CategoryCustomFields
                        categoryId={categoryId}
                        parentCategoryId={parentCategoryId}
                        values={customFieldValues}
                        onChange={setCustomFieldValues}
                      />
                    </div>
                  )}
                </>
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
              disabled={isSubmitting || isUploading}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isUploading ? "Uploading image..." : isSubmitting ? "Creating..." : "Add Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
