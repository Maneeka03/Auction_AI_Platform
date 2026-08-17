"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyListings } from "@/lib/api/seller";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { Property } from "@/types/property";
import toast from "react-hot-toast";

const VOTE_LABEL: Record<string, string> = {
  director: "Director",
  appraiser: "Appraiser",
  legal_finance: "Legal & Finance",
};

export default function PendingVerificationPage() {
  const { accessToken } = useAuth();
  const [listings, setListings] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getMyListings(accessToken)
      .then((all) => setListings(all.filter((p) => p.status === "draft")))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Failed to load listings."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Pending Verification</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Listings awaiting 2-of-3 panel approval before going live.
        </p>
      </div>

      {error ? <p className="text-sm text-danger-600">{error}</p> : null}

      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
          <Clock size={32} className="mx-auto mb-3 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-600">No listings pending verification</p>
          <p className="mt-1 text-xs text-neutral-400">
            Once you submit a listing it will appear here until approved.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const approvedCount = listing.votes?.filter((v) => v.approved).length ?? 0;
            return (
              <div key={listing.id} className="rounded-xl border border-neutral-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                      {listing.category_name}
                    </p>
                    <h3 className="mt-0.5 text-base font-semibold text-neutral-900">{listing.title}</h3>
                    <p className="text-xs text-neutral-500">{listing.address}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    Awaiting Approval
                  </span>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-neutral-500">
                    Approval progress — {approvedCount} of 3 seats voted
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["director", "appraiser", "legal_finance"] as const).map((seat) => {
                      const vote = listing.votes?.find((v) => v.seat === seat);
                      return (
                        <span
                          key={seat}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            vote
                              ? vote.approved
                                ? "bg-green-50 text-green-700"
                                : "bg-danger-50 text-danger-600"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {VOTE_LABEL[seat]} {vote ? (vote.approved ? "✓" : "✗") : "—"}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <p className="mt-3 text-sm font-semibold text-neutral-900">
                  Reserve: ${Number(listing.reserve_price).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

