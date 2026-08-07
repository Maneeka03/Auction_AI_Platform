"use client";

import { Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { listAllAuctionRequests, reviewAuctionRequest } from "@/lib/api/auctionRequests";
import { useAuth } from "@/lib/auth/session-context";
import type { AuctionRequest, AuctionRequestStatus } from "@/types/auctionRequest";
import toast from "react-hot-toast";
const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

const FILTERS: { label: string; value: AuctionRequestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default function AdminAuctionRequestsPage() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<AuctionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<AuctionRequestStatus | "all">("pending");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  function load() {
    if (!accessToken) return;
    setIsLoading(true);
    listAllAuctionRequests(accessToken, filter === "all" ? undefined : filter)
      .then(setRequests)
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [accessToken, filter]);

async function handleReview(id: string, status: "approved" | "rejected") {
  if (!accessToken) return;

  setReviewing(id);

  try {
    const updated = await reviewAuctionRequest(accessToken, id, {
      status,
      admin_note: noteMap[id] || undefined,
    });

    setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));

    toast.success(
      status === "approved"
        ? "Auction request approved successfully"
        : "Auction request rejected successfully"
    );
  } catch {
    toast.error("Failed to review auction request");
  } finally {
    setReviewing(null);
  }
}

  return (
    <AdminShell>
      <RequirePermission module="auction_management" need="full">
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Auction Requests</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Review seller requests to hold a live auction. Approve or reject each one.
        </p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-brand-500 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center">
          <Radio size={32} className="mx-auto mb-3 text-neutral-300" />
          <p className="text-sm text-neutral-500">No auction requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-neutral-900">{req.title}</p>
                  <p className="text-xs text-neutral-500">
                    Seller: <span className="font-medium">{req.seller_name}</span> ({req.seller_email})
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Requested for:{" "}
                    {new Date(req.requested_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {req.description ? (
                    <p className="mt-1 text-xs text-neutral-600">{req.description}</p>
                  ) : null}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[req.status] ?? "bg-neutral-100 text-neutral-600"}`}
                >
                  {req.status}
                </span>
              </div>

              {req.status === "pending" ? (
                <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
                  <input
                    value={noteMap[req.id] ?? ""}
                    onChange={(e) => setNoteMap((prev) => ({ ...prev, [req.id]: e.target.value }))}
                    placeholder="Optional note to seller..."
                    className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-xs focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={reviewing === req.id}
                      onClick={() => void handleReview(req.id, "approved")}
                      className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {reviewing === req.id ? "Saving…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={reviewing === req.id}
                      onClick={() => void handleReview(req.id, "rejected")}
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : req.admin_note ? (
                <p className="mt-3 text-xs text-neutral-500">
                  <span className="font-medium">Admin note:</span> {req.admin_note}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
      </RequirePermission>
    </AdminShell>
  );
}
