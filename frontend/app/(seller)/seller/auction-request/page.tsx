"use client";

import { Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  listMyAuctionRequests,
  submitAuctionRequest,
} from "@/lib/api/auctionRequests";
import { getMyListings } from "@/lib/api/seller";
import { useAuth } from "@/lib/auth/session-context";
import type { AuctionRequest } from "@/types/auctionRequest";
import type { Property } from "@/types/property";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

export default function AuctionRequestPage() {
  const { accessToken } = useAuth();

  const [requests, setRequests] = useState<AuctionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [publishedProps, setPublishedProps] = useState<Property[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestedAt, setRequestedAt] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [openingBid, setOpeningBid] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [incrementsRaw, setIncrementsRaw] = useState("100,500,1000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    listMyAuctionRequests(accessToken)
      .then(setRequests)
      .catch(() => null)
      .finally(() => setIsLoading(false));
    getMyListings(accessToken, "published").then(setPublishedProps).catch(() => null);
  }, [accessToken, success]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    if (!title.trim() || !requestedAt) {
      setFormError("Title and requested date are required.");
      return;
    }

    const dt = new Date(requestedAt);
    const minDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    if (dt < minDate) {
      setFormError("The requested date must be at least 3 days from today.");
      return;
    }

    const hasAuctionDetails = propertyId && openingBid && reservePrice && endsAt;
    if (propertyId || openingBid || reservePrice || endsAt) {
      if (!hasAuctionDetails) {
        setFormError("If providing auction details, all fields (property, bids, end date) are required.");
        return;
      }
      if (new Date(endsAt) <= dt) {
        setFormError("Auction end date must be after the go-live date.");
        return;
      }
    }

    const increments = incrementsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    if (hasAuctionDetails && increments.length === 0) {
      setFormError("At least one bid increment is required.");
      return;
    }

    if (!accessToken) return;
    setIsSubmitting(true);
    try {
      await submitAuctionRequest(accessToken, {
        title: title.trim(),
        description: description.trim() || undefined,
        requested_at: dt.toISOString(),
        ...(hasAuctionDetails && {
          property_id: propertyId,
          opening_bid: openingBid,
          reserve_price: reservePrice,
          ends_at: new Date(endsAt).toISOString(),
          increments,
        }),
      });
      setTitle("");
      setDescription("");
      setRequestedAt("");
      setPropertyId("");
      setOpeningBid("");
      setReservePrice("");
      setEndsAt("");
      setIncrementsRaw("100,500,1000");
      setSuccess(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Request Live Auction</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Submit a request to go live. Admin must approve it before you can start the auction.
          Requests must be submitted at least <span className="font-medium">3 days in advance</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-6 space-y-5">
        <h2 className="text-base font-semibold text-neutral-800">New Request</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Auction Title <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Luxury Apartment — Bandra West"
            className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Requested Go-Live Date <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={requestedAt}
            onChange={(e) => setRequestedAt(e.target.value)}
            min={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
            className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Any notes for the admin about this auction..."
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="border-t border-neutral-100 pt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">
              Auction Details (optional)
            </p>
            <p className="text-xs text-neutral-500 mb-3">
              Fill these in so the auction is created automatically when admin approves your request.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Property</label>
            <SearchableSelect
              value={propertyId}
              options={publishedProps.map((p) => ({ value: p.id, label: p.title }))}
              placeholder="Select a published property…"
              onChange={setPropertyId}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Opening Bid ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={openingBid}
                onChange={(e) => setOpeningBid(e.target.value)}
                placeholder="e.g. 50000"
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Reserve Price ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                placeholder="e.g. 75000"
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Auction End Date</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Bid Increments ($, comma-separated)
            </label>
            <input
              value={incrementsRaw}
              onChange={(e) => setIncrementsRaw(e.target.value)}
              placeholder="100,500,1000"
              className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-xs text-neutral-400">Quick-bid button amounts. Smallest is the minimum raise.</p>
          </div>
        </div>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        {success ? (
          <p className="text-sm text-green-700">Request submitted successfully! Admin will review it shortly.</p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            <Radio size={15} />
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>

      <div>
        <h2 className="mb-4 text-base font-semibold text-neutral-800">My Requests</h2>
        {isLoading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
            <Radio size={32} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-sm text-neutral-500">No auction requests yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-neutral-900">{req.title}</p>
                    <p className="text-xs text-neutral-500">
                      Requested for:{" "}
                      {new Date(req.requested_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[req.status] ?? "bg-neutral-100 text-neutral-600"}`}
                  >
                    {req.status}
                  </span>
                </div>
                {req.admin_note ? (
                  <p className="mt-2 text-xs text-neutral-500">
                    <span className="font-medium">Admin note:</span> {req.admin_note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
