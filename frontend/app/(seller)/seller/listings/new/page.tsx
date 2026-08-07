"use client";

import Image from "next/image";
import { ArrowLeft, Box, ImagePlus, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { listCategories, createCategory } from "@/lib/api/categories";
import { createListing, addListingImage } from "@/lib/api/seller";
import { uploadImage } from "@/lib/utils/uploadImage";
import { useAuth } from "@/lib/auth/session-context";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import type { CategoryTree, CategoryField } from "@/types/category";
import toast from "react-hot-toast";


export default function NewListingPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);
  const glbInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGlbUploading, setIsGlbUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [selectedMainId, setSelectedMainId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [categoryFields, setCategoryFields] = useState<CategoryField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [reservePrice, setReservePrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Additional images: [{preview, url}] — url is null while uploading
  const [extraImages, setExtraImages] = useState<{ preview: string; url: string | null }[]>([]);
  const [extraUploading, setExtraUploading] = useState(false);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [glbFileName, setGlbFileName] = useState<string | null>(null);
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [areaSqft, setAreaSqft] = useState("");

  // useEffect(() => {
  //   if (!accessToken) return;
  //   listCategories(accessToken)
  //     .then(setCategories)
  //     .catch(() => null);
  // }, [accessToken]);

  useEffect(() => {
  if (!accessToken) return;

  listCategories(accessToken)
    .then((data) => {
      console.log("CATEGORY RESPONSE:", data);
      setCategories(data);
    })
    .catch(() => null);

}, [accessToken]);
  const selectedMain = categories.find((c) => c.id === selectedMainId);
  const subCategories = selectedMain?.children ?? [];
  const categoryId = selectedSubId || selectedMainId;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setImageUrl(null);
    setIsUploading(true);
    setError(null);
    try {
      const url = await uploadImage(accessToken, file, "property");
      setImageUrl(url);
    } catch {
      setError("Image upload failed. Please try again.");
      setImagePreview(null);
    } finally {
      setIsUploading(false);
    }
  }

  function clearImage() {
    setImageUrl(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleExtraFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !accessToken) return;
    if (extraImages.length + files.length > 9) {
      setError("You can upload up to 9 additional images.");
      return;
    }
    setExtraUploading(true);
    setError(null);
    const previews = files.map((f) => ({ preview: URL.createObjectURL(f), url: null as string | null }));
    setExtraImages((prev) => [...prev, ...previews]);
    const startIdx = extraImages.length;
    await Promise.all(
      files.map(async (file, i) => {
        try {
          const url = await uploadImage(accessToken, file, "property");
          setExtraImages((prev) => {
            const next = [...prev];
            next[startIdx + i] = { ...next[startIdx + i], url };
            return next;
          });
        } catch {
          setExtraImages((prev) => prev.filter((_, idx) => idx !== startIdx + i));
          setError("One or more image uploads failed.");
        }
      }),
    );
    setExtraUploading(false);
    if (extraFileInputRef.current) extraFileInputRef.current.value = "";
  }

  function removeExtraImage(idx: number) {
    setExtraImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleGlbChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    setGlbFileName(file.name);
    setGlbUrl(null);
    setIsGlbUploading(true);
    setError(null);
    try {
      const url = await uploadImage(accessToken, file, "property");
      setGlbUrl(url);
    } catch {
      setError("3D model upload failed. Please try again.");
      setGlbFileName(null);
    } finally {
      setIsGlbUploading(false);
    }
  }

  function clearGlb() {
    setGlbUrl(null);
    setGlbFileName(null);
    if (glbInputRef.current) glbInputRef.current.value = "";
  }

  async function resolveOtherCategoryId(): Promise<string> {
    const cats = await listCategories(accessToken!);
    const flat = cats.flatMap((c) => [c, ...c.children]);
    const existing = flat.find((c) => c.name.toLowerCase() === "other");
    if (existing) return existing.id;
    const created = await createCategory(accessToken!, { name: "Other" });
    return created.id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !address.trim() || !categoryId || !reservePrice) {
      setError("Title, address, category, and reserve price are required.");
      return;
    }
    if (isUploading || extraUploading) {
      setError("Please wait — images are still uploading.");
      return;
    }
    if (isGlbUploading) {
      setError("Please wait — 3D model is still uploading.");
      return;
    }

    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      let finalCategoryId = categoryId;
      let finalDescription = description.trim() || null;

      if (categoryId === "__other__") {
        finalCategoryId = await resolveOtherCategoryId();
        finalDescription = "[Category: Other]\n\n" + (description.trim() || "") || null;
      }

      const listing = await createListing(accessToken, {
        title: title.trim(),
        address: address.trim(),
        category_id: finalCategoryId,
        reserve_price: reservePrice,
        description: finalDescription,
        image_url: imageUrl ?? null,
        model_url: glbUrl ?? null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        area_sqft: areaSqft ? Number(areaSqft) : null,
        custom_fields: customFieldValues,
      });
      // Upload additional images sequentially
      const validExtras = extraImages.filter((img) => img.url);
      for (const img of validExtras) {
        await addListingImage(accessToken, listing.id, img.url!);
      }
      toast.success("Listing submitted successfully");

      router.push("/seller/listings");
    } catch (err) {
      // setError(err instanceof Error ? err.message : "Failed to submit listing.");
        const message = err instanceof Error ? err.message : "Failed to submit listing.";
  setError(message);
  toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/seller/listings"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Submit New Listing</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Fill in the details below. Your listing will go to admin for approval before going live.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-700">Basic Information</h2>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 3BHK Apartment in Bandra West"
              className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full property address"
              className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Category <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                value={selectedMainId}
                options={[
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                  { value: "__other__", label: "Other" },
                ]}
                placeholder="Select category"
                onChange={(id) => {
                  setSelectedMainId(id);
                  setSelectedSubId("");
                  const cat = categories.find((c) => c.id === id);
                  setCategoryFields(cat?.fields ?? []);
                  setCustomFieldValues({});
                }}
              />
            </div>
            {subCategories.length > 0 ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Sub-category
                </label>
                <SearchableSelect
                  value={selectedSubId}
                  options={[
                    { value: "", label: "None (main category only)" },
                    ...subCategories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  placeholder="None (main category only)"
                  onChange={(id) => {
                    setSelectedSubId(id);
                    if (!id) {
                      setCategoryFields(selectedMain?.fields ?? []);
                    } else {
                      const sub = subCategories.find((c) => c.id === id);
                      setCategoryFields(sub?.fields ?? []);
                    }
                    setCustomFieldValues({});
                  }}
                />
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Reserve Price <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500">$</span>
                  <input
                    type="number"
                    min="0"
                    value={reservePrice}
                    onChange={(e) => setReservePrice(e.target.value)}
                    placeholder="0"
                    className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>
            )}
          </div>

          {subCategories.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Reserve Price <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">$</span>
                <input
                  type="number"
                  min="0"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value)}
                  placeholder="0"
                  className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the property — condition, features, location advantages…"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

{/* Category Custom Fields */}
{/* {categoryFields.length > 0 && (
  <div className="space-y-4 border-t border-neutral-200 pt-5">

    <h3 className="text-sm font-semibold text-neutral-700">
      Additional Information
    </h3>

    {categoryFields.map((field) => (
      <div key={field.id}>

        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          {field.label}
          {field.required && (
            <span className="text-red-500"> *</span>
          )}
        </label>


        {field.field_type === "text" && (
          <input
            type="text"
            value={customFieldValues[field.id] || ""}
            onChange={(e) =>
              setCustomFieldValues({
                ...customFieldValues,
                [field.id]: e.target.value,
              })
            }
            className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm"
          />
        )}


        {field.field_type === "number" && (
          <input
            type="number"
            value={customFieldValues[field.id] || ""}
            onChange={(e) =>
              setCustomFieldValues({
                ...customFieldValues,
                [field.id]: e.target.value,
              })
            }
            className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm"
          />
        )}


        {field.field_type === "select" && (
          <select
            value={customFieldValues[field.id] || ""}
            onChange={(e) =>
              setCustomFieldValues({
                ...customFieldValues,
                [field.id]: e.target.value,
              })
            }
            className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm"
          >
            <option value="">
              Select
            </option>

            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}

          </select>
        )}

      </div>
    ))}

  </div>
)} */}
{categoryFields.length > 0 && (
  <div className="space-y-4 border-t border-neutral-200 pt-5">
    <h3 className="text-sm font-semibold text-neutral-700">Additional Information</h3>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {categoryFields.map((field) => (
        <div key={field.id}>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </label>

          {field.field_type === "select" ? (
            <SearchableSelect
              value={customFieldValues[field.label] ?? ""}
              options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
              placeholder="Select…"
              onChange={(v) => setCustomFieldValues((prev) => ({ ...prev, [field.label]: v }))}
            />
          ) : field.field_type === "textarea" ? (
            <textarea
              rows={3}
              value={customFieldValues[field.label] ?? ""}
              onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [field.label]: e.target.value }))}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          ) : field.field_type === "boolean" ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={customFieldValues[field.label] === "true"}
                onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [field.label]: e.target.checked ? "true" : "false" }))}
                className="h-4 w-4 rounded border-neutral-300 accent-brand-500"
              />
              Yes
            </label>
          ) : (
            <input
              type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
              value={customFieldValues[field.label] ?? ""}
              onChange={(e) => setCustomFieldValues((prev) => ({ ...prev, [field.label]: e.target.value }))}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          )}
        </div>
      ))}
    </div>
  </div>
)}

        </div>

        {/* Property Details */}
        {/* <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-700">
            Property Details{" "}
            <span className="text-xs font-normal text-neutral-400">(optional)</span>
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Bedrooms</label>
              <input
                type="number"
                min="0"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="e.g. 3"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Bathrooms</label>
              <input
                type="number"
                min="0"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                placeholder="e.g. 2"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Area (sq ft)</label>
              <input
                type="number"
                min="0"
                value={areaSqft}
                onChange={(e) => setAreaSqft(e.target.value)}
                placeholder="e.g. 1200"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </div> */}

        {/* Image upload from device */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-700">
            Property Image{" "}
            <span className="text-xs font-normal text-neutral-400">(optional)</span>
          </h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {imagePreview ? (
            <div className="relative">
              <div className="relative h-52 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-contain"
                  unoptimized
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 size={24} className="animate-spin text-white" />
                    <span className="ml-2 text-sm font-medium text-white">Uploading…</span>
                  </div>
                )}
                {!isUploading && imageUrl && (
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-green-500 px-2.5 py-1 text-xs font-semibold text-white">
                    ✓ Uploaded
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-900"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-500"
            >
              <ImagePlus size={28} />
              <span className="text-sm font-medium">Click to upload from your device</span>
              <span className="text-xs">PNG, JPG, WEBP up to 10 MB</span>
            </button>
          )}

          {imagePreview && !isUploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-brand-600 hover:underline"
            >
              Change image
            </button>
          )}
        </div>

        {/* Additional images */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-700">
              Additional Images{" "}
              <span className="text-xs font-normal text-neutral-400">(up to 9, optional)</span>
            </h2>
            {extraImages.length < 9 && (
              <button
                type="button"
                onClick={() => extraFileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100"
              >
                <ImagePlus size={14} /> Add Images
              </button>
            )}
          </div>
          <input
            ref={extraFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleExtraFileChange}
          />
          {extraImages.length === 0 ? (
            <button
              type="button"
              onClick={() => extraFileInputRef.current?.click()}
              className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-500"
            >
              <ImagePlus size={22} />
              <span className="text-xs font-medium">Click to add more images</span>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {extraImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <div className="relative h-24 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                    <Image src={img.preview} alt="" fill className="object-contain" unoptimized />
                    {!img.url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 size={18} className="animate-spin text-white" />
                      </div>
                    )}
                    {img.url && (
                      <div className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        ✓
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExtraImage(idx)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-900"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GLB / 3D model upload */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-700">
            3D Model (GLB){" "}
            <span className="text-xs font-normal text-neutral-400">(optional)</span>
          </h2>

          <input
            ref={glbInputRef}
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={handleGlbChange}
          />

          {glbFileName ? (
            <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Box size={20} className="shrink-0 text-brand-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-800">{glbFileName}</p>
                  {isGlbUploading ? (
                    <p className="flex items-center gap-1 text-xs text-neutral-500">
                      <Loader2 size={11} className="animate-spin" /> Uploading…
                    </p>
                  ) : glbUrl ? (
                    <p className="text-xs text-green-600">✓ Uploaded</p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={clearGlb}
                className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => glbInputRef.current?.click()}
              className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-500"
            >
              <Box size={24} />
              <span className="text-sm font-medium">Click to upload a .glb or .gltf file</span>
            </button>
          )}

          {glbFileName && !isGlbUploading && (
            <button
              type="button"
              onClick={() => glbInputRef.current?.click()}
              className="text-xs text-brand-600 hover:underline"
            >
              Change file
            </button>
          )}
        </div>

        {/* Approval notice */}
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-4 text-xs text-brand-700">
          <p className="mb-1 font-semibold">What happens after you submit?</p>
          <p>
            Your listing goes to the approval panel — Director, Appraiser, and Legal &amp; Finance each review
            it. Once <strong>2 of 3 approve</strong>, it becomes eligible for auction creation automatically.
          </p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <Link
            href="/seller/listings"
            className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isUploading || extraUploading || isGlbUploading}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
