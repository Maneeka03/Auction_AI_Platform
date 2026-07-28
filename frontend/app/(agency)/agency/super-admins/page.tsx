"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  MoreVertical,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Upload,
  User,
  UserPen,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AgencyShell } from "@/components/layout/AgencyShell";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import {
  createSuperAdmin,
  deleteSuperAdmin,
  listSidebarItems,
  listSuperAdmins,
  updateSuperAdmin,
  updateSuperAdminBranding,
  saveSuperAdminSidebar,
} from "@/lib/api/agency";
import { ApiRequestError } from "@/lib/api/client";
import { uploadImage } from "@/lib/utils/uploadImage";
import { useAuth } from "@/lib/auth/session-context";
import type { SidebarItem, SuperAdmin } from "@/types/agency";

const PAGE_SIZE = 10;

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: SuperAdmin["status"] }) {
  if (status === "active")
    return <span className="inline-flex items-center rounded-full bg-success-500/10 px-2.5 py-0.5 text-xs font-medium text-success-600">Active</span>;
  if (status === "suspended")
    return <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">Suspended</span>;
  return <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">{status}</span>;
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = "account" | "branding" | "sidebar";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "sidebar", label: "Sidebar", icon: Settings2 },
];

// ── Add Drawer ────────────────────────────────────────────────────────────────

interface AddDrawerProps {
  onClose: () => void;
  onCreated: () => void;
  accessToken: string;
}

function AddDrawer({ onClose, onCreated, accessToken }: AddDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("account");

  // Account fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Branding fields
  const [platformName, setPlatformName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#5b45d6");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sidebar config
  const [catalogueItems, setCatalogueItems] = useState<SidebarItem[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [sidebarOrder, setSidebarOrder] = useState<SidebarItem[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Load catalogue when sidebar tab is first opened
  useEffect(() => {
    if (activeTab !== "sidebar" || catalogueItems.length > 0) return;
    setLoadingCatalogue(true);
    listSidebarItems(accessToken)
      .then((items) => {
        setCatalogueItems(items);
        setSidebarOrder([...items].sort((a, b) => a.default_order - b.default_order));
      })
      .catch(() => {})
      .finally(() => setLoadingCatalogue(false));
  }, [activeTab, catalogueItems.length, accessToken]);

  function close() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function moveSidebarUp(index: number) {
    if (index === 0) return;
    setSidebarOrder((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveSidebarDown(index: number) {
    setSidebarOrder((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function handleCreate() {
    if (!fullName.trim() || !email.trim()) {
      setError("Full name and email are required.");
      setActiveTab("account");
      return;
    }
    if (password && password.length < 8) {
      setError("Password must be at least 8 characters.");
      setActiveTab("account");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      // 1. Create the super admin
      const newUser = await createSuperAdmin(accessToken, {
        full_name: fullName.trim(),
        email: email.trim(),
        country: country.trim() || undefined,
        password: password || undefined,
      });

      // 2. Upload logo and set branding (if any branding fields are set)
      const hasBranding = platformName.trim() || primaryColor !== "#5b45d6" || logoFile;
      if (hasBranding) {
        let logoUrl: string | undefined;
        if (logoFile) {
          logoUrl = await uploadImage(accessToken, logoFile, "branding");
        }
        await updateSuperAdminBranding(accessToken, newUser.id, {
          platform_name: platformName.trim() || undefined,
          primary_color: primaryColor,
          logo_url: logoUrl,
        });
      }

      // 3. Save sidebar config if anything is configured
      if (catalogueItems.length > 0) {
        await saveSuperAdminSidebar(accessToken, newUser.id, {
          items: sidebarOrder.map((item) => ({
            item_id: item.id,
            visible: !hiddenIds.has(item.id),
          })),
        });
      }

      onCreated();
      close();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to create super admin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={close}
      />
      <div className={`relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h2 className="text-lg font-semibold text-neutral-900">Add Super Admin</h2>
          <button type="button" onClick={close} className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "border-b-2 border-brand-600 text-brand-700"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Account tab ── */}
          {activeTab === "account" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sa-name">Full Name</Label>
                <Input id="sa-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <Label htmlFor="sa-email">Email</Label>
                <Input id="sa-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
              </div>
              <div>
                <Label htmlFor="sa-password">Password</Label>
                <div className="relative">
                  <Input
                    id="sa-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-neutral-400">Leave blank to send a set-password email instead.</p>
              </div>
              <div>
                <Label htmlFor="sa-country">Country Code <span className="text-neutral-400">(optional)</span></Label>
                <Input id="sa-country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" maxLength={2} className="uppercase" />
              </div>
            </div>
          )}

          {/* ── Branding tab ── */}
          {activeTab === "branding" && (
            <div className="space-y-5">
              {/* Logo */}
              <div>
                <Label>Logo</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  {logoPreview ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-neutral-200">
                      <Image src={logoPreview} alt="Logo preview" fill className="object-contain" unoptimized />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800/60 text-white"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-400">
                      <Upload size={20} />
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      {logoPreview ? "Change logo" : "Upload logo"}
                    </button>
                    <p className="mt-1 text-xs text-neutral-400">PNG, JPG, SVG · max 2 MB</p>
                  </div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>

              {/* Platform name */}
              <div>
                <Label htmlFor="sa-platform-name">Platform Name</Label>
                <Input
                  id="sa-platform-name"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="e.g. Provenix"
                />
                <p className="mt-1 text-xs text-neutral-400">Shown in the sidebar header. Falls back to global platform name if blank.</p>
              </div>

              {/* Primary color */}
              <div>
                <Label htmlFor="sa-color">Brand Color</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    id="sa-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-neutral-200 p-1"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#5b45d6"
                    className="w-32 font-mono"
                    maxLength={7}
                  />
                  <div
                    className="h-10 w-10 rounded-lg border border-neutral-200"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Sidebar tab ── */}
          {activeTab === "sidebar" && (
            <div>
              <p className="mb-3 text-sm text-neutral-500">
                Choose which nav items this super admin sees. You can always change this later from Sidebar Config.
              </p>
              {loadingCatalogue ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                  <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    Order · Visibility
                  </div>
                  <ul className="divide-y divide-neutral-100">
                    {sidebarOrder.map((item, index) => {
                      const isVisible = !hiddenIds.has(item.id);
                      return (
                        <li
                          key={item.id}
                          className={`flex items-center gap-3 px-4 py-2.5 ${isVisible ? "" : "opacity-50"}`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveSidebarUp(index)}
                              disabled={index === 0}
                              className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 disabled:opacity-20"
                            >
                              <ArrowUp size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSidebarDown(index)}
                              disabled={index === sidebarOrder.length - 1}
                              className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 disabled:opacity-20"
                            >
                              <ArrowDown size={11} />
                            </button>
                          </div>
                          <span className="w-4 text-center text-xs text-neutral-400">{index + 1}</span>
                          <span className="flex-1 text-sm font-medium text-neutral-900">{item.label}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setHiddenIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              })
                            }
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                              isVisible ? "text-brand-600 hover:bg-brand-50" : "text-neutral-300 hover:bg-neutral-100"
                            }`}
                          >
                            {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-5">
          {error ? <div className="mb-3"><FormError message={error} /></div> : null}
          <div className="flex gap-2">
            <Button onClick={handleCreate} isLoading={isSubmitting} className="flex-1">
              Create Super Admin
            </Button>
            <Button type="button" variant="secondary" onClick={close} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit Drawer ───────────────────────────────────────────────────────────────

interface EditDrawerProps {
  user: SuperAdmin;
  onClose: () => void;
  onSaved: () => void;
  accessToken: string;
}

function EditDrawer({ user, onClose, onSaved, accessToken }: EditDrawerProps) {
  const [fullName, setFullName] = useState(user.full_name);
  const [status, setStatus] = useState<"active" | "suspended">(
    user.status === "active" || user.status === "suspended" ? user.status : "active"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await updateSuperAdmin(accessToken, user.id, { full_name: fullName.trim(), status });
      onSaved();
      close();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to update.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={close}
      />
      <div className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h2 className="text-lg font-semibold text-neutral-900">Edit Super Admin</h2>
          <button type="button" onClick={close} className="text-neutral-400 hover:text-neutral-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <div>
            <Label htmlFor="edit-name">Full Name</Label>
            <Input id="edit-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-status">Status</Label>
            <Select
              id="edit-status"
              value={status}
              onChange={(v) => setStatus(v as "active" | "suspended")}
              options={[
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
              ]}
            />
          </div>
          {error ? <FormError message={error} /> : null}
          <div className="mt-auto flex gap-2 pt-2">
            <Button type="submit" isLoading={isSubmitting}>Save</Button>
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Row menu ──────────────────────────────────────────────────────────────────

interface RowMenuProps {
  user: SuperAdmin;
  onEdit: () => void;
  onDelete: () => void;
}

function RowMenu({ user, onEdit, onDelete }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            <UserPen size={15} /> Edit
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-500/5"
          >
            <Trash2 size={15} /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SuperAdminsPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<SuperAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "suspended" | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<SuperAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SuperAdmin | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listSuperAdmins(accessToken, {
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setUsers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load super admins.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page, search, statusFilter]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  async function handleDelete(hard = false) {
    if (!accessToken || !deleteTarget) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteSuperAdmin(accessToken, deleteTarget.id, hard);
      setDeleteTarget(null);
      void fetchUsers();
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Failed to delete.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AgencyShell>
      <main className="p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Super Admins</h1>
            <p className="mt-0.5 text-sm text-neutral-500">
              Manage all super admin accounts on the platform.
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)} className="w-auto">
            <Plus size={16} className="mr-1.5" />
            Add Super Admin
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-neutral-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}
            options={[
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ]}
            className="w-44"
          />
          <button
            type="button"
            onClick={() => void fetchUsers()}
            aria-label="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {error ? (
            <p className="p-6 text-sm text-danger-600">{error}</p>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-400">No super admins found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Portal URL</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Last Login</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                          {initialsFromName(user.full_name)}
                        </span>
                        <span className="font-medium text-neutral-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.slug ? (
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-700">
                            /{user.slug}/login
                          </code>
                          <button
                            type="button"
                            onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/${user.slug}/login`)}
                            className="text-neutral-400 hover:text-brand-600"
                            title="Copy login URL"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                    <td className="px-4 py-3 text-neutral-500 uppercase">{user.country ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-400">{formatDate(user.last_login_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <RowMenu
                        user={user}
                        onEdit={() => setEditing(user)}
                        onDelete={() => { setDeleteError(null); setDeleteTarget(user); }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
            <span>{total} total</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2">{page} / {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 hover:bg-neutral-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* Add drawer */}
      {showAdd && accessToken ? (
        <AddDrawer
          accessToken={accessToken}
          onClose={() => setShowAdd(false)}
          onCreated={() => void fetchUsers()}
        />
      ) : null}

      {/* Edit drawer */}
      {editing && accessToken ? (
        <EditDrawer
          user={editing}
          accessToken={accessToken}
          onClose={() => setEditing(null)}
          onSaved={() => void fetchUsers()}
        />
      ) : null}

      {/* Delete confirm */}
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-900">Delete super admin?</h3>
            <p className="mt-1.5 text-sm text-neutral-500">
              <span className="font-medium text-neutral-700">{deleteTarget.full_name}</span> will be removed. This cannot be undone if hard-deleted.
            </p>
            {deleteError ? <p className="mt-3 text-sm text-danger-600">{deleteError}</p> : null}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => void handleDelete(false)}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-danger-500 px-4 py-2 text-sm font-medium text-white hover:bg-danger-600 disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AgencyShell>
  );
}
