"use client";

import { CheckCircle2, Eye, EyeOff, KeyRound, User } from "lucide-react";
import { useState } from "react";
import { changePassword } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/session-context";

type Tab = "profile" | "password";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "password", label: "Change Password", icon: KeyRound },
];

export default function BuyerProfilePage() {
  const { session, accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChangePassword() {
    if (!accessToken) return;
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await changePassword(accessToken, currentPassword, newPassword);
      setSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Incorrect current password, or request failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">My Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">View your account details and manage your password.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex overflow-x-auto border-b border-neutral-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-b-2 border-brand-500 text-brand-600"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <User size={28} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-neutral-900">{session?.full_name ?? "—"}</p>
                  <p className="text-sm text-neutral-500">{session?.roles.join(", ")}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Full Name</p>
                  <p className="mt-1 text-sm font-medium text-neutral-900">{session?.full_name ?? "—"}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Email</p>
                  <p className="mt-1 text-sm font-medium text-neutral-900">{session?.email ?? "—"}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Password</p>
                  <p className="mt-1 text-sm font-medium tracking-widest text-neutral-900">••••••••</p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Account Status</p>
                  <p className="mt-1 text-sm font-medium capitalize text-neutral-900">{session?.status ?? "—"}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "password" && (
            <div className="max-w-sm space-y-4">
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
              />
              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                show={showNew}
                onToggle={() => setShowNew((v) => !v)}
              />
              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              {saved && (
                <p className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 size={15} /> Password updated successfully.
                </p>
              )}
              <button
                type="button"
                onClick={() => void handleChangePassword()}
                disabled={saving}
                className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Update Password"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 pr-10 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
