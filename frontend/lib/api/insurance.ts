import { apiClient } from "@/lib/api/client";
import type {
  InsurancePolicy,
  InsuranceQuote,
  SelectInsuranceQuoteRequest,
} from "@/types/insurance";

const BASE = "/api/v1/escrow";

export function listInsuranceQuotes(
  accessToken: string,
  escrowId: string,
): Promise<InsuranceQuote[]> {
  return apiClient.get<InsuranceQuote[]>(
    `${BASE}/${escrowId}/insurance/quotes`,
    { accessToken },
  );
}

export function selectInsuranceQuote(
  accessToken: string,
  escrowId: string,
  providerName: string,
): Promise<InsurancePolicy> {
  const body: SelectInsuranceQuoteRequest = {
    provider_name: providerName,
  };

  return apiClient.post<InsurancePolicy>(
    `${BASE}/${escrowId}/insurance/select`,
    body,
    { accessToken },
  );
}

export function purchaseInsurance(
  accessToken: string,
  escrowId: string,
): Promise<InsurancePolicy> {
  return apiClient.post<InsurancePolicy>(
    `${BASE}/${escrowId}/insurance/purchase`,
    undefined,
    { accessToken },
  );
}
