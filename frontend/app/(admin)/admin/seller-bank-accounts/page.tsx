// "use client";

// import { useEffect, useState } from "react";
// import { AdminShell } from "@/components/layout/AdminShell";
// import { RequirePermission } from "@/components/auth/RequirePermission";
// import { listBankDetails } from "@/lib/api/bankAccounts";
// import { ApiRequestError } from "@/lib/api/client";
// import { useAuth } from "@/lib/auth/session-context";
// import type { BankAccountReviewItem } from "@/types/bankAccount";

// export default function SellerBankAccountsPage() {
//   const { accessToken, isLoading: authLoading } = useAuth();
//   const [accounts, setAccounts] = useState<BankAccountReviewItem[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     if (authLoading || !accessToken) return;

//    listBankDetails(accessToken, { size: 100 })
//   .then((accounts) => {
//     setAccounts(accounts);
//   })
//       .finally(() => setIsLoading(false));
//   }, [accessToken, authLoading]);

//   return (
//     <AdminShell>
//       <RequirePermission module="user_management" need="full">
//         <div className="mx-auto max-w-7xl space-y-6 p-6">
//           <div>
//             <h1 className="text-2xl font-semibold text-neutral-900">Seller Bank Accounts</h1>
//             <p className="mt-1 text-sm text-neutral-600">
//               Review and verify seller payout bank accounts.
//             </p>
//           </div>

//           <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
//             <table className="min-w-full divide-y divide-neutral-200">
//               <thead className="bg-neutral-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
//                     Account Holder
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
//                     Bank
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
//                     IFSC
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-neutral-500">
//                     Status
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-neutral-100">
//                 {isLoading ? (
//                   <tr>
//                     <td colSpan={4} className="px-6 py-12 text-center text-sm text-neutral-500">
//                       Loading...
//                     </td>
//                   </tr>
//                 ) : accounts.length === 0 ? (
//                   <tr>
//                     <td colSpan={4} className="px-6 py-12 text-center text-sm text-neutral-500">
//                       No seller bank accounts found.
//                     </td>
//                   </tr>
//                 ) : (
//                   accounts.map((account) => (
//                     <tr key={account.id}>
//                       <td className="px-6 py-4 text-sm text-neutral-800">{account.account_holder_name}</td>
//                       <td className="px-6 py-4 text-sm text-neutral-800">{account.bank_name}</td>
//                       <td className="px-6 py-4 text-sm font-mono text-neutral-800">{account.ifsc_code}</td>
//                       <td className="px-6 py-4 text-sm">
//                         <span
//                           className={`rounded-full px-2.5 py-1 text-xs font-medium ${
//                             account.is_verified
//                               ? "bg-success-500/10 text-success-500"
//                               : "bg-blue-100/10 text-amber-600"
//                           }`}
//                         >
//                           {account.is_verified ? "Verified" : "Pending"}
//                         </span>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </RequirePermission>
//     </AdminShell>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/AdminShell";
import { RequirePermission } from "@/components/auth/RequirePermission";
import {
  listBankDetails,
  reviewBankDetails,
} from "@/lib/api/bankAccounts";
import { useAuth } from "@/lib/auth/session-context";
import type { BankAccountReviewItem } from "@/types/bankAccount";

export default function SellerBankAccountsPage() {
  const { accessToken, isLoading: authLoading } = useAuth();

  const [accounts, setAccounts] = useState<BankAccountReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !accessToken) return;

    setIsLoading(true);
    setError(null);

   listBankDetails(accessToken, { size: 100 })
  .then((data) => {
    setAccounts(data.items);
  })
      .catch((err) => {
        console.error(err);
        setError("Failed to load seller bank accounts.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, authLoading]);

  const handleReview = async (id: string, approve: boolean) => {
    if (!accessToken) return;

    try {
      setActionLoadingId(id);

       await reviewBankDetails(accessToken, id, { approved: approve });

      setAccounts((prev) =>
        prev.map((account) =>
          account.id === id
            ? { ...account, is_verified: approve }
            : account
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update bank account status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AdminShell>
      <RequirePermission module="user_management" need="full">
        <div className="mx-auto max-w-7xl space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Seller Bank Accounts
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Review and verify seller payout bank accounts.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

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
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-neutral-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-neutral-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-neutral-500"
                    >
                      No seller bank accounts found.
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="px-6 py-4 text-sm text-neutral-800">
                        {account.account_holder_name}
                      </td>

                      <td className="px-6 py-4 text-sm text-neutral-800">
                        {account.bank_name}
                      </td>

                      <td className="px-6 py-4 text-sm font-mono text-neutral-800">
                        {account.ifsc_code}
                      </td>

                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            account.is_verified
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {account.is_verified ? "Verified" : "Pending"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right text-sm">
                        {account.is_verified ? (
                          <span className="text-green-600 font-medium">
                            Approved
                          </span>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleReview(account.id, true)}
                              disabled={actionLoadingId === account.id}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-white transition hover:bg-green-700 disabled:opacity-50"
                            >
                              {actionLoadingId === account.id
                                ? "Approving..."
                                : "Approve"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReview(account.id, false)}
                              disabled={actionLoadingId === account.id}
                              className="rounded-lg border border-red-300 px-3 py-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
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