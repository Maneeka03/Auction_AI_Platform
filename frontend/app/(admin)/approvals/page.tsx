"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { ApprovalCard } from "@/components/approvals/ApprovalCard";
import { listProperties, updateProperty } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { ApprovalItem, ApprovalOutcome, ApproverRole, ApproverVote } from "@/types/approval";
import type { Property } from "@/types/property";

function resolveApproverSeat(roles: string[]): ApproverRole | undefined {
  if (roles.includes("super_admin") || roles.includes("executive")) return "director";
  if (roles.includes("gemologist")) return "appraiser";
  if (roles.includes("legal") || roles.includes("finance")) return "legal_finance";
  return undefined;
}

const SEAT_NAMES: Record<ApproverRole, string> = {
  director: "Alisa Wilkes",
  appraiser: "Priya Nair",
  legal_finance: "Marcus Webb",
};

function freshVotes(): ApproverVote[] {
  return (["director", "appraiser", "legal_finance"] as ApproverRole[]).map((role) => ({
    role,
    name: SEAT_NAMES[role],
    status: "pending",
  }));
}

function propertyToApprovalItem(property: Property, existingVotes?: ApproverVote[]): ApprovalItem {
  return {
    id: property.id,
    lotTitle: property.title,
    category: property.category === "residential" ? "Residential" : "Commercial",
    submittedBySeller: property.seller_id ? `Seller ${property.seller_id.slice(0, 8)}` : "Unknown Seller",
    submittedAt: new Date(property.created_at).toLocaleString(),
    reservePrice: `$${Number(property.reserve_price).toLocaleString()}`,
    votes: existingVotes ?? freshVotes(),
    outcome: "awaiting_approval",
  };
}

type FilterTab = "all" | ApprovalOutcome;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "awaiting_approval", label: "Awaiting Approval" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function ApprovalsPage() {
  const { accessToken, session } = useAuth();
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const currentUserRole = session ? resolveApproverSeat(session.roles) : undefined;

  const fetchDraftProperties = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listProperties(accessToken, { status: "draft", size: 100 });
      setItems((prev) =>
        result.items.map((property) => {
          const existing = prev.find((item) => item.id === property.id);
          return propertyToApprovalItem(property, existing?.votes);
        }),
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load properties awaiting approval.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchDraftProperties();
  }, [fetchDraftProperties]);

  async function handleVote(itemId: string, role: ApproverRole, status: "approved" | "rejected") {
    let shouldPublish = false;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updatedVotes = item.votes.map((vote) =>
          vote.role === role ? { ...vote, status, decidedAt: new Date().toLocaleString() } : vote,
        );

        const approvedCount = updatedVotes.filter((v) => v.status === "approved").length;
        const rejectedCount = updatedVotes.filter((v) => v.status === "rejected").length;

        let outcome: ApprovalOutcome = "awaiting_approval";
        if (approvedCount >= 2) {
          outcome = "approved";
          shouldPublish = true;
        } else if (rejectedCount >= 2) {
          outcome = "rejected";
        }

        return { ...item, votes: updatedVotes, outcome };
      }),
    );

    if (shouldPublish && accessToken) {
      try {
        await updateProperty(accessToken, itemId, { status: "published" });
        void fetchDraftProperties();
      } catch {
        // If publishing fails server-side, leave the card showing "approved"
        // locally — the next manual refresh will reconcile against reality.
      }
    }
  }

  const filtered = activeTab === "all" ? items : items.filter((item) => item.outcome === activeTab);

  return (
    <AdminShell>
      <RequirePermission module="asset_management" need="full">
        <div className="space-y-5 p-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Approvals</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Draft properties require 2 of 3 sign-offs — Director, Appraiser, Legal &amp; Finance — before going
              live. Approving publishes the property immediately.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key ? "bg-brand-500 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading properties awaiting approval...</p>
          ) : error ? (
            <p className="text-sm text-danger-600">{error}</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
              Nothing in this category.
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((item) => (
                <ApprovalCard key={item.id} item={item} currentUserRole={currentUserRole} onVote={handleVote} />
              ))}
            </div>
          )}
        </div>
      </RequirePermission>
    </AdminShell>
  );
}