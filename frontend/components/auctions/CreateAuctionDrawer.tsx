"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui/Select";
import { listProperties } from "@/lib/api/properties";
import { useAuth } from "@/lib/auth/session-context";
import type { CreateAuctionRequest, RoomAccess } from "@/types/auction";
import type { Property } from "@/types/property";

interface CreateAuctionDrawerProps {
  onClose: () => void;
  onCreate: (payload: CreateAuctionRequest) => Promise<void>;
}

export function CreateAuctionDrawer({ onClose, onCreate }: CreateAuctionDrawerProps) {
  const { accessToken } = useAuth();
  const [publishedProperties, setPublishedProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);

  const [propertyId, setPropertyId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [openingBid, setOpeningBid] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [increments, setIncrements] = useState("10, 50, 100");
  const [roomAccess, setRoomAccess] = useState<RoomAccess>("open");
  const [tokenPercent, setTokenPercent] = useState("100");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    async function fetchPublished() {
      if (!accessToken) return;
      setIsLoadingProperties(true);
      try {
        const result = await listProperties(accessToken, { status: "published", size: 100 });
        setPublishedProperties(result.items);
      } catch {
      } finally {
        setIsLoadingProperties(false);
      }
    }
    void fetchPublished();
  }, [accessToken]);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!propertyId || !startsAt || !endsAt || !openingBid || !reservePrice) {
      setError("Property, start/end time, opening bid, and reserve price are all required.");
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    if (endDate <= startDate) {
      setError("End time must be after start time.");
      return;
    }
    if (endDate <= new Date()) {
      setError("End time must be in the future.");
      return;
    }

    const incrementList = increments
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (incrementList.length === 0 || incrementList.some((v) => Number.isNaN(Number(v)))) {
      setError("Increments must be a comma-separated list of numbers, e.g. 10, 50, 100.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        property_id: propertyId,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        opening_bid: openingBid,
        reserve_price: reservePrice,
        increments: incrementList,
        room_access: roomAccess,
        token_percent: tokenPercent,
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
          <h2 className="text-lg font-semibold text-neutral-900">Create Auction</h2>
          <button type="button" onClick={handleClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Property <span className="text-danger-500">*</span>
              </label>
              {isLoadingProperties ? (
                <p className="text-sm text-neutral-500">Loading published properties...</p>
              ) : publishedProperties.length === 0 ? (
                <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                  No published properties available. Only a published property can be auctioned — publish one
                  from Listings first.
                </p>
              ) : (
                <Select
                  value={propertyId}
                  onChange={setPropertyId}
                  placeholder="Select a property"
                  options={publishedProperties.map((property) => ({
                    value: property.id,
                    label: `${property.title} — ${property.address}`,
                  }))}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                  Starts At <span className="text-danger-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                  Ends At <span className="text-danger-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                  Opening Bid ($) <span className="text-danger-500">*</span>
                </label>
                <input
                  type="number"
                  value={openingBid}
                  onChange={(e) => setOpeningBid(e.target.value)}
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
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
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Quick-Bid Increments ($) <span className="text-danger-500">*</span>
              </label>
              <input
                value={increments}
                onChange={(e) => setIncrements(e.target.value)}
                placeholder="10, 50, 100"
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-xs text-neutral-400">
                Comma-separated. The smallest value is also the minimum raise for a custom bid.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Room Access</label>
              <Select
                value={roomAccess}
                onChange={(v) => setRoomAccess(v as RoomAccess)}
                options={[
                  { value: "open", label: "Open to Everyone" },
                  { value: "invite_only", label: "Invite Only" },
                ]}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Token Percent (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={tokenPercent}
                onChange={(e) => setTokenPercent(e.target.value)}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <p className="mt-1 text-xs text-neutral-400">
                100 = bidders must have the full bid amount free in their wallet. Lower values take a token
                deposit instead — e.g. 10 locks 10% of each bid.
              </p>
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
              disabled={isSubmitting || publishedProperties.length === 0}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create Auction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}