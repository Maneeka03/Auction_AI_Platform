"use client";

import { Box, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { CategoryCustomFields } from "@/components/properties/CategoryCustomFields";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/lib/auth/session-context";
import { useCategories } from "@/lib/hooks/useCategories";
import { isRealEstateCategory } from "@/lib/utils/categoryVisuals";
import { uploadImage } from "@/lib/utils/uploadImage";
import type { Property, UpdatePropertyRequest } from "@/types/property";
import PropertyGalleryUploader from "@/components/admin/PropertyGalleryUploader";
import type { PropertyImage } from "@/types/property";

const GLB_CONTENT_TYPE = "model/gltf-binary";

interface EditPropertyDrawerProps {
  property: Property;
  onClose: () => void;
  onSave: (updates: UpdatePropertyRequest) => Promise<void>;
}

export function EditPropertyDrawer({
  property,
  onClose,
  onSave,
}: EditPropertyDrawerProps) {
  const { accessToken } = useAuth();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const [title, setTitle] = useState(property.title);
  const [address, setAddress] = useState(property.address);
  const [categoryId, setCategoryId] = useState(property.category_id);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(
    property.custom_fields ?? {},
  );
  const [reservePrice, setReservePrice] = useState(property.reserve_price);
  const [status, setStatus] = useState<"draft" | "published">(
    property.status === "draft" || property.status === "published"
      ? property.status
      : "draft",
  );
  const [description, setDescription] = useState(property.description ?? "");
  const [bedrooms, setBedrooms] = useState(property.bedrooms?.toString() ?? "");
  const [bathrooms, setBathrooms] = useState(
    property.bathrooms?.toString() ?? "",
  );
  const [areaSqft, setAreaSqft] = useState(
    property.area_sqft?.toString() ?? "",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    property.image_url,
  );
  const [modelFile, setModelFile] = useState<File | null>(null);
  const existingModelUrl = property.model_url ?? null;
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PropertyImage[]>(property.images);

  const isSold = property.status === "sold";
  const selectedMain = categories.find(
    (main) =>
      main.id === categoryId ||
      main.children.some((child) => child.id === categoryId),
  );
  const showResidentialFields = isRealEstateCategory(
    selectedMain?.name ?? property.category_name,
  );
  const parentCategoryId =
    selectedMain && selectedMain.id !== categoryId ? selectedMain.id : undefined;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!imageFile) return;
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

  function handleModelSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setModelFile(file);
    event.target.value = "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !address.trim() || !reservePrice) {
      setError("Title, address, and reserve price are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;
      let modelUrl: string | undefined;

      if (imageFile || modelFile) {
        if (!accessToken) {
          setError("You must be signed in to upload files.");
          setIsSubmitting(false);
          return;
        }
        setIsUploadingImage(true);
        try {
          if (imageFile) imageUrl = await uploadImage(accessToken, imageFile, "property");
          if (modelFile) {
            modelUrl = await uploadImage(accessToken, modelFile, "property", GLB_CONTENT_TYPE);
          }
        } finally {
          setIsUploadingImage(false);
        }
      }

      await onSave({
        title,
        address,
        category_id: categoryId,
        reserve_price: reservePrice,
        status,
        description: description || undefined,
        image_url: imageUrl,
        // Preserve the existing model_url if no new file was uploaded
        model_url: modelUrl ?? existingModelUrl ?? undefined,
        bedrooms:
          showResidentialFields && bedrooms ? Number(bedrooms) : undefined,
        bathrooms:
          showResidentialFields && bathrooms ? Number(bathrooms) : undefined,
        area_sqft: areaSqft ? Number(areaSqft) : undefined,
        custom_fields: Object.keys(customFieldValues).length > 0 ? customFieldValues : null,
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
          <h2 className="text-lg font-semibold text-neutral-900">
            Edit Property
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto p-5"
        >
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Photo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isSold}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative h-36 w-full overflow-hidden rounded-lg border border-neutral-200">
                  <img
                    src={imagePreview}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                  {!isSold ? (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute right-2 top-2 rounded-full bg-neutral-900/60 p-1 text-white hover:bg-neutral-900/80"
                      aria-label="Remove photo"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isSold}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-36 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 text-neutral-400 hover:border-brand-300 hover:text-brand-500 disabled:opacity-60"
                >
                  <ImagePlus size={22} />
                  <span className="text-xs">Click to upload a photo</span>
                </button>
              )}
            </div>
            {!isSold && accessToken && (
              <div>
                <PropertyGalleryUploader
                  propertyId={property.id}
                  accessToken={accessToken}
                  images={images}
                  onChange={setImages}
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">3D Model (.glb)</label>
              <input
                ref={modelInputRef}
                type="file"
                accept=".glb,model/gltf-binary"
                onChange={handleModelSelect}
                disabled={isSold}
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
              ) : existingModelUrl ? (
                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-green-700">
                    <Box size={16} className="shrink-0 text-green-600" />
                    <span className="truncate text-xs">3D model saved</span>
                  </span>
                  {!isSold && (
                    <button
                      type="button"
                      onClick={() => modelInputRef.current?.click()}
                      className="shrink-0 text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Replace
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isSold}
                  onClick={() => modelInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 py-3 text-sm text-neutral-400 hover:border-brand-300 hover:text-brand-500 disabled:opacity-60"
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
                disabled={isSold}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Address <span className="text-danger-500">*</span>
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isSold}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Category
              </label>
              {categoriesLoading ? (
                <p className="text-xs text-neutral-500">
                  Loading categories...
                </p>
              ) : (
                <>
                  <CategorySelect
                    categories={categories}
                    value={categoryId}
                    onChange={(id) => {
                      setCategoryId(id);
                      setCustomFieldValues({});
                    }}
                    disabled={isSold}
                  />
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
                disabled={isSold}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
              />
            </div>

            {showResidentialFields ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    disabled={isSold}
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    disabled={isSold}
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Square Feet
              </label>
              <input
                type="number"
                value={areaSqft}
                onChange={(e) => setAreaSqft(e.target.value)}
                disabled={isSold}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Status
              </label>
              {isSold ? (
                <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                  Sold — set only by a purchase, cannot be edited here.
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
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Description
              </label>
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
              {isUploadingImage
                ? "Uploading photo..."
                : isSubmitting
                  ? "Saving..."
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
