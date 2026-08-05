"use client";

import Image from "next/image";
import { Bath, BedDouble, Box, Check, CheckCircle2, Ruler, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ApproverSeatChip } from "@/components/approvals/ApproverSeatChip";
import { ModelViewer } from "@/components/properties/ModelViewer";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import { listCategories } from "@/lib/api/categories";
import { updateProperty } from "@/lib/api/properties";
import type { ApproverSeat, Property } from "@/types/property";
import type { CategoryTree } from "@/types/category";

const SEATS: ApproverSeat[] = ["director", "appraiser", "legal_finance"];

function parseDescription(raw: string | null): { text: string | null; fields: Array<{ label: string; value: string }> } {
  if (!raw) return { text: null, fields: [] };
  const SEP = "--- Custom Fields ---";
  const idx = raw.indexOf(SEP);
  if (idx === -1) return { text: raw, fields: [] };
  const text = raw.slice(0, idx).trim() || null;
  const fields = raw
    .slice(idx + SEP.length)
    .trim()
    .split("\n")
    .map((line) => {
      const colonIdx = line.indexOf(":");
      return colonIdx === -1
        ? null
        : { label: line.slice(0, colonIdx).trim(), value: line.slice(colonIdx + 1).trim() };
    })
    .filter((f): f is { label: string; value: string } => f !== null && !!f.label);
  return { text, fields };
}

interface Props {
  property: Property;
  currentUserSeat?: ApproverSeat;
  onVote: (propertyId: string, approved: boolean) => void;
  isVoting: boolean;
  onClose: () => void;
  accessToken?: string;
  onPropertyUpdated?: (updated: Property) => void;
}

export function PropertyDetailModal({
  property,
  currentUserSeat,
  onVote,
  isVoting,
  onClose,
  accessToken,
  onPropertyUpdated,
}: Props) {
  const gallery = [
    resolveMinioUrl(property.image_url),
    ...property.images.map((img) => resolveMinioUrl(img.image_url)),
  ].filter((url): url is string => !!url);

  const [activeImage, setActiveImage] = useState(gallery[0] ?? null);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const { text: descriptionText, fields: customFields } = parseDescription(property.description);

  const approvedCount = property.votes.filter((v) => v.approved).length;
  const myVote = currentUserSeat ? property.votes.find((v) => v.seat === currentUserSeat) : undefined;
  const canVote = property.status === "draft" && currentUserSeat !== undefined && myVote === undefined;

  // Derived values
  const selectedParent = categories.find((p) => p.id === selectedParentId) ?? null;
  const subcategories = selectedParent?.children ?? [];
  const finalCatId = selectedSubId || selectedParentId;

  const allFlat = categories.flatMap((p) => [
    { id: p.id, name: p.name },
    ...p.children.map((c) => ({ id: c.id, name: c.name })),
  ]);
  const selectedCatName = allFlat.find((c) => c.id === finalCatId)?.name ?? property.category_name;
  const isOther = selectedCatName?.toLowerCase() === "other";
  const catChanged = !!finalCatId && finalCatId !== property.category_id;

  // Fetch categories on mount
  useEffect(() => {
    if (!accessToken) return;
    listCategories(accessToken).then(setCategories).catch(() => null);
  }, [accessToken]);

  // Once categories load, initialise dropdowns from property.category_id
  useEffect(() => {
    if (categories.length === 0) return;
    const isParent = categories.some((p) => p.id === property.category_id);
    if (isParent) {
      setSelectedParentId(property.category_id);
      setSelectedSubId("");
    } else {
      const parent = categories.find((p) =>
        p.children.some((c) => c.id === property.category_id)
      );
      setSelectedParentId(parent?.id ?? "");
      setSelectedSubId(parent ? property.category_id : "");
    }
  }, [categories, property.category_id]);

  async function handleSaveCat() {
    if (!accessToken || !catChanged || !finalCatId) return;
    setSavingCat(true);
    setCatError(null);
    try {
      const updated = await updateProperty(accessToken, property.id, { category_id: finalCatId });
      onPropertyUpdated?.(updated);
    } catch {
      setCatError("Failed to update category.");
    } finally {
      setSavingCat(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 transition-opacity" onClick={onClose} />

      {/* Slide-over drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-neutral-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-neutral-900 sm:text-lg">
                {property.title}
              </h2>
              <p className="mt-0.5 truncate text-xs text-neutral-500 sm:text-sm">
                {property.address}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
            >
              <X size={16} />
            </button>
          </div>

          {/* Category assignment */}
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Assign Category
              </p>
              {isOther && (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  Needs Category
                </span>
              )}
            </div>

            {accessToken && categories.length > 0 ? (
              <div className="space-y-2">
                {/* Two dropdowns: responsive grid */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {/* Parent category */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-neutral-500">Category</label>
                    <select
                      value={selectedParentId}
                      onChange={(e) => {
                        setSelectedParentId(e.target.value);
                        setSelectedSubId("");
                      }}
                      className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    >
                      <option value="">— Select category —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-neutral-500">Subcategory</label>
                    <select
                      value={selectedSubId}
                      onChange={(e) => setSelectedSubId(e.target.value)}
                      disabled={subcategories.length === 0}
                      className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
                    >
                      <option value="">
                        {subcategories.length === 0 ? "No subcategories" : "— Select subcategory —"}
                      </option>
                      {subcategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Save button — full width, shown only when something changed */}
                {catChanged && (
                  <button
                    type="button"
                    onClick={() => void handleSaveCat()}
                    disabled={savingCat || !selectedParentId}
                    className="w-full rounded-lg bg-brand-500 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingCat ? "Saving…" : "Save Category"}
                  </button>
                )}

                {catError && <p className="text-xs text-red-600">{catError}</p>}
              </div>
            ) : (
              <p className="text-xs font-medium text-neutral-700">
                {property.category_name ?? "—"}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Main image */}
          {activeImage && (
            <div className="px-5 pt-4 sm:px-6 sm:pt-5">
              <div className="relative h-52 w-full overflow-hidden rounded-xl bg-neutral-100 sm:h-56">
                <Image src={activeImage} alt={property.title} fill className="object-cover" unoptimized />
              </div>
            </div>
          )}

          {/* Thumbnail strip */}
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-b border-neutral-100 bg-neutral-50 px-5 py-2 sm:px-6">
              {gallery.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(url)}
                  className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    activeImage === url
                      ? "border-brand-500"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}

          <div className="space-y-5 p-5 sm:space-y-6 sm:p-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-neutral-50 p-3 text-center">
                <p className="text-xs text-neutral-500">Reserve Price</p>
                <p className="mt-1 text-sm font-bold text-brand-600">
                  ${Number(property.reserve_price).toLocaleString()}
                </p>
              </div>
              {property.bedrooms != null && (
                <div className="rounded-xl bg-neutral-50 p-3 text-center">
                  <p className="text-xs text-neutral-500">Bedrooms</p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-neutral-800">
                    <BedDouble size={13} /> {property.bedrooms}
                  </p>
                </div>
              )}
              {property.bathrooms != null && (
                <div className="rounded-xl bg-neutral-50 p-3 text-center">
                  <p className="text-xs text-neutral-500">Bathrooms</p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-neutral-800">
                    <Bath size={13} /> {property.bathrooms}
                  </p>
                </div>
              )}
              {property.area_sqft != null && (
                <div className="rounded-xl bg-neutral-50 p-3 text-center">
                  <p className="text-xs text-neutral-500">Area</p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-neutral-800">
                    <Ruler size={13} /> {property.area_sqft.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Seller */}
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-600">
              <p>
                <span className="font-medium text-neutral-800">Submitted by:</span>{" "}
                {property.seller_name ?? "Unknown Seller"}
              </p>
              <p className="mt-1">
                <span className="font-medium text-neutral-800">Date:</span>{" "}
                {new Date(property.created_at).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Description */}
            {descriptionText && (
              <div>
                <p className="mb-1.5 text-sm font-semibold text-neutral-700">Description</p>
                <p className="text-sm leading-relaxed text-neutral-600">{descriptionText}</p>
              </div>
            )}

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-neutral-700">Custom Product Fields</p>
                <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-100 bg-neutral-50 px-4">
                  {customFields.map((f) => (
                    <div key={f.label} className="flex items-center justify-between py-2 text-sm">
                      <span className="font-medium text-neutral-600">{f.label}</span>
                      <span className="text-neutral-800">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3D Model */}
            {resolveMinioUrl(property.model_url) && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-neutral-700">
                  <Box size={14} /> 3D Model Preview
                </p>
                <ModelViewer
                  src={resolveMinioUrl(property.model_url)!}
                  className="h-56 w-full overflow-hidden rounded-xl"
                />
              </div>
            )}

            {/* Approval votes */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm font-semibold text-neutral-700">Approval Status</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    approvedCount >= 2
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {approvedCount} of 3
                </span>
                {approvedCount >= 2 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                    <CheckCircle2 size={12} /> Eligible for auction
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {SEATS.map((seat) => (
                  <ApproverSeatChip
                    key={seat}
                    seat={seat}
                    vote={property.votes.find((v) => v.seat === seat)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {canVote ? (
          <div className="shrink-0 border-t border-neutral-100 bg-white px-5 py-4 sm:px-6">
            {isOther || catChanged ? (
              <p className="mb-3 text-xs font-medium text-orange-700">
                {catChanged
                  ? "Save the category change before approving."
                  : "Assign a real category before approving."}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              {!isOther && !catChanged && (
                <p className="text-sm text-neutral-600">
                  Vote as{" "}
                  <span className="font-semibold capitalize">
                    {currentUserSeat?.replace("_", " & ")}
                  </span>
                </p>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  disabled={isVoting}
                  onClick={() => {
                    onVote(property.id, false);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                >
                  <XCircle size={15} className="text-danger-500" /> Reject
                </button>
                <button
                  type="button"
                  disabled={isVoting || isOther || catChanged}
                  title={
                    isOther
                      ? "Assign a real category before approving"
                      : catChanged
                      ? "Save the category change first"
                      : undefined
                  }
                  onClick={() => {
                    onVote(property.id, true);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Check size={15} /> Approve
                </button>
              </div>
            </div>
          </div>
        ) : myVote ? (
          <div className="shrink-0 border-t border-neutral-100 bg-neutral-50 px-6 py-4 text-center text-sm text-neutral-500">
            You voted:{" "}
            <span
              className={
                myVote.approved
                  ? "font-semibold text-green-600"
                  : "font-semibold text-danger-600"
              }
            >
              {myVote.approved ? "Approved" : "Rejected"}
            </span>
          </div>
        ) : null}
      </div>
    </>
  );
}
