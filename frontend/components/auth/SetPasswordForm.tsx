"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { resetPassword } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { resolveErrorMessage } from "@/lib/api/errorMessages";
import { validateNewPassword } from "@/lib/validation/authSchemas";

interface SetPasswordFormProps {
  heading: string;
  description: string;
  submitLabel: string;
}

export function SetPasswordForm({ heading, description, submitLabel }: SetPasswordFormProps) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  if (!token) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Link invalid</h1>
        <p className="mt-3 text-sm text-neutral-600">
          This link is missing its token. Request a new one from the sign-in page.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Request a new link
        </Link>
      </div>
    );
  }

  if (succeeded) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Password updated</h1>
        <p className="mt-3 text-sm text-neutral-600">
          You&apos;ve been signed out of every device for security. Log in with your new password.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to log in
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const error = validateNewPassword(password);
    setFieldError(error);
    if (error || !token) return;

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setSucceeded(true);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFormError(resolveErrorMessage(error.code, error.message));
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">{heading}</h1>
      <p className="mt-1.5 text-sm text-neutral-600">{description}</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 12 characters"
            value={password}
            error={fieldError}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FormError id="password-error" message={fieldError} />
        </div>

        <FormError message={formError ?? undefined} />

        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </form>
    </div>
  );
}