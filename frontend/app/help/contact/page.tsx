"use client";

import { LifeBuoy, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { createTicket, deleteTicket, listMyTickets, updateTicket } from "@/lib/api/supportTickets";
import {
  createTicketSubject,
  deleteTicketSubject,
  listAllTicketSubjects,
  listTicketSubjects,
  updateTicketSubject,
} from "@/lib/api/ticketSubjects";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { SupportTicket, TicketStatus } from "@/types/supportTicket";
import type { TicketSubject } from "@/types/ticketSubject";
import { Select } from "@/components/ui/Select";

const OTHER_VALUE = "__other__";

interface FormState {
  id: string | null;
  subjectId: string;
  customSubject: string;
  message: string;
}

const EMPTY_FORM: FormState = { id: null, subjectId: "", customSubject: "", message: "" };

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-600",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-success-500/10 text-success-600",
  closed: "bg-neutral-100 text-neutral-500",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ContactSupportPage() {
  const { session, accessToken } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subjects, setSubjects] = useState<TicketSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isManagerMounted, setIsManagerMounted] = useState(false);
  const [isManagerVisible, setIsManagerVisible] = useState(false);
  const [allSubjects, setAllSubjects] = useState<TicketSubject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string } | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);

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
      setError(err instanceof ApiRequestError ? err.message : "Failed to load your tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadAllSubjects = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingSubjects(true);
    setSubjectError(null);
    try {
      const page = await listAllTicketSubjects(accessToken);
      setAllSubjects(page.items);
    } catch (err) {
      setSubjectError(err instanceof ApiRequestError ? err.message : "Failed to load subjects.");
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [accessToken]);

  function openManager() {
    setIsManagerMounted(true);
    void loadAllSubjects();
  }
  useEffect(() => {
    if (!isManagerMounted) return;
    const frame = requestAnimationFrame(() => setIsManagerVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isManagerMounted]);

  function closeManager() {
    setIsManagerVisible(false);
    setTimeout(() => setIsManagerMounted(false), 200);
  }

  async function refreshEverything() {
    await Promise.all([loadAllSubjects(), load()]);
  }

  async function handleCreateSubject() {
    if (!accessToken || !newSubjectName.trim()) return;
    setSubjectError(null);
    try {
      await createTicketSubject(accessToken, newSubjectName.trim());
      setNewSubjectName("");
      await refreshEverything();
    } catch (err) {
      setSubjectError(err instanceof ApiRequestError ? err.message : "Failed to create subject.");
    }
  }

  async function handleUpdateSubject() {
    if (!accessToken || !editingSubject || !editingSubject.name.trim()) return;
    setSubjectError(null);
    try {
      await updateTicketSubject(accessToken, editingSubject.id, { name: editingSubject.name.trim() });
      setEditingSubject(null);
      await refreshEverything();
    } catch (err) {
      setSubjectError(err instanceof ApiRequestError ? err.message : "Failed to update subject.");
    }
  }

  async function handleToggleActive(subject: TicketSubject) {
    if (!accessToken) return;
    try {
      await updateTicketSubject(accessToken, subject.id, { is_active: !subject.is_active });
      await refreshEverything();
    } catch (err) {
      setSubjectError(err instanceof ApiRequestError ? err.message : "Failed to update subject.");
    }
  }

  async function handleDeleteSubject(id: string) {
    if (!accessToken) return;
    if (!window.confirm("Delete this subject? It will show as 'Other' on any existing tickets that used it.")) return;
    try {
      await deleteTicketSubject(accessToken, id);
      await refreshEverything();
    } catch (err) {
      setSubjectError(err instanceof ApiRequestError ? err.message : "Failed to delete subject.");
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
  }

  function openEdit(ticket: SupportTicket) {
    setForm({
      id: ticket.id,
      subjectId: ticket.subject ? ticket.subject.id : OTHER_VALUE,
      customSubject: ticket.custom_subject ?? "",
      message: ticket.message,
    });
  }

  function subjectLabel(ticket: SupportTicket): string {
    return ticket.subject?.name ?? ticket.custom_subject ?? "Other";
  }

  async function handleSave() {
    if (!accessToken || !form) return;
    const isOther = form.subjectId === OTHER_VALUE;

    if (!form.subjectId) {
      setError("Please choose a subject.");
      return;
    }
    if (isOther && !form.customSubject.trim()) {
      setError("Please describe your issue in the subject field.");
      return;
    }
    if (!form.message.trim()) {
      setError("Message is required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = isOther
        ? { subject_id: null, custom_subject: form.customSubject.trim(), message: form.message.trim() }
        : { subject_id: form.subjectId, custom_subject: null, message: form.message.trim() };

      if (form.id) {
        await updateTicket(accessToken, form.id, payload);
      } else {
        await createTicket(accessToken, payload);
      }
      setForm(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    if (!window.confirm("Delete this ticket? This can't be undone.")) return;
    try {
      await deleteTicket(accessToken, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to delete.");
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-6 text-center">
        <div>
          <p className="text-sm text-neutral-600">Sign in to view or raise a support ticket.</p>
          <Link href="/login" className="mt-3 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminShell>
      <div className="min-h-screen bg-neutral-50">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <LifeBuoy size={22} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">Contact Support</h1>
                <p className="mt-0.5 text-sm text-neutral-500">Raise a ticket and track your own requests.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <RequirePermission module="system_settings" need="view">
                <button
                  type="button"
                  onClick={openManager}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:flex-none"
                >
                  <Settings2 size={16} /> Manage Subjects
                </button>
              </RequirePermission>
              <button
                type="button"
                onClick={openCreate}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 sm:flex-none"
              >
                <Plus size={16} /> New Ticket
              </button>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-danger-600">{error}</p> : null}

          <div className="mt-6">
            {isLoading ? (
              <p className="text-sm text-neutral-500">Loading your tickets...</p>
            ) : tickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center sm:p-12">
                <LifeBuoy size={28} className="mx-auto text-neutral-300" />
                <p className="mt-3 text-sm text-neutral-500">You haven't raised any tickets yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-neutral-900">{subjectLabel(ticket)}</p>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
                            {STATUS_LABELS[ticket.status]}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{ticket.message}</p>
                        <p className="mt-2 text-xs text-neutral-400">Raised {formatDate(ticket.created_at)}</p>
                      </div>
                      {/* Always visible on touch devices (no hover state); fades in on hover for pointer devices */}
                      <div className="flex shrink-0 gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openEdit(ticket)}
                          aria-label="Edit"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ticket.id)}
                          aria-label="Delete"
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
          </div>
        </div>

        {/* New/Edit ticket modal */}
        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl sm:p-6">
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
      { value: "", label: "Select a subject..." },
      ...subjects.map((subject) => ({ value: subject.id, label: subject.name })),
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

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin-only: manage ticket subjects slide-over */}
        <RequirePermission module="system_settings" need="view">
          {isManagerMounted && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div
                className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 ${
                  isManagerVisible ? "opacity-100" : "opacity-0"
                }`}
                onClick={closeManager}
              />
              <div
                className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${
                  isManagerVisible ? "translate-x-0" : "translate-x-full"
                }`}
              >
                <div className="flex items-center justify-between border-b border-neutral-200 p-5">
                  <h2 className="text-lg font-semibold text-neutral-900">Manage Ticket Subjects</h2>
                  <button type="button" onClick={closeManager} className="text-neutral-400 hover:text-neutral-600">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateSubject()}
                      placeholder="New subject name..."
                      className="h-11 flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateSubject}
                      disabled={!newSubjectName.trim()}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>

                  {subjectError ? <p className="mt-3 text-sm text-danger-600">{subjectError}</p> : null}

                  <div className="mt-5 space-y-2">
                    {isLoadingSubjects ? (
                      <p className="text-sm text-neutral-500">Loading subjects...</p>
                    ) : allSubjects.length === 0 ? (
                      <p className="text-sm text-neutral-500">No subjects yet — the one above will be the first.</p>
                    ) : (
                      allSubjects.map((subject) => (
                        <div
                          key={subject.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 p-3"
                        >
                          {editingSubject?.id === subject.id ? (
                            <input
                              value={editingSubject.name}
                              onChange={(e) => setEditingSubject({ id: subject.id, name: e.target.value })}
                              onKeyDown={(e) => e.key === "Enter" && handleUpdateSubject()}
                              autoFocus
                              className="h-9 min-w-0 flex-1 rounded-lg border border-neutral-200 px-2 text-sm focus:border-brand-500 focus:outline-none"
                            />
                          ) : (
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate text-sm font-medium text-neutral-900">{subject.name}</p>
                              {!subject.is_active && (
                                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                                  Inactive
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex shrink-0 gap-1">
                            {editingSubject?.id === subject.id ? (
                              <button
                                type="button"
                                onClick={handleUpdateSubject}
                                className="rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                              >
                                Save
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(subject)}
                                  className="rounded-lg px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
                                >
                                  {subject.is_active ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSubject({ id: subject.id, name: subject.name })}
                                  aria-label="Edit"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-brand-50 hover:text-brand-600"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubject(subject.id)}
                                  aria-label="Delete"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-danger-500/10 hover:text-danger-600"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </RequirePermission>
      </div>
    </AdminShell>
  );
}