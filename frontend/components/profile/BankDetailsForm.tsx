"use client";

import { BadgeCheck, Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth/session-context";
import { getMyBankDetails, saveBankDetails } from "@/lib/api/seller";
import type { BankAccountType, UpsertBankAccountRequest } from "@/types/portal";

const EMPTY_FORM: UpsertBankAccountRequest = {
  account_holder_name: "",
  bank_name: "",
  account_number: "",
  ifsc_code: "",
  branch_name: "",
  account_type: "savings",
};

export function BankDetailsForm() {
  const { accessToken } = useAuth();
  const [form, setForm] = useState<UpsertBankAccountRequest>(EMPTY_FORM);
  const [maskedNumber, setMaskedNumber] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      try {
        const account = await getMyBankDetails(accessToken);
        if (account) {
          setForm({
            account_holder_name: account.account_holder_name,
            bank_name: account.bank_name,
            account_number: "",
            ifsc_code: account.ifsc_code,
            branch_name: account.branch_name ?? "",
            account_type: account.account_type,
          });
          setMaskedNumber(account.account_number_masked);
          setIsVerified(account.is_verified);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load bank details.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [accessToken]);

  function update<K extends keyof UpsertBankAccountRequest>(key: K, value: UpsertBankAccountRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) {
      toast.error("You must be signed in.");
      return;
    }
    if (form.account_holder_name.trim().length < 2) {
      toast.error("Enter the account holder's name.");
      return;
    }
    if (form.bank_name.trim().length < 2) {
      toast.error("Enter the bank name.");
      return;
    }
    if (!/^[A-Za-z0-9]{6,34}$/.test(form.account_number)) {
      toast.error("Enter a valid account number.");
      return;
    }
    if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(form.ifsc_code)) {
      toast.error("Enter a valid 11-character IFSC code, e.g. HDFC0001234.");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveBankDetails(accessToken, {
        ...form,
        ifsc_code: form.ifsc_code.toUpperCase(),
        branch_name: form.branch_name?.trim() ? form.branch_name.trim() : null,
      });
      setMaskedNumber(saved.account_number_masked);
      setIsVerified(saved.is_verified);
      setForm((prev) => ({ ...prev, account_number: "" }));
      toast.success("Bank details saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save bank details.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Landmark size={16} className="text-neutral-500" />
          <h2 className="text-sm font-semibold text-neutral-800">Payout Bank Details</h2>
        </div>
        {maskedNumber ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              isVerified ? "bg-success-50 text-success-700" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            <BadgeCheck size={12} />
            {isVerified ? "Verified" : "Pending verification"}
          </span>
        ) : null}
      </div>

      <div className="px-6 py-5">
        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="max-w-md space-y-4">
            <p className="text-xs text-neutral-500">
              Used to send your auction proceeds. Only you and our finance team can see these
              details.
            </p>

            <div>
              <label htmlFor="account-holder-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Account Holder Name
              </label>
              <input
                id="account-holder-name"
                value={form.account_holder_name}
                onChange={(event) => update("account_holder_name", event.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label htmlFor="bank-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Bank Name
              </label>
              <input
                id="bank-name"
                value={form.bank_name}
                onChange={(event) => update("bank_name", event.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label htmlFor="account-number" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Account Number
              </label>
              <input
                id="account-number"
                value={form.account_number}
                onChange={(event) => update("account_number", event.target.value)}
                placeholder={maskedNumber ?? "Enter account number"}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm font-mono focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              {maskedNumber ? (
                <p className="mt-1 text-xs text-neutral-400">
                  Currently on file: {maskedNumber}. Leave blank to keep it, or enter a new number to replace it.
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ifsc-code" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  IFSC Code
                </label>
                <input
                  id="ifsc-code"
                  value={form.ifsc_code}
                  onChange={(event) => update("ifsc_code", event.target.value.toUpperCase())}
                  maxLength={11}
                  className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm uppercase focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label htmlFor="account-type" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Account Type
                </label>
                <select
                  id="account-type"
                  value={form.account_type}
                  onChange={(event) => update("account_type", event.target.value as BankAccountType)}
                  className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="branch-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Branch Name <span className="text-neutral-400">(optional)</span>
              </label>
              <input
                id="branch-name"
                value={form.branch_name ?? ""}
                onChange={(event) => update("branch_name", event.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save Bank Details"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
