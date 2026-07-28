"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BuyerTopbar } from "@/components/layout/BuyerTopbar";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { changeEmail, deactivateAccount } from "@/lib/api/account";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";

export default function AccountPage() {
  const { session, accessToken, logout } = useAuth();
  const router = useRouter();

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    setEmailError(null);
    if (!newEmail.trim()) {
      setEmailError("New email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!currentPassword) {
      setEmailError("Current password is required to change your email.");
      return;
    }

    setIsSavingEmail(true);
    try {
      await changeEmail(accessToken, { email: newEmail.trim(), current_password: currentPassword });
      await logout();
      router.push("/login");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setEmailError(err.fieldErrors?.email ?? err.fieldErrors?.current_password ?? err.message);
      } else {
        setEmailError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSavingEmail(false);
    }
  }

  async function handleDeactivate() {
    if (!accessToken) return;
    setDeactivateError(null);
    setIsDeactivating(true);
    try {
      await deactivateAccount(accessToken);
      await logout();
      router.push("/login");
    } catch (err) {
      setDeactivateError(
        err instanceof ApiRequestError ? err.message : "Failed to deactivate. Please try again.",
      );
      setIsDeactivating(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <BuyerTopbar />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Account Settings</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your email address and account status.
          </p>
        </div>

        <div className="space-y-6">

          {/* Current Account Info */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-base font-semibold text-neutral-900">Account Info</h2>
            <p className="mt-1 mb-5 text-sm text-neutral-500">Your current account details.</p>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-neutral-500">Full Name</dt>
                <dd className="text-sm font-medium text-neutral-900">{session?.full_name ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-neutral-500">Email</dt>
                <dd className="text-sm font-medium text-neutral-900">{session?.email ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-neutral-500">Status</dt>
                <dd>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      session?.status === "active"
                        ? "bg-success-500/10 text-success-500"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {session?.status ?? "—"}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          {/* Change Email */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-base font-semibold text-neutral-900">Change Email</h2>
            <p className="mt-1 mb-5 text-sm text-neutral-500">
              Your current email is <span className="font-medium text-neutral-700">{session?.email}</span>.
              After updating you will be signed out and must log in with your new address.
            </p>
            <form onSubmit={handleChangeEmail} noValidate className="space-y-4">
              <div>
                <Label htmlFor="new-email">New Email Address</Label>
                <Input
                  id="new-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={newEmail}
                  error={emailError ?? undefined}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError(null); }}
                />
              </div>
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  error={emailError ?? undefined}
                  onChange={(e) => { setCurrentPassword(e.target.value); setEmailError(null); }}
                />
                <FormError id="email-error" message={emailError ?? undefined} />
              </div>
              <Button type="submit" size="sm" className="w-auto" isLoading={isSavingEmail}>
                Update Email
              </Button>
            </form>
          </section>

          {/* Deactivate Account */}
          <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="text-base font-semibold text-neutral-900">Account Status</h2>
            <p className="mt-1 mb-5 text-sm text-neutral-500">
              Deactivating your account will immediately suspend your access. You will need to
              contact support to reactivate.
            </p>

            {!showDeactivateConfirm ? (
              <Button
                variant="secondary"
                size="sm"
                className="w-auto border-danger-200 text-danger-600 hover:bg-danger-500/5"
                onClick={() => setShowDeactivateConfirm(true)}
                disabled={session?.status !== "active"}
              >
                Deactivate Account
              </Button>
            ) : (
              <div className="rounded-lg border border-danger-100 bg-danger-100/40 p-4">
                <div className="flex gap-3">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-danger-700">
                      Are you sure you want to deactivate your account?
                    </p>
                    <p className="mt-1 text-sm text-danger-600">
                      You will be logged out immediately and will need to contact support to regain access.
                    </p>
                    <FormError message={deactivateError ?? undefined} />
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        className="w-auto bg-danger-500 text-white hover:bg-danger-600"
                        isLoading={isDeactivating}
                        onClick={handleDeactivate}
                      >
                        Yes, Deactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-auto"
                        onClick={() => { setShowDeactivateConfirm(false); setDeactivateError(null); }}
                        disabled={isDeactivating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {session?.status === "suspended" ? (
              <p className="mt-3 text-sm text-neutral-500">
                Your account is currently <span className="font-medium text-neutral-700">suspended</span>.
                Contact <a href="mailto:support@auctionplatform.com" className="text-brand-600 hover:underline">support</a> to reactivate.
              </p>
            ) : null}
          </section>

        </div>
      </main>
    </div>
  );
}
