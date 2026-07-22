import { apiClient } from "@/lib/api/client";
import type { AccessToken, LoginPayload, RegisterPayload, Session } from "@/types/auth";

const BASE = "/api/v1/auth";

export function register(payload: RegisterPayload): Promise<Session> {
  return apiClient.post<Session>(`${BASE}/register`, payload);
}

export function login(payload: LoginPayload): Promise<AccessToken> {
  return apiClient.post<AccessToken>(`${BASE}/login`, payload);
}

export function refresh(): Promise<AccessToken> {
  return apiClient.post<AccessToken>(`${BASE}/refresh`);
}

export function logout(accessToken: string): Promise<void> {
  return apiClient.post<void>(`${BASE}/logout`, undefined, { accessToken });
}

export function getMe(accessToken: string): Promise<Session> {
  return apiClient.get<Session>(`${BASE}/me`, { accessToken });
}

export function forgotPassword(email: string): Promise<void> {
  return apiClient.post<void>(`${BASE}/forgot-password`, { email });
}

export function resetPassword(token: string, password: string): Promise<void> {
  return apiClient.post<void>(`${BASE}/reset-password`, { token, password });
}

export function verifyEmail(token: string): Promise<void> {
  return apiClient.post<void>(`${BASE}/verify-email`, { token });
}


export function resendVerification(email: string): Promise<void> {
  return apiClient.post<void>(`${BASE}/resend-verification`, { email });
}