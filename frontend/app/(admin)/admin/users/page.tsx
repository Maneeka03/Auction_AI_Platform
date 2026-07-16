"use client";

import { Plus, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { AddUserDrawer } from "@/components/admin-users/AddUserDrawer";
import { EditUserDrawer } from "@/components/admin-users/EditUserDrawer";
import { RoleBadges } from "@/components/admin-users/RoleBadges";
import { StatusBadge } from "@/components/admin-users/StatusBadge";
import { UserRowMenu } from "@/components/admin-users/UserRowMenu";
import { createUser, deleteUser, listUsers, updateUser } from "@/lib/api/admin";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import { STAFF_ROLES, type AdminUserListItem, type StaffRole } from "@/types/adminUsers";
import type { UserStatus } from "@/types/auth";

const PAGE_SIZE = 10;

function initialsFromName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UserManagementPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserListItem | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listUsers(accessToken, {
        page,
        size: PAGE_SIZE,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page, search, roleFilter, statusFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  async function handleCreate(payload: Parameters<typeof createUser>[1]) {
    if (!accessToken) return;
    await createUser(accessToken, payload);
    setShowAddDrawer(false);
    void fetchUsers();
  }

  async function handleUpdate(payload: Parameters<typeof updateUser>[2]) {
    if (!accessToken || !editingUser) return;
    await updateUser(accessToken, editingUser.id, payload);
    setEditingUser(null);
    void fetchUsers();
  }

  async function handleDelete(user: AdminUserListItem) {
    if (!accessToken) return;
    const confirmed = window.confirm(`Delete ${user.full_name}? This can't be undone from here.`);
    if (!confirmed) return;
    await deleteUser(accessToken, user.id);
    void fetchUsers();
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminShell>
         <RequirePermission module="user_management" need="full">
      <div className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-neutral-900">Manage Users</h1>
              <span className="rounded-full bg-danger-500/10 px-2 py-0.5 text-xs font-semibold text-danger-600">
                {total}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-600">Staff accounts and permissions.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddDrawer(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus size={16} /> Add User
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search by name or email"
              className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value as StaffRole | "");
            }}
            className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-600"
          >
            <option value="">All roles</option>
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {role.replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as UserStatus | "");
            }}
            className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-600"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending_verification">Pending Verification</option>
          </select>

          <button
            type="button"
            onClick={() => void fetchUsers()}
            aria-label="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
                 <th className="w-20 px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    Loading users...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-danger-600">
                    {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                          {initialsFromName(user.full_name)}
                        </span>
                        <span className="font-medium text-neutral-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadges roles={user.roles} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <UserRowMenu onEdit={() => setEditingUser(user)} onDelete={() => void handleDelete(user)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <span>
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

     {showAddDrawer ? <AddUserDrawer onClose={() => setShowAddDrawer(false)} onCreate={handleCreate} /> : null}
        {editingUser ? (
          <EditUserDrawer user={editingUser} onClose={() => setEditingUser(null)} onSave={handleUpdate} />
        ) : null}
      </RequirePermission>
    </AdminShell>
  );
}