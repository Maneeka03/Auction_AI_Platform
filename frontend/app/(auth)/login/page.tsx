"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";  
import { Label } from "@/components/ui/Label";
import { ApiRequestError } from "@/lib/api/client";
import { resolveErrorMessage } from "@/lib/api/errorMessages";
import { useAuth } from "@/lib/auth/session-context";
import { validateLogin, type LoginFieldErrors } from "@/lib/validation/authSchemas";
import type { LoginPayload } from "@/types/auth";

const INITIAL_VALUES: LoginPayload = { email: "", password: "" };

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [values, setValues] = useState<LoginPayload>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setNeedsVerification(false);

    const errors = validateLogin(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const session = await login(values);
      const isStaff = session.roles.some((role) =>
        ["super_admin", "auction_manager", "marketing", "legal", "finance", "gemologist", "executive"].includes(role),
      );
      router.push(isStaff ? "/dashboard" : "/properties");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFieldErrors((prev) => ({ ...prev, ...error.fieldErrors }));
        setFormError(resolveErrorMessage(error.code, error.message));
        if (error.code === "email_not_verified") setNeedsVerification(true);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-neutral-600">Log in to continue to your account.</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            error={fieldErrors.email}
            onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
          />
          <FormError id="email-error" message={fieldErrors.email} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter password"
            value={values.password}
            error={fieldErrors.password}
            onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
          />
          <FormError id="password-error" message={fieldErrors.password} />
        </div>

        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>

        <FormError message={formError ?? undefined} />

        <Button type="submit" isLoading={isSubmitting}>
          Log in
        </Button>
      </form>

      {needsVerification ? <ResendVerificationForm initialEmail={values.email} /> : null}

      <p className="mt-6 text-center text-sm text-neutral-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
          Sign up
        </Link>
      </p>
    </div>
  );
}