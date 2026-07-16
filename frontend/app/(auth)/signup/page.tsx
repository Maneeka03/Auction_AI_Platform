"use client";

import Link from "next/link";
import { useState } from "react";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { register } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { resolveErrorMessage } from "@/lib/api/errorMessages";
import { validateRegister, type RegisterFieldErrors } from "@/lib/validation/authSchemas";
import type { RegisterPayload } from "@/types/auth";

const INITIAL_VALUES: RegisterPayload = {
  email: "",
  password: "",
  full_name: "",
  role: "buyer",
  country: "",
  business_type: "",
};

export default function SignupPage() {
  const [values, setValues] = useState<RegisterPayload>(INITIAL_VALUES);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [termsError, setTermsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setTermsError(agreedToTerms ? null : "You must agree to the Terms of Use.");

    const errors = validateRegister(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !agreedToTerms) return;

    setIsSubmitting(true);
    try {
      const payload: RegisterPayload = {
        ...values,
        country: values.country || null,
        business_type: values.role === "seller" ? values.business_type || null : null,
      };
      const created = await register(payload);
      setRegisteredEmail(created.email);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFieldErrors((prev) => ({ ...prev, ...error.fieldErrors }));
        setFormError(resolveErrorMessage(error.code, error.message));
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (registeredEmail) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Check your inbox</h1>
        <p className="mt-3 text-sm text-neutral-600">
          We sent a verification link to{" "}
          <span className="font-medium text-neutral-900">{registeredEmail}</span>. Confirm your email to
          activate your account, then log in.
        </p>
        <ResendVerificationForm initialEmail={registeredEmail} />
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Create your account</h1>
      <p className="mt-1.5 text-sm text-neutral-600">Get started buying and selling on the platform.</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            autoComplete="name"
            placeholder="Enter your name"
            value={values.full_name}
            error={fieldErrors.full_name}
            onChange={(event) => setValues((prev) => ({ ...prev, full_name: event.target.value }))}
          />
          <FormError id="full_name-error" message={fieldErrors.full_name} />
        </div>

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
            autoComplete="new-password"
            placeholder="At least 12 characters"
            value={values.password}
            error={fieldErrors.password}
            onChange={(event) => setValues((prev) => ({ ...prev, password: event.target.value }))}
          />
          <FormError id="password-error" message={fieldErrors.password} />
        </div>

        <div>
          <Label htmlFor="role">I want to</Label>
          <Select
            id="role"
            value={values.role}
            onChange={(v) => setValues((prev) => ({ ...prev, role: v as RegisterPayload["role"] }))}
            options={[
              { value: "buyer", label: "Buy items" },
              { value: "seller", label: "Sell items" },
            ]}
          />
          <FormError id="role-error" message={fieldErrors.role} />
        </div>

        {values.role === "seller" ? (
          <div>
            <Label htmlFor="business_type">Business type (optional)</Label>
            <Input
              id="business_type"
              placeholder="e.g. private_collector"
              value={values.business_type ?? ""}
              onChange={(event) => setValues((prev) => ({ ...prev, business_type: event.target.value }))}
            />
          </div>
        ) : null}

        <div>
          <label className="flex items-start gap-2 text-sm text-neutral-700">
            <Checkbox
              className="mt-0.5"
              checked={agreedToTerms}
              onChange={(event) => {
                setAgreedToTerms(event.target.checked);
                if (event.target.checked) setTermsError(null);
              }}
            />
            <span>
              By registering you agree to the{" "}
              <Link href="/terms" className="font-medium text-brand-600 hover:text-brand-700">
                Terms of Use
              </Link>
            </span>
          </label>
          <FormError message={termsError ?? undefined} />
        </div>

        <FormError message={formError ?? undefined} />

        <Button type="submit" isLoading={isSubmitting}>
          Register
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Log in
        </Link>
      </p>
    </div>
  );
}