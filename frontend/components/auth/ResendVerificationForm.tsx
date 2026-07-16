"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { resendVerification } from "@/lib/api/auth";
import { validateEmailOnly } from "@/lib/validation/authSchemas";

interface ResendVerificationFormProps {
  initialEmail?: string;
}

export function ResendVerificationForm({ initialEmail = "" }: ResendVerificationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validateEmailOnly(email);
    setFieldError(error);
    if (error) return;

    setIsSubmitting(true);
    try {
      await resendVerification(email);
      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <p className="mt-4 text-sm text-neutral-600">
        If an account exists for <span className="font-medium text-neutral-900">{email}</span>, a new
        verification link is on its way.
      </p>
    );
  }

  return (
    <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <Label htmlFor="resend-email">Get a new link</Label>
        <Input
          id="resend-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          error={fieldError}
          onChange={(event) => setEmail(event.target.value)}
        />
        <FormError id="resend-email-error" message={fieldError} />
      </div>
      <Button type="submit" variant="secondary" isLoading={isSubmitting}>
        Resend verification email
      </Button>
    </form>
  );
}