"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui/Select";
import type { UserStatus } from "@/types/auth";
import { STAFF_ROLES, type AdminUserListItem, type StaffRole, type UpdateUserPayload } from "@/types/adminUsers";

const roleLabels: Record<StaffRole, string> = {
  super_admin: "Super Admin",
  auction_manager: "Auction Manager",
  marketing: "Marketing",
  legal: "Legal",
  finance: "Finance",
  gemologist: "Gemologist",
  executive: "Executive",
};

interface EditUserDrawerProps {
  user: AdminUserListItem;
  onClose: () => void;
  onSave: (payload: UpdateUserPayload) => Promise<void>;
}

export function EditUserDrawer({ user, onClose, onSave }: EditUserDrawerProps) {
  const [fullName, setFullName] = useState(user.full_name);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [roles, setRoles] = useState<StaffRole[]>(user.roles.filter((r): r is StaffRole => r !== "buyer" && r !== "seller"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  function toggleRole(role: StaffRole) {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!fullName.trim() || roles.length === 0) {
      setError("Full name and at least one role are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ full_name: fullName, status, roles });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div
        className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${isVisible ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h2 className="text-lg font-semibold text-neutral-900">Edit User</h2>
          <button type="button" onClick={handleClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-5">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Email</label>
              <input
                value={user.email}
                disabled
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 text-sm text-neutral-500"
              />
              <p className="mt-1 text-xs text-neutral-400">Email cannot be changed here.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Full Name <span className="text-danger-500">*</span>
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">Status</label>
              <Select
                value={status}
                onChange={(v) => setStatus(v as UserStatus)}
                options={[
                  { value: "active", label: "Active" },
                  { value: "suspended", label: "Suspended" },
                ]}
              />
              <p className="mt-1 text-xs text-neutral-400">Suspending revokes their active session immediately.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Roles <span className="text-danger-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STAFF_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={roles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-100"
                    />
                    {roleLabels[role]}
                  </label>
                ))}
              </div>
            </div>

            {error ? <p className="text-sm text-danger-600">{error}</p> : null}
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-neutral-100 pt-5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}