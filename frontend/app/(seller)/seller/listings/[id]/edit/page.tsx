"use client";

import Image from "next/image";
import { ArrowLeft, Box, ImagePlus, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { listCategories } from "@/lib/api/categories";
import { getMyListing, updateListing } from "@/lib/api/seller";
import { uploadImage } from "@/lib/utils/uploadImage";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import { useAuth } from "@/lib/auth/session-context";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import type { CategoryTree, CategoryField } from "@/types/category";
import type { Property } from "@/types/property";
import toast from "react-hot-toast";

export default function EditListingPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [property, setProperty] = useState<Property | null>(null);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  const selectedMain = categories.find((c) => c.id === selectedMainId);
  const subCategories = selectedMain?.children ?? [];
  const categoryId = selectedSubId || selectedMainId;

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      getMyListing(accessToken, params.id),
      listCategories(accessToken),
    ]).then(([listing, cats]) => {
      setProperty(listing);
      setCategories(cats);
      setTitle(listing.title);
      setAddress(listing.address);
      setReservePrice(listing.reserve_price);
      setDescription(listing.description ?? "");

      const resolved = resolveMinioUrl(listing.image_url);
      setImageUrl(listing.image_url);
      setImagePreview(resolved);

      // Resolve category selection
      let mainId = "";
      let subId = "";
      let fields: CategoryField[] = [];

      for (const cat of cats) {
        if (cat.id === listing.category_id) {
          mainId = cat.id;
          fields = cat.fields ?? [];
          break;
        }
        const sub = cat.children.find((c) => c.id === listing.category_id);
        if (sub) {
          mainId = cat.id;
          subId = sub.id;
          fields = sub.fields ?? [];
          break;
        }
      }

      setSelectedMainId(mainId);
      setSelectedSubId(subId);
      setCategoryFields(fields);

      // Pre-populate custom fields — new convention uses field.label as key.
      // Fall back to field.id for listings created before the key fix.
      if (listing.custom_fields) {
        const init: Record<string, string> = {};
        for (const field of fields) {
          const byLabel = listing.custom_fields[field.label];
          const byId = listing.custom_fields[field.id];
          if (byLabel !== undefined) init[field.label] = byLabel;
          else if (byId !== undefined) init[field.label] = byId;
        }
        setCustomFieldValues(init);
      }
    }).catch(() => setError("Failed to load listing."))
      .finally(() => setIsLoading(false));
  }, [accessToken, params.id]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    setImagePreview(URL.createObjectURL(file));
    setImageUrl(null);
    setIsUploading(true);
    setError(null);
    try {
      const url = await uploadImage(accessToken, file, "property");
      setImageUrl(url);
    } catch {
      setError("Image upload failed. Please try again.");
      setImagePreview(resolveMinioUrl(property?.image_url) ?? null);
    } finally {
      setIsUploading(false);
    }
  }
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);

  if (!title.trim() || !categoryId || !reservePrice) {
    const message = "Title, category, and reserve price are required.";
    setError(message);
    toast.error(message);
    return;
  }

  if (isUploading) {
    const message = "Please wait — image is still uploading.";
    setError(message);
    toast.error(message);
    return;
  }

  if (!accessToken) return;

  setIsSubmitting(true);

  try {
    await updateListing(accessToken, params.id, {
      title: title.trim(),
      address: address.trim(),
      category_id: categoryId,
      reserve_price: reservePrice,
      description: description.trim() || null,
      image_url: imageUrl ?? null,
      custom_fields:
        Object.keys(customFieldValues).length > 0
          ? customFieldValues
          : null,
    });

    toast.success("Listing updated successfully");
    router.push("/seller/listings");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save changes.";

    setError(message);
    toast.error(message);
  } finally {
    setIsSubmitting(false);
  }
}

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-neutral-100" />
          <div className="h-64 rounded-xl bg-neutral-100" />
          <div className="h-40 rounded-xl bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (error && !property) {
    return <p className="p-6 text-sm text-red-600">{error}</p>;
  }

  if (property && property.status !== "draft") {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-neutral-600">
          Only draft listings can be edited. This listing is <strong>{property.status}</strong>.
        </p>
        <Link href="/seller/listings" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          ← Back to listings
        </Link>
      </div>
    );
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
          <h1 className="text-2xl font-semibold text-neutral-900">Edit Listing</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Changes are saved as draft and re-reviewed before going live.
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
              className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Category <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                value={selectedMainId}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
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
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Custom Fields */}
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
                        onChange={(e) =>
                          setCustomFieldValues((prev) => ({ ...prev, [field.label]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                      />
                    ) : field.field_type === "boolean" ? (
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={customFieldValues[field.label] === "true"}
                          onChange={(e) =>
                            setCustomFieldValues((prev) => ({
                              ...prev,
                              [field.label]: e.target.checked ? "true" : "false",
                            }))
                          }
                          className="h-4 w-4 rounded border-neutral-300 accent-brand-500"
                        />
                        Yes
                      </label>
                    ) : (
                      <input
                        type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
                        value={customFieldValues[field.label] ?? ""}
                        onChange={(e) =>
                          setCustomFieldValues((prev) => ({ ...prev, [field.label]: e.target.value }))
                        }
                        className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image upload */}
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
                <Image src={imagePreview} alt="Preview" fill className="object-contain" unoptimized />
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
                onClick={() => { setImageUrl(null); setImagePreview(null); }}
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
            disabled={isSubmitting || isUploading}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
