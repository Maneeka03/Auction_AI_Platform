import { apiClient } from "@/lib/api/client";
import type { KycPage, KycStatus, KycSubmission, ReviewKycRequest, SubmitKycRequest } from "@/types/kyc";

export function submitKyc(accessToken: string, payload: SubmitKycRequest): Promise<KycSubmission> {
  return apiClient.post<KycSubmission>("/api/v1/kyc", payload, { accessToken });
}

export function getMyKyc(accessToken: string): Promise<KycSubmission | undefined> {
  return apiClient.get<KycSubmission | undefined>("/api/v1/kyc/me", { accessToken });
}

export function listKycSubmissions(
  accessToken: string,
  params: { page?: number; size?: number; status?: KycStatus } = {},
): Promise<KycPage> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.size) query.set("size", String(params.size));
  if (params.status) query.set("status", params.status);
  const queryString = query.toString();
  return apiClient.get<KycPage>(`/api/v1/admin/kyc${queryString ? `?${queryString}` : ""}`, { accessToken });
}

export function reviewKyc(
  accessToken: string,
  submissionId: string,
  payload: ReviewKycRequest,
): Promise<KycSubmission> {
  return apiClient.patch<KycSubmission>(`/api/v1/admin/kyc/${submissionId}`, payload, { accessToken });
}

export function getKycDocumentUrl(accessToken: string, submissionId: string, key: string): Promise<{ url: string }> {
  return apiClient.get<{ url: string }>(
    `/api/v1/admin/kyc/${submissionId}/documents/${encodeURIComponent(key)}`,
    { accessToken },
  );
}