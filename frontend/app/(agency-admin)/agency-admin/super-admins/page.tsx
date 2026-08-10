"use client";

import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  UserX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSuperAdmin,
  deleteSuperAdmin,
  listSuperAdmins,
  updateSuperAdmin,
  type SuperAdmin,
} from "@/lib/api/agency";
import { useAuth } from "@/lib/auth/session-context";

const PAGE_SIZE = 25;

function StatusBadge({ status }: { status: SuperAdmin["status"] }) {
  const map = {
    active: "bg-success-50 text-success-700",
    suspended: "bg-amber-50 text-amber-700",
    deleted: "bg-danger-50 text-danger-700",
    pending_verification: "bg-blue-50 text-blue-700",
  } as const;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${map[status] ?? "bg-neutral-100 text-neutral-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (admin: SuperAdmin) => void;
}) {
  const { accessToken } = useAuth();
  const [form, setForm] = useState({ email: "", full_name: "", country: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.full_name.trim() || form.full_name.trim().length < 2) e.full_name = "Name must be at least 2 characters";
    if (form.country && form.country.length !== 2) e.country = "Use a 2-letter country code (e.g. US)";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const admin = await createSuperAdmin(accessToken!, {
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        ...(form.country ? { country: form.country.toUpperCase() } : {}),
      });
      onCreated(admin);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create super admin";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Create Super Admin</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Full Name
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="John Smith"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-violet-500 dark:bg-neutral-800 dark:text-white ${errors.full_name ? "border-danger-500" : "border-neutral-300 dark:border-neutral-600"}`}
            />
            {errors.full_name ? <p className="mt-1 text-xs text-danger-600">{errors.full_name}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="admin@company.com"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-violet-500 dark:bg-neutral-800 dark:text-white ${errors.email ? "border-danger-500" : "border-neutral-300 dark:border-neutral-600"}`}
            />
            {errors.email ? <p className="mt-1 text-xs text-danger-600">{errors.email}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Country Code <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              placeholder="US"
              maxLength={2}
              className={`w-full rounded-lg border px-3 py-2 text-sm uppercase outline-none transition focus:ring-2 focus:ring-violet-500 dark:bg-neutral-800 dark:text-white ${errors.country ? "border-danger-500" : "border-neutral-300 dark:border-neutral-600"}`}
            />
            {errors.country ? <p className="mt-1 text-xs text-danger-600">{errors.country}</p> : null}
          </div>

          {serverError ? (
            <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{serverError}</p>
          ) : null}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RowMenu({ admin, onUpdated, onDeleted }: { admin: SuperAdmin; onUpdated: (a: SuperAdmin) => void; onDeleted: (id: string) => void }) {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function toggleStatus() {
    setBusy(true);
    setOpen(false);
    try {
      const next = admin.status === "active" ? "suspended" : "active";
      const updated = await updateSuperAdmin(accessToken!, admin.id, { status: next });
      onUpdated(updated);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${admin.full_name}? This cannot be undone.`)) return;
    setBusy(true);
    setOpen(false);
    try {
      await deleteSuperAdmin(accessToken!, admin.id);
      onDeleted(admin.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={busy}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 disabled:opacity-50"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <MoreVertical size={15} />}
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          <button
            type="button"
            onClick={toggleStatus}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            {admin.status === "active" ? (
              <><UserX size={14} /> Suspend</>
            ) : (
              <><CheckCircle size={14} /> Activate</>
            )}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger-600 hover:bg-danger-500/5"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function SuperAdminsPage() {
  const { accessToken } = useAuth();
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await listSuperAdmins(accessToken, { page, size: PAGE_SIZE, search: search || undefined });
      setAdmins(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search]);

  useEffect(() => { void load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleCreated(admin: SuperAdmin) {
    setShowCreate(false);
    setAdmins((prev) => [admin, ...prev]);
    setTotal((t) => t + 1);
  }

  function handleUpdated(updated: SuperAdmin) {
    setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  function handleDeleted(id: string) {
    setAdmins((prev) => prev.filter((a) => a.id !== id));
    setTotal((t) => t - 1);
  }

  return (
    <>
      {showCreate ? (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      ) : null}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Super Admins</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {total} account{total !== 1 ? "s" : ""} — each operates in full isolation
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus size={16} /> New Super Admin
        </button>
      </div>

      <div className="mb-4">
        <form onSubmit={handleSearch} className="relative max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-violet-600" />
          </div>
        ) : admins.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-500">
            {search ? "No super admins match your search." : "No super admins yet. Create one to get started."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-700">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Name</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400 sm:table-cell">Email</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400 md:table-cell">Country</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">Status</th>
                <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400 lg:table-cell">Last Login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                        {admin.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{admin.full_name}</p>
                        <p className="text-xs text-neutral-500 sm:hidden">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-600 dark:text-neutral-300 sm:table-cell">{admin.email}</td>
                  <td className="hidden px-4 py-3 text-neutral-600 dark:text-neutral-300 md:table-cell">
                    {admin.country ?? <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={admin.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                    {admin.last_login_at
                      ? new Date(admin.last_login_at).toLocaleDateString()
                      : <span className="text-neutral-400">Never</span>}
                  </td>
                  <td className="px-4 py-3">
                    <RowMenu admin={admin} onUpdated={handleUpdated} onDeleted={handleDeleted} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 hover:bg-neutral-50 disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
