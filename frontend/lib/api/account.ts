import { apiClient } from "@/lib/api/client";

export interface ChangeEmailPayload {
  email: string;
  current_password: string;
}

export function changeEmail(accessToken: string, payload: ChangeEmailPayload): Promise<void> {
  return apiClient.patch<void>("/api/v1/auth/me/email", payload, { accessToken });
}

export function deactivateAccount(accessToken: string): Promise<void> {
  return apiClient.post<void>("/api/v1/auth/me/deactivate", undefined, { accessToken });
}
