"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-start gap-4 py-16">
      <h1 className="text-lg font-semibold text-neutral-900">Something went wrong</h1>
      <p className="text-sm text-neutral-600">
        We couldn&apos;t load this page. Try again, or come back in a moment.
      </p>
      <Button onClick={reset} className="w-auto px-6">
        Try again
      </Button>
    </div>
  );
}