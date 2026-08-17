import { apiClient } from "@/lib/api/client";
import type {
  BankAccountPage,
  BankAccountReviewItem,
  ReviewBankAccountRequest,
} from "@/types/bankAccount";

export function listBankDetails(
  accessToken: string,
  params: { page?: number; size?: number; verified?: boolean } = {},
): Promise<BankAccountPage> {
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.verified !== undefined) {
    query.set("verified", String(params.verified));
  }

  const queryString = query.toString();

  return apiClient.get<BankAccountPage>(
    `/api/v1/admin/seller-bank-accounts${queryString ? `?${queryString}` : ""}`,
    { accessToken },
  );
}

export function reviewBankDetails(
  accessToken: string,
  accountId: string,
  payload: ReviewBankAccountRequest,
): Promise<BankAccountReviewItem> {
  return apiClient.patch<BankAccountReviewItem>(
    `/api/v1/admin/seller-bank-accounts/${accountId}`,
    payload,
    { accessToken },
  );
}
