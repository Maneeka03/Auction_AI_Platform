"use client";

import { useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { ApprovalCard } from "@/components/approvals/ApprovalCard";
import { approvalQueue } from "@/lib/mock/approvals";
import { useAuth } from "@/lib/auth/session-context";
import type { ApprovalItem, ApprovalOutcome, ApproverRole } from "@/types/approval";

function resolveApproverSeat(roles: string[]): ApproverRole | undefined {
  if (roles.includes("super_admin") || roles.includes("executive")) return "director";
  if (roles.includes("gemologist")) return "appraiser";
  if (roles.includes("legal") || roles.includes("finance")) return "legal_finance";
  return undefined;
}

type FilterTab = "all" | ApprovalOutcome;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "awaiting_approval", label: "Awaiting Approval" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function ApprovalsPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<ApprovalItem[]>(approvalQueue);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const currentUserRole = session ? resolveApproverSeat(session.roles) : undefined;
  const filtered = activeTab === "all" ? items : items.filter((item) => item.outcome === activeTab);

  function handleVote(itemId: string, role: ApproverRole, status: "approved" | "rejected") {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const updatedVotes = item.votes.map((vote) =>
          vote.role === role ? { ...vote, status, decidedAt: new Date().toLocaleString() } : vote,
        );

        const approvedCount = updatedVotes.filter((v) => v.status === "approved").length;
        const rejectedCount = updatedVotes.filter((v) => v.status === "rejected").length;

        let outcome: ApprovalOutcome = "awaiting_approval";
        if (approvedCount >= 2) outcome = "approved";
        else if (rejectedCount >= 2) outcome = "rejected";

        return { ...item, votes: updatedVotes, outcome };
      }),
    );
  }

  return (
    <AdminShell>
      <RequirePermission module="auction_management" need="view">
        <div className="space-y-5 p-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Approvals</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Properties require 2 of 3 sign-offs — Director, Appraiser, Legal &amp; Finance — before going live.
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

          {filtered.length === 0 ? (
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