import { apiClient } from "@/lib/api/client";
import type {
  AiInsights,
  BestSeller,
  BuyerActivity,
  ConversionRates,
  DashboardStats,
  MarketingPerformance,
  RevenueStats,
  SellerPerformance,
} from "@/types/report";

export function getDashboardStats(accessToken: string): Promise<DashboardStats> {
  return apiClient.get<DashboardStats>("/api/v1/reports/dashboard", { accessToken });
}

export function getRevenueStats(accessToken: string): Promise<RevenueStats> {
  return apiClient.get<RevenueStats>("/api/v1/reports/revenue", { accessToken });
}

export function getAiInsights(accessToken: string): Promise<AiInsights> {
  return apiClient.get<AiInsights>("/api/v1/reports/ai-insights", { accessToken });
}

export function getBestSellers(accessToken: string, limit = 20): Promise<BestSeller[]> {
  return apiClient.get<BestSeller[]>(`/api/v1/reports/best-sellers?limit=${limit}`, { accessToken });
}

export function getBuyerActivity(accessToken: string): Promise<BuyerActivity[]> {
  return apiClient.get<BuyerActivity[]>("/api/v1/reports/buyer-activity", { accessToken });
}

export function getConversionRates(accessToken: string): Promise<ConversionRates> {
  return apiClient.get<ConversionRates>("/api/v1/reports/conversion", { accessToken });
}

export function getMarketingPerformance(accessToken: string): Promise<MarketingPerformance> {
  return apiClient.get<MarketingPerformance>("/api/v1/reports/marketing", { accessToken });
}

export function getSellerPerformance(accessToken: string): Promise<SellerPerformance[]> {
  return apiClient.get<SellerPerformance[]>("/api/v1/reports/seller-performance", { accessToken });
}