import { apiClient } from "@/lib/api/client";
import type { AccessToken, LoginPayload, RegisterPayload, Session } from "@/types/auth";

const BASE = "/api/v1/auth";

export function register(payload: RegisterPayload): Promise<Session> {
  return apiClient.post<Session>(`${BASE}/register`, payload);
}

export function login(payload: LoginPayload): Promise<AccessToken> {
  return apiClient.post<AccessToken>(`${BASE}/login`, payload);
}

// No body: reads the httpOnly refresh cookie automatically via credentials: "include".
export function refresh(): Promise<AccessToken> {
  return apiClient.post<AccessToken>(`${BASE}/refresh`);
}

export function logout(accessToken: string): Promise<void> {
  return apiClient.post<void>(`${BASE}/logout`, undefined, { accessToken });
}

export function getMe(accessToken: string): Promise<Session> {
  return apiClient.get<Session>(`${BASE}/me`, { accessToken });
}

// Always 202, same generic response whether or not the account exists.
export function forgotPassword(email: string): Promise<void> {
  return apiClient.post<void>(`${BASE}/forgot-password`, { email });
}

// Serves both "forgot password" and staff first-password-set flows.
export function resetPassword(token: string, password: string): Promise<void> {
  return apiClient.post<void>(`${BASE}/reset-password`, { token, password });
}

export function verifyEmail(token: string): Promise<void> {
  return apiClient.post<void>(`${BASE}/verify-email`, { token });
}

// Always 202, same generic response whether or not the account exists.
export function resendVerification(email: string): Promise<void> {
  return apiClient.post<void>(`${BASE}/resend-verification`, { email });
}