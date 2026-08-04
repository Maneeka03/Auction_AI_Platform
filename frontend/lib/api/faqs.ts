import { apiClient } from "@/lib/api/client";
import type { CreateFAQRequest, FAQ, FAQPage, UpdateFAQRequest } from "@/types/faq";

const BASE = "/api/v1/faqs";

export function listPublicFaqs(): Promise<FAQPage> {
  return apiClient.get<FAQPage>(`${BASE}/public?size=100`);
}

export function listFaqs(accessToken: string): Promise<FAQPage> {
  return apiClient.get<FAQPage>(`${BASE}?size=100`, { accessToken });
}

export function createFaq(accessToken: string, payload: CreateFAQRequest): Promise<FAQ> {
  return apiClient.post<FAQ>(BASE, payload, { accessToken });
}

export function updateFaq(accessToken: string, faqId: string, payload: UpdateFAQRequest): Promise<FAQ> {
  return apiClient.patch<FAQ>(`${BASE}/${faqId}`, payload, { accessToken });
}

export function deleteFaq(accessToken: string, faqId: string): Promise<void> {
  return apiClient.delete<void>(`${BASE}/${faqId}`, { accessToken });
}