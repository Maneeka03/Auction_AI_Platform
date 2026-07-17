"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { PropertyApprovalCard } from "@/components/approvals/PropertyApprovalCard";
import { listProperties, voteOnProperty } from "@/lib/api/properties";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { ApproverSeat, Property, PropertyStatus } from "@/types/property";

function resolveApproverSeat(roles: string[]): ApproverSeat | undefined {
  if (roles.includes("super_admin") || roles.includes("executive")) return "director";
  if (roles.includes("gemologist")) return "appraiser";
  if (roles.includes("legal") || roles.includes("finance")) return "legal_finance";
  return undefined;
}

type FilterTab = "all" | PropertyStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Awaiting Approval" },
  { key: "published", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function ApprovalsPage() {
  const { accessToken, session } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const currentUserSeat = session ? resolveApproverSeat(session.roles) : undefined;

  const fetchProperties = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listProperties(accessToken, { size: 100 });
      setProperties(result.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load properties.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchProperties();
  }, [fetchProperties]);

  async function handleVote(propertyId: string, approved: boolean) {
    if (!accessToken) return;
    setVotingId(propertyId);
    setError(null);
    try {
      const updated = await voteOnProperty(accessToken, propertyId, { approved });
      setProperties((prev) => prev.map((p) => (p.id === propertyId ? updated : p)));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to cast vote.");
    } finally {
      setVotingId(null);
    }
  }

  const filtered = activeTab === "all" ? properties : properties.filter((p) => p.status === activeTab);

  return (
    <AdminShell>
      <RequirePermission module="asset_management" need="full">
        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Approvals</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Draft properties require 2 of 3 sign-offs — Director, Appraiser, Legal &amp; Finance — before
                going live.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchProperties()}
              aria-label="Refresh"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {!currentUserSeat ? (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
              Your account doesn&apos;t hold an approval seat (Director, Appraiser, or Legal &amp; Finance), so
              you can view this queue but not vote on it.
            </p>
          ) : null}

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

          {error ? <p className="text-sm text-danger-600">{error}</p> : null}

          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading properties...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
              Nothing in this category.
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((property) => (
                <PropertyApprovalCard
                  key={property.id}
                  property={property}
                  currentUserSeat={currentUserSeat}
                  onVote={handleVote}
                  isVoting={votingId === property.id}
                />
              ))}
            </div>
          )}
        </div>
      </RequirePermission>
    </AdminShell>
  );
}