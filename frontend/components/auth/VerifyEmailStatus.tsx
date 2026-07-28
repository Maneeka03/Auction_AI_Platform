"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { verifyEmail } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { resolveErrorMessage } from "@/lib/api/errorMessages";

type Status = "verifying" | "success" | "error";

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : "This link is missing its token.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    verifyEmail(token)
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          error instanceof ApiRequestError ? resolveErrorMessage(error.code, error.message) : "Verification failed.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "verifying") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Verifying your email&hellip;</h1>
        <p className="mt-3 text-sm text-neutral-600">This will only take a moment.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Email verified</h1>
        <p className="mt-3 text-sm text-neutral-600">Your account is active. You can log in now.</p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Verification failed</h1>
      <p className="mt-3 text-sm text-neutral-600">{errorMessage}</p>
      <ResendVerificationForm />
    </div>
  );
}