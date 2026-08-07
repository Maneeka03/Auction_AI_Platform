"use client";

import { Camera, User } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth/session-context";
import { uploadImage } from "@/lib/utils/uploadImage";

interface ProfileEditorProps {
  roleLabel?: string;
  showStatus?: boolean;
}

export function ProfileEditor({ roleLabel, showStatus = false }: ProfileEditorProps) {
  const { session } = useAuth();
  return <ProfileEditorForm key={`${session?.id ?? "anonymous"}-${session?.full_name ?? ""}-${session?.avatar_url ?? ""}`} roleLabel={roleLabel} showStatus={showStatus} />;
}

function ProfileEditorForm({ roleLabel, showStatus = false }: ProfileEditorProps) {
  const { session, accessToken, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(session?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(session?.avatar_url ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!accessToken) {
      toast.error("You must be signed in to upload a photo.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setIsUploading(true);
    try {
      setAvatarUrl(await uploadImage(accessToken, file, "avatar"));
      toast.success("Photo uploaded. Save your profile to apply it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload photo.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const name = fullName.trim();
    if (name.length < 2) {
      toast.error("Full name must be at least 2 characters.");
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ fullName: name, avatarUrl });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <label className="group relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-700">
            {avatarUrl ? <img src={avatarUrl} alt="Profile photo" className="h-full w-full object-cover" /> : <User size={28} />}
            <span className="absolute inset-0 hidden items-center justify-center bg-black/45 text-white group-hover:flex"><Camera size={20} /></span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={handleAvatarChange} disabled={isUploading} />
          </label>
          <div>
            <p className="text-lg font-semibold text-neutral-900">{session?.full_name ?? "—"}</p>
            <p className="text-sm text-neutral-500">{roleLabel ?? session?.roles.join(", ") ?? "—"}</p>
            <p className="mt-1 text-xs text-neutral-400">{isUploading ? "Uploading photo…" : "Click the photo to change it"}</p>
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
          <button type="submit" disabled={isSaving || isUploading || (fullName.trim() === session?.full_name && avatarUrl === (session?.avatar_url ?? null))} className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? "Saving…" : "Save Profile"}</button>
        </form>
      </div>
    </div>
  );
}
