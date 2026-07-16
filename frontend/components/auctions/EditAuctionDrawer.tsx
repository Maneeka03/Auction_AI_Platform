"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui/Select";
import type { Auction, RoomAccess, UpdateAuctionRequest } from "@/types/auction";

interface EditAuctionDrawerProps {
  auction: Auction;
  onClose: () => void;
  onSave: (payload: UpdateAuctionRequest) => Promise<void>;
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function EditAuctionDrawer({ auction, onClose, onSave }: EditAuctionDrawerProps) {
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(auction.ends_at));
  const [reservePrice, setReservePrice] = useState(auction.reserve_price);
  const [increments, setIncrements] = useState(auction.increments.join(", "));
  const [roomAccess, setRoomAccess] = useState<RoomAccess>(auction.room_access);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const isUpcoming = auction.status === "upcoming";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const endDate = new Date(endsAt);
    if (endDate <= new Date()) {
      setError("End time must be in the future.");
      return;
    }

    const payload: UpdateAuctionRequest = {
      ends_at: endDate.toISOString(),
      reserve_price: reservePrice,
    };

    if (isUpcoming) {
      const incrementList = increments
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      if (incrementList.length === 0 || incrementList.some((v) => Number.isNaN(Number(v)))) {
        setError("Increments must be a comma-separated list of numbers.");
        return;
      }
      payload.increments = incrementList;
      payload.room_access = roomAccess;
    }

    setIsSubmitting(true);
    try {
      await onSave(payload);
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
          <h2 className="text-lg font-semibold text-neutral-900">Edit Auction</h2>
          <button type="button" onClick={handleClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Property</label>
              <input
                value={`${auction.title} — ${auction.address}`}
                disabled
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 text-sm text-neutral-500"
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

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Quick-Bid Increments ($)</label>
              <input
                value={increments}
                onChange={(e) => setIncrements(e.target.value)}
                disabled={!isUpcoming}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Room Access</label>
              <Select
                value={roomAccess}
                onChange={(v) => setRoomAccess(v as RoomAccess)}
                disabled={!isUpcoming}
                options={[
                  { value: "open", label: "Open to Everyone" },
                  { value: "invite_only", label: "Invite Only" },
                ]}
              />
              {!isUpcoming ? (
                <p className="mt-1 text-xs text-neutral-400">
                  Increments and room access can only be changed while the auction is upcoming.
                </p>
              ) : null}
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
              disabled={isSubmitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}