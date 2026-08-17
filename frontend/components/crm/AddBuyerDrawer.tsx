"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface AddBuyerDrawerProps {
  onClose: () => void;
  onCreate: (payload: {
    full_name: string;
    email: string;
    country?: string;
  }) => Promise<void>;
}

export function AddBuyerDrawer({
  onClose,
  onCreate,
}: AddBuyerDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!fullName.trim() || !email.trim()) {
      setError("Full Name and Email are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      await onCreate({
        full_name: fullName,
        email,
        country: country || undefined,
      });

      handleClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create buyer."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">

      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200 ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h2 className="text-lg font-semibold">
            Add Buyer
          </h2>

          <button onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto p-5"
        >
          <div className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium">
                Full Name *
              </label>

              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email *
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Country
              </label>

              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="US"
                className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-danger-600">
                {error}
              </p>
            )}

          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-neutral-100 pt-5">

            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-neutral-200 px-4 py-2"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-white"
            >
              {isSubmitting
                ? "Creating..."
                : "Add Buyer"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}