export type InsurancePolicyStatus =
  | "quote_selected"
  | "purchased"
  | "declined";

export interface InsuranceQuote {
  provider_name: string;
  coverage_amount: string;
  premium: string;
}

export interface SelectInsuranceQuoteRequest {
  provider_name: string;
}

export interface InsurancePolicy {
  id: string;
  escrow_id: string;
  provider_name: string;
  quoted_premium: string;
  coverage_amount: string;
  status: InsurancePolicyStatus;
  purchased_at: string | null;
}
