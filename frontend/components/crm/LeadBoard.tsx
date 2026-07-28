"use client";

import { Pencil, Plus, StickyNote, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Lead, LeadStatus } from "@/types/crm";

interface LeadBoardProps {
  leads: Lead[];
  canManage: boolean;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onQuickAdd: (status: LeadStatus) => void;
}

const COLUMNS: { status: LeadStatus; label: string; barColor: string; dotColor: string }[] = [
  { status: "new", label: "New", barColor: "bg-sky-500", dotColor: "bg-sky-500" },
  { status: "contacted", label: "Contacted", barColor: "bg-amber-500", dotColor: "bg-amber-500" },
  { status: "qualified", label: "Qualified", barColor: "bg-purple-500", dotColor: "bg-purple-500" },
  { status: "won", label: "Won", barColor: "bg-success-500", dotColor: "bg-success-500" },
  { status: "lost", label: "Lost", barColor: "bg-danger-500", dotColor: "bg-danger-500" },
];

function LeadCard({
  lead,
  canManage,
  onEdit,
  onDelete,
}: {
  lead: Lead;
  canManage: boolean;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-neutral-900">{lead.name}</p>
        {lead.notes ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotes((prev) => !prev)}
              title={lead.notes}
              aria-label={`View notes for ${lead.name}`}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <StickyNote size={14} />
            </button>
            {showNotes ? (
              <div className="absolute right-0 top-7 z-20 w-56 rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-600 shadow-lg">
                {lead.notes}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-2 space-y-1 text-xs text-neutral-500">
        {lead.company_name ? <p className="font-medium text-neutral-600">{lead.company_name}</p> : null}
        {lead.email ? <p className="truncate">{lead.email}</p> : null}
        {lead.phone ? <p>{lead.phone}</p> : null}
        {lead.source ? <p className="text-neutral-400">Source: {lead.source}</p> : null}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            lead.owner_id ? "bg-brand-50 text-brand-700" : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {lead.owner_id ? "Assigned" : "Unassigned"}
        </span>
        {canManage ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(lead)}
              aria-label={`Edit ${lead.name}`}
              className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(lead)}
              aria-label={`Delete ${lead.name}`}
              className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-danger-500/10 hover:text-danger-600"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function LeadBoard({ leads, canManage, onEdit, onDelete, onQuickAdd }: LeadBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {COLUMNS.map((column) => {
        const columnLeads = leads.filter((lead) => lead.status === column.status);
        return (
          <div key={column.status} className="rounded-xl border border-neutral-200 bg-neutral-50">
            <div className={`h-1 rounded-t-xl ${column.barColor}`} />
            <div className="flex items-center justify-between p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                <span className={`h-2 w-2 rounded-full ${column.dotColor}`} />
                {column.label}
                <span className="font-normal text-neutral-400">{columnLeads.length}</span>
              </p>
              {canManage ? (
                <button
                  type="button"
                  onClick={() => onQuickAdd(column.status)}
                  aria-label={`Add lead to ${column.label}`}
                  className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-white hover:text-neutral-700"
                >
                  <Plus size={14} />
                </button>
              ) : null}
            </div>
            <div className="space-y-3 px-3 pb-3">
              {columnLeads.length === 0 ? (
                <p className="rounded-lg border border-dashed border-neutral-200 py-6 text-center text-xs text-neutral-400">
                  No leads here
                </p>
              ) : (
                columnLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} canManage={canManage} onEdit={onEdit} onDelete={onDelete} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}