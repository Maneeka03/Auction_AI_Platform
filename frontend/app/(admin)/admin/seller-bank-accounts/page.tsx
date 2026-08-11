"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { listBankDetails } from "@/lib/api/bankAccounts";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { BankAccountReviewItem } from "@/types/bankAccount";

export default function SellerBankAccountsPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [accounts, setAccounts] = useState<BankAccountReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !accessToken) return;

   listBankDetails(accessToken, { size: 100 })
  .then((accounts) => {
    setAccounts(accounts);
  })
      .finally(() => setIsLoading(false));
  }, [accessToken, authLoading]);

  return (
    <AdminShell>
      <RequirePermission module="user_management" need="full">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Seller Bank Accounts</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Review and verify seller payout bank accounts.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                    Account Holder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                    IFSC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-neutral-500">
                      Loading...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-neutral-500">
                      No seller bank accounts found.
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="px-6 py-4 text-sm text-neutral-800">{account.account_holder_name}</td>
                      <td className="px-6 py-4 text-sm text-neutral-800">{account.bank_name}</td>
                      <td className="px-6 py-4 text-sm font-mono text-neutral-800">{account.ifsc_code}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            account.is_verified
                              ? "bg-success-500/10 text-success-500"
                              : "bg-blue-100/10 text-amber-600"
                          }`}
                        >
                          {account.is_verified ? "Verified" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </RequirePermission>
    </AdminShell>
  );
}