import { apiClient } from "@/lib/api/client";
import type { DashboardStats } from "@/types/report";

export function getDashboardStats(accessToken: string): Promise<DashboardStats> {
  return apiClient.get<DashboardStats>("/api/v1/reports/dashboard", { accessToken });
}