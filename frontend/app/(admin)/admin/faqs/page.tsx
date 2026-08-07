"use client";

import { HelpCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { createFaq, deleteFaq, listFaqs, updateFaq } from "@/lib/api/faqs";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { FAQ } from "@/types/faq";

interface FormState {
  id: string | null;
  question: string;
  answer: string;
  category: string;
  sort_order: string;
  is_published: boolean;
}

const EMPTY_FORM: FormState = {
  id: null,
  question: "",
  answer: "",
  category: "",
  sort_order: "0",
  is_published: true,
};

const CATEGORY_STYLES = [
  "bg-brand-50 text-brand-600",
  "bg-blue-50 text-blue-600",
  "bg-success-500/10 text-success-600",
  "bg-amber-50 text-amber-700",
  "bg-fuchsia-50 text-fuchsia-600",
  "bg-teal-50 text-teal-700",
];

function categoryStyle(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return CATEGORY_STYLES[hash % CATEGORY_STYLES.length];
}

export default function AdminFaqsPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const page = await listFaqs(accessToken);
      setItems(page.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load FAQs.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setForm(EMPTY_FORM);
  }

  function openEdit(faq: FAQ) {
    setForm({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category ?? "",
      sort_order: String(faq.sort_order),
      is_published: faq.is_published,
    });
  }

  async function handleSave() {
    if (!accessToken || !form) return;
    if (!form.question.trim() || !form.answer.trim()) {
      setError("Question and answer are required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_published: form.is_published,
      };
      if (form.id) {
        await updateFaq(accessToken, form.id, payload);
      } else {
        await createFaq(accessToken, payload);
      }
      setForm(null);
      toast.success(form.id ? "FAQ updated successfully" : "FAQ created successfully");
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    const confirmed = await Swal.fire({ title: "Delete FAQ?", text: "This cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonText: "Delete", cancelButtonText: "Cancel" });
    if (!confirmed.isConfirmed) return;
    try {
      await deleteFaq(accessToken, id);
      toast.success("FAQ deleted successfully");
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to delete.");
    }
  }

  return (
    <AdminShell>
      <RequirePermission module="system_settings" need="view">
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/10 to-violet-600/10 text-brand-600">
                <HelpCircle size={22} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">FAQs</h1>
                <p className="mt-0.5 text-sm text-neutral-500">
                  Manage the questions shown on the public Help & FAQ page.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
            >
              <Plus size={16} /> Add FAQ
            </button>
          </div>

          {error ? <p className="text-sm text-danger-600">{error}</p> : null}

          {/* List */}
          {isLoading ? (
            <p className="text-sm text-neutral-500">Loading FAQs...</p>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
              <HelpCircle size={28} className="mx-auto text-neutral-300" />
              <p className="mt-3 text-sm text-neutral-500">No FAQs yet. Add the first one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((faq) => (
                <div
                  key={faq.id}
                  className={`group flex items-start justify-between gap-4 rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    faq.is_published ? "border-neutral-200" : "border-dashed border-neutral-300 opacity-75"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-neutral-900">{faq.question}</p>
                      {!faq.is_published && (
                        <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                          Draft
                        </span>
                      )}
                      {faq.category && (
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyle(faq.category)}`}>
                          {faq.category}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{faq.answer}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(faq)}
                      aria-label="Edit"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(faq.id)}
                      aria-label="Delete"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-danger-500/10 hover:text-danger-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {form.id ? "Edit FAQ" : "Add FAQ"}
                </h2>
                <button type="button" onClick={() => setForm(null)} className="text-neutral-400 hover:text-neutral-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-800">Question</label>
                  <input
                    value={form.question}
                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-800">Answer</label>
                  <textarea
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    rows={4}
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-800">Category</label>
                    <input
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Optional"
                      className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-800">Sort Order</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                      className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    className="h-4 w-4 rounded border-neutral-300 text-brand-500"
                  />
                  Published (visible on the public FAQ page)
                </label>
              </div>

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
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </RequirePermission>
    </AdminShell>
  );
}
