"use client";

import { Radio, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { getMyAuctions, getMyListings } from "@/lib/api/seller";
import { listMyAuctionRequests, submitAuctionRequest } from "@/lib/api/auctionRequests";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Auction } from "@/types/auction";
import type { AuctionRequest } from "@/types/auctionRequest";
import type { Property } from "@/types/property";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-amber-50 text-amber-700",
  live: "bg-green-50 text-green-700",
  ended: "bg-neutral-100 text-neutral-600",
};

const REQUEST_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AddLiveAuctionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { accessToken } = useAuth();
  const [publishedProps, setPublishedProps] = useState<Property[]>([]);

  const [title, setTitle] = useState("");
  const [requestedAt, setRequestedAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [openingBid, setOpeningBid] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [incrementsRaw, setIncrementsRaw] = useState("100,500,1000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  useEffect(() => {
    if (!accessToken) return;
    getMyListings(accessToken, "published")
      .then(setPublishedProps)
      .catch(() => null);
  }, [accessToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !requestedAt) {
      setError("Title and go-live date are required.");
      return;
    }
    const dt = new Date(requestedAt);
    if (dt < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) {
      setError("Go-live date must be at least 3 days from today.");
      return;
    }
    if (!accessToken) return;

    const hasAuctionDetails = propertyId && openingBid && reservePrice && endsAt;
    if (propertyId || openingBid || reservePrice || endsAt) {
      if (!hasAuctionDetails) {
        setError("If providing auction details, all fields (property, bids, end date) are required.");
        return;
      }
      if (new Date(endsAt) <= dt) {
        setError("Auction end date must be after the go-live date.");
        return;
      }
    }

    const increments = incrementsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (hasAuctionDetails && increments.length === 0) {
      setError("At least one bid increment is required.");
      return;
    }

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
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputCls = "h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Add Live Auction</h2>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Auction Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Luxury Apartment — Bandra West"
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Go-Live Date <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={requestedAt}
              min={minDate}
              onChange={(e) => setRequestedAt(e.target.value)}
              className={inputCls}
            />
            <p className="mt-1 text-xs text-neutral-400">Must be at least 3 days from today.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Notes (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Any details for the admin…"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Auction Details (optional — fills in automatically on approval)
            </p>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Property</label>
                <SearchableSelect
                  value={propertyId}
                  options={publishedProps.map((p) => ({ value: p.id, label: p.title }))}
                  placeholder="Select a published property…"
                  onChange={setPropertyId}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">Opening Bid ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={openingBid}
                    onChange={(e) => setOpeningBid(e.target.value)}
                    placeholder="e.g. 50000"
                    className={inputCls}
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
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">Auction End Date</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className={inputCls}
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
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-neutral-400">Quick-bid button amounts. Smallest is the minimum raise.</p>
              </div>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              <Radio size={14} />
              {isSubmitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SellerAuctionsPage() {
  const { accessToken } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [requests, setRequests] = useState<AuctionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  function load() {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      getMyAuctions(accessToken).catch(() => [] as Auction[]),
      listMyAuctionRequests(accessToken).catch(() => [] as AuctionRequest[]),
    ])
      .then(([a, r]) => {
        setAuctions(a);
        setRequests(r);
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [accessToken]);

  function handleSuccess() {
    setShowModal(false);
    load();
  }

  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Live Auctions</h1>
            <p className="mt-0.5 text-sm text-neutral-500">Manage your active and upcoming live auctions.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Radio size={15} /> Add Live Auction
          </button>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : (
          <>
            {/* Pending requests */}
            {requests.length > 0 ? (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                  Auction Requests
                </h2>
                <div className="space-y-2">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{req.title}</p>
                        <p className="text-xs text-neutral-500">Go-live: {formatDate(req.requested_at)}</p>
                        {req.admin_note ? (
                          <p className="text-xs text-neutral-400">Note: {req.admin_note}</p>
                        ) : null}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${REQUEST_COLORS[req.status] ?? "bg-neutral-100 text-neutral-600"}`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Active auctions */}
            {auctions.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
                <Radio size={32} className="mx-auto mb-3 text-neutral-300" />
                <p className="text-sm font-medium text-neutral-600">No live auctions yet</p>
                <p className="mt-1 text-xs text-neutral-400">
                  Add a live auction above — admin approves it and you&apos;re live.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                  Active Auctions
                </h2>
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="border-b border-neutral-100 bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">Property</th>
                        <th className="px-4 py-3 text-right font-medium text-neutral-600">Current Bid</th>
                        <th className="px-4 py-3 text-right font-medium text-neutral-600">Reserve</th>
                        <th className="px-4 py-3 text-center font-medium text-neutral-600">Bidders</th>
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">Ends</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {auctions.map((a) => (
                        <tr key={a.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 font-medium text-neutral-900">{a.title}</td>
                          <td className="px-4 py-3 text-right font-semibold text-brand-600">
                            {a.current_bid ? `$${Number(a.current_bid).toLocaleString()}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-neutral-600">
                            ${Number(a.reserve_price).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center text-neutral-600">{a.bidder_count}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[a.status] ?? "bg-neutral-100 text-neutral-600"}`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-500">{formatDate(a.ends_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal ? (
        <AddLiveAuctionModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
      ) : null}
    </>
  );
}
