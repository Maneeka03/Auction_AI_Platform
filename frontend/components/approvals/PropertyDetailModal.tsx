"use client";

import Image from "next/image";
import { Bath, BedDouble, Box, Check, CheckCircle2, Ruler, X, XCircle } from "lucide-react";
import { useState } from "react";
import { ApproverSeatChip } from "@/components/approvals/ApproverSeatChip";
import { ModelViewer } from "@/components/properties/ModelViewer";
import { CategoryAttributes } from "@/components/categories/CategoryAttributes";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import type { ApproverSeat, Property } from "@/types/property";

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
}

export function PropertyDetailModal({ property, currentUserSeat, onVote, isVoting, onClose }: Props) {
  const gallery = [
    resolveMinioUrl(property.image_url),
    ...property.images.map((img) => resolveMinioUrl(img.image_url)),
  ].filter((url): url is string => !!url);

  const [activeImage, setActiveImage] = useState(gallery[0] ?? null);

  const { text: descriptionText, fields: customFields } = parseDescription(property.description);

  const approvedCount = property.votes.filter((v) => v.approved).length;
  const myVote = currentUserSeat ? property.votes.find((v) => v.seat === currentUserSeat) : undefined;
  const canVote = property.status === "draft" && currentUserSeat !== undefined && myVote === undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over drawer from the right */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {property.category_name}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-neutral-900">{property.title}</h2>
            <p className="mt-0.5 text-sm text-neutral-500">{property.address}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Main image — padded to align with content below */}
          {activeImage && (
            <div className="px-6 pt-5">
              <div className="relative h-56 w-full overflow-hidden rounded-xl bg-neutral-100">
                <Image src={activeImage} alt={property.title} fill className="object-cover" unoptimized />
              </div>
            </div>
          )}

          {/* Thumbnail strip */}
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-b border-neutral-100 bg-neutral-50 px-6 py-2">
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

          <div className="space-y-6 p-6">
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

            {/* Category field values */}
            {Object.keys(property.attributes).length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-neutral-700">Specifications</p>
                <CategoryAttributes attributes={property.attributes} />
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
                  className="h-56 w-full rounded-xl overflow-hidden"
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
          <div className="shrink-0 flex items-center justify-between border-t border-neutral-100 bg-white px-6 py-4">
            <p className="text-sm text-neutral-600">
              Vote as{" "}
              <span className="font-semibold capitalize">
                {currentUserSeat?.replace("_", " & ")}
              </span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isVoting}
                onClick={() => { onVote(property.id, false); onClose(); }}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
              >
                <XCircle size={15} className="text-danger-500" /> Reject
              </button>
              <button
                type="button"
                disabled={isVoting}
                onClick={() => { onVote(property.id, true); onClose(); }}
                className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                <Check size={15} /> Approve
              </button>
            </div>
          </div>
        ) : myVote ? (
          <div className="shrink-0 border-t border-neutral-100 bg-neutral-50 px-6 py-4 text-center text-sm text-neutral-500">
            You voted:{" "}
            <span className={myVote.approved ? "font-semibold text-green-600" : "font-semibold text-danger-600"}>
              {myVote.approved ? "Approved" : "Rejected"}
            </span>
          </div>
        ) : null}
      </div>
    </>
  );
}
