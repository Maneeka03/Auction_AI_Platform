"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { forgotPassword } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { resolveErrorMessage } from "@/lib/api/errorMessages";
import { validateEmailOnly } from "@/lib/validation/authSchemas";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const error = validateEmailOnly(email);
    setFieldError(error);
    if (error) return;

    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      // API always returns 202 with the same generic response, regardless of
      // whether the account exists — this prevents email enumeration.
      setSubmitted(true);
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

  if (submitted) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Check your inbox</h1>
        <p className="mt-3 text-sm text-neutral-600">
          If an account exists for <span className="font-medium text-neutral-900">{email}</span>, we sent a
          password reset link. It expires after a single use.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Reset your password</h1>
      <p className="mt-1.5 text-sm text-neutral-600">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            error={fieldError}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FormError id="email-error" message={fieldError} />
        </div>

        <FormError message={formError ?? undefined} />

        <Button type="submit" isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Log in
        </Link>
      </p>
    </div>
  );
}