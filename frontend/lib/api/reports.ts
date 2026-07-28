import { apiClient } from "@/lib/api/client";
import type { DashboardStats, RevenueStats } from "@/types/report";

export function getDashboardStats(accessToken: string): Promise<DashboardStats> {
  return apiClient.get<DashboardStats>("/api/v1/reports/dashboard", { accessToken });
}

export function getRevenue(accessToken: string): Promise<RevenueStats> {
  return apiClient.get<RevenueStats>("/api/v1/reports/revenue", { accessToken });
}