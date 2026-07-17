import { apiClient } from "@/lib/api/client";
import type { PresignUploadRequest, PresignUploadResponse } from "@/types/upload";

export function presignUpload(
  accessToken: string,
  payload: PresignUploadRequest,
): Promise<PresignUploadResponse> {
  return apiClient.post<PresignUploadResponse>("/api/v1/uploads/presign", payload, { accessToken });
}