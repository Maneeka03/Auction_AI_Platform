"use client";

import { ExternalLink, FileText, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { getKycDocumentUrl, listKycSubmissions, reviewKyc } from "@/lib/api/kyc";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { KycReviewItem, KycStatus } from "@/types/kyc";

type FilterTab = "all" | KycStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const statusStyles: Record<KycStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  approved: "bg-success-500/10 text-success-500",
  rejected: "bg-danger-500/10 text-danger-600",
};

export default function AdminKycReviewPage() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterTab>("pending");
  const [items, setItems] = useState<KycReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [openingKey, setOpeningKey] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listKycSubmissions(accessToken, {
        size: 100,
        status: activeTab === "all" ? undefined : activeTab,
      });
      setItems(result.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load KYC submissions.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, activeTab]);

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  async function handleDecision(item: KycReviewItem, approved: boolean) {
    if (!accessToken) return;
    setActionError(null);
    setDecidingId(item.id);
    try {
      await reviewKyc(accessToken, item.id, { approved, notes: noteDrafts[item.id] || undefined });
      void fetchQueue();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to submit review.");
    } finally {
      setDecidingId(null);
    }
  }

  async function handleViewDocument(submissionId: string, key: string) {
    if (!accessToken) return;
    setActionError(null);
    setOpeningKey(key);
    try {
      const { url } = await getKycDocumentUrl(accessToken, submissionId, key);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setActionError(
        err instanceof ApiRequestError
          ? err.message
          : "Failed to open document — the backend endpoint may not be added yet.",
      );
    } finally {
      setOpeningKey(null);
    }
  }

  return (
    <AdminShell>
      <RequirePermission module="user_management" need="full">
        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">KYC Review</h1>
              <p className="mt-1 text-sm text-neutral-600">Approve or reject identity verification submissions.</p>
            </div>
            <button
              type="button"
              onClick={() => void fetchQueue()}
              aria-label="Refresh"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
            >
              <RefreshCw size={16} />
            </button>
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

          {actionError ? <p className="text-sm text-danger-600">{actionError}</p> : null}

          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading submissions...</p>
          ) : error ? (
            <p className="text-sm text-danger-600">{error}</p>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
              Nothing in this category.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-900">{item.legal_name}</p>
                      <p className="text-sm text-neutral-500">
                        {item.full_name} · {item.email}
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        Submitted {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.document_keys.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => void handleViewDocument(item.id, key)}
                        disabled={openingKey === key}
                        className="flex items-center gap-1.5 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-60"
                      >
                        <FileText size={12} />
                        {key.split("/").pop()}
                        <ExternalLink size={11} className="text-neutral-400" />
                      </button>
                    ))}
                  </div>

                  {item.notes ? (
                    <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                      <span className="font-medium text-neutral-700">Notes:</span> {item.notes}
                    </p>
                  ) : null}

                  {item.status === "pending" ? (
                    <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
                      <input
                        value={noteDrafts[item.id] ?? ""}
                        onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Optional note (visible to the applicant)"
                        className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={decidingId === item.id}
                          onClick={() => void handleDecision(item, false)}
                          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={decidingId === item.id}
                          onClick={() => void handleDecision(item, true)}
                          className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                        >
                          {decidingId === item.id ? "Saving..." : "Approve"}
                        </button>
                      </div>
                    </div>
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