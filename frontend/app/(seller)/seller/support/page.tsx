"use client";

import { LifeBuoy, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Select } from "@/components/ui/Select";
import {
  createTicket, deleteTicket, listMyTickets, updateTicket,
} from "@/lib/api/supportTickets";
import { listTicketSubjects } from "@/lib/api/ticketSubjects";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { SupportTicket, TicketStatus } from "@/types/supportTicket";
import type { TicketSubject } from "@/types/ticketSubject";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const OTHER_VALUE = "__other__";
const WS_BASE = (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000").replace(/^http/, "ws");

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-600",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-success-500/10 text-success-600",
  closed: "bg-neutral-100 text-neutral-500",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
};

interface FormState { id: string | null; subjectId: string; customSubject: string; message: string }
const EMPTY_FORM: FormState = { id: null, subjectId: "", customSubject: "", message: "" };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const subjectLabelFor = (ticket: SupportTicket) =>
  ticket.subject?.name ?? ticket.custom_subject ?? "Other";

export default function SellerSupportPage() {
  const { accessToken } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subjects, setSubjects] = useState<TicketSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const [ticketPage, subjectPage] = await Promise.all([
        listMyTickets(accessToken),
        listTicketSubjects(accessToken),
      ]);
      setTickets(ticketPage.items);
      setSubjects(subjectPage.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!accessToken) return;
    const ws = new WebSocket(`${WS_BASE}/api/v1/support-tickets/ws?token=${encodeURIComponent(accessToken)}`);
    ws.onmessage = (event) => {
      try {
        const { type, ticket } = JSON.parse(event.data as string) as { type: string; ticket: SupportTicket };
        if (type === "ticket_created") {
          setTickets((current) => current.some((item) => item.id === ticket.id) ? current : [ticket, ...current]);
        }
      } catch {}
    };
    return () => ws.close();
  }, [accessToken]);

  const openCreate = () => setForm(EMPTY_FORM);
  const openEdit = (ticket: SupportTicket) =>
    setForm({
      id: ticket.id,
      subjectId: ticket.subject ? ticket.subject.id : OTHER_VALUE,
      customSubject: ticket.custom_subject ?? "",
      message: ticket.message,
    });

  async function handleSave() {
    if (!accessToken || !form) return;
    const isOther = form.subjectId === OTHER_VALUE;
    if (!form.subjectId) return setError("Please choose a subject.");
    if (isOther && !form.customSubject.trim()) return setError("Please describe your issue.");
    if (!form.message.trim()) return setError("Message is required.");
    setIsSaving(true);
    setError(null);
    try {
      const payload = isOther
        ? { subject_id: null, custom_subject: form.customSubject.trim(), message: form.message.trim() }
        : { subject_id: form.subjectId, custom_subject: null, message: form.message.trim() };
      // if (form.id) 
      //   await updateTicket(accessToken, form.id, payload);
      // else await createTicket(accessToken, payload);
      // setForm(null);
      // await load();
      const saved = form.id ? await updateTicket(accessToken, form.id, payload) : await createTicket(accessToken, payload);
      if (form.id) setTickets((current) => current.map((ticket) => ticket.id === saved.id ? saved : ticket));
      setForm(null);
      toast.success(form.id ? "Ticket updated successfully" : "Support ticket submitted successfully");
    // } catch (err) {
    //   setError(err instanceof ApiRequestError ? err.message : "Failed to save.");
    // } finally {
    } catch (err) { const message = err instanceof ApiRequestError ? err.message : "Failed to save."; setError(message); toast.error(message); } 
    finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    const confirmed = await Swal.fire({ title: "Delete ticket?", text: "This cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonText: "Delete", cancelButtonText: "Cancel" });
    if (!confirmed.isConfirmed) return;
    try {
      await deleteTicket(accessToken, id);
      toast.success("Ticket deleted successfully");
      await load();
    // } catch (err) {
    //   setError(err instanceof ApiRequestError ? err.message : "Failed to delete.");
    // }
    } catch (err) { const message = err instanceof ApiRequestError ? err.message : "Failed to delete."; setError(message); toast.error(message); }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
            <LifeBuoy size={22} className="text-brand-600" />
          </div> */}
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Contact Support</h1>
            <p className="mt-0.5 text-sm text-neutral-500">Raise a ticket and track your requests.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {error && <p className="text-sm text-danger-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-neutral-500">Loading your tickets…</p>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <LifeBuoy size={28} className="mx-auto text-neutral-300" />
          <p className="mt-3 text-sm text-neutral-500">No tickets yet. Raise one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-neutral-900">{subjectLabelFor(ticket)}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{ticket.message}</p>
                  <p className="mt-2 text-xs text-neutral-400">Raised {fmtDate(ticket.created_at)}</p>
                </div>
                <div className="flex shrink-0 gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEdit(ticket)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ticket.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-danger-500/10 hover:text-danger-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">{form.id ? "Edit Ticket" : "New Ticket"}</h2>
              <button type="button" onClick={() => setForm(null)} className="text-neutral-400 hover:text-neutral-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-800">Subject</label>
                <Select
                  value={form.subjectId}
                  onChange={(v) => setForm({ ...form, subjectId: v })}
                  options={[
                    { value: "", label: "Select a subject…" },
                    ...subjects.map((s) => ({ value: s.id, label: s.name })),
                    { value: OTHER_VALUE, label: "Other" },
                  ]}
                />
              </div>

              {form.subjectId === OTHER_VALUE && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-800">Describe your issue</label>
                  <input
                    value={form.customSubject}
                    onChange={(e) => setForm({ ...form, customSubject: e.target.value })}
                    placeholder="What's this about?"
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-800">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
