"use client";

import { User } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth/session-context";

interface ProfileEditorProps {
  roleLabel?: string;
  showStatus?: boolean;
}

export function ProfileEditor({ roleLabel, showStatus = false }: ProfileEditorProps) {
  const { session, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(session?.full_name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => setFullName(session?.full_name ?? ""), [session?.full_name]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const name = fullName.trim();
    if (name.length < 2) {
      toast.error("Full name must be at least 2 characters.");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile(name);
      toast.success("Full name updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update full name.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User size={28} />
          </div>
          <div>
            <p className="text-lg font-semibold text-neutral-900">{session?.full_name ?? "—"}</p>
            <p className="text-sm text-neutral-500">{roleLabel ?? session?.roles.join(", ") ?? "—"}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 max-w-md space-y-4">
          <div>
            <label htmlFor="full-name" className="mb-1.5 block text-sm font-medium text-neutral-700">Full Name</label>
            <input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100" />
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Email</p>
            <p className="mt-1 text-sm font-medium text-neutral-900">{session?.email ?? "—"}</p>
          </div>
          {showStatus ? <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"><p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Account Status</p><p className="mt-1 text-sm font-medium capitalize text-neutral-900">{session?.status ?? "—"}</p></div> : null}
          <button type="submit" disabled={isSaving || fullName.trim() === session?.full_name} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? "Saving…" : "Save Full Name"}</button>
        </form>
      </div>
    </div>
  );
}
