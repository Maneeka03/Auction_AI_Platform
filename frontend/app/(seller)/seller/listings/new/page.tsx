"use client";

import { ArrowLeft, ImagePlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listCategories } from "@/lib/api/categories";
import { createListing } from "@/lib/api/seller";
import { useAuth } from "@/lib/auth/session-context";
import type { CategoryTree } from "@/types/category";

export default function NewListingPage() {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [areaSqft, setAreaSqft] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    listCategories(accessToken)
      .then(setCategories)
      .catch(() => null);
  }, [accessToken]);

  // Flatten category tree for the select dropdown
  const flatCategories = categories.flatMap((parent) => [
    { id: parent.id, label: parent.name, isParent: true },
    ...parent.children.map((child) => ({ id: child.id, label: `  ${child.name}`, isParent: false })),
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !address.trim() || !categoryId || !reservePrice) {
      setError("Title, address, category, and reserve price are required.");
      return;
    }

    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      await createListing(accessToken, {
        title: title.trim(),
        address: address.trim(),
        category_id: categoryId,
        reserve_price: reservePrice,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        area_sqft: areaSqft ? Number(areaSqft) : null,
      });
      router.push("/seller/listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit listing.");
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
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select category</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.isParent && c.id !== categoryId}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
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
          </div>

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
        </div>

        {/* Property Details */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-700">Property Details <span className="text-xs font-normal text-neutral-400">(optional)</span></h2>

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
        </div>

        {/* Image */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-700">Image <span className="text-xs font-normal text-neutral-400">(optional)</span></h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Image URL</label>
            <div className="flex gap-2">
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="h-10 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="preview"
                  className="h-10 w-10 rounded-lg border border-neutral-200 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-300">
                  <ImagePlus size={16} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Approval notice */}
        <div className="rounded-lg border border-brand-100 bg-brand-50 p-4 text-xs text-brand-700">
          <p className="font-semibold mb-1">What happens after you submit?</p>
          <p>Your listing goes to the approval panel — Director, Appraiser, and Legal & Finance each review it. Once 2 of 3 approve, it goes live automatically.</p>
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
            disabled={isSubmitting}
            className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting ? "Submitting…" : "Submit Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
