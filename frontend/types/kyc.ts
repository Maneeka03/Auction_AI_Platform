export type KycStatus = "pending" | "approved" | "rejected";

export interface KycSubmission {
  id: string;
  user_id: string;
  status: KycStatus;
  legal_name: string;
  document_keys: string[];
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

// The admin review queue also carries the applicant's name/email inline.
export interface KycReviewItem extends KycSubmission {
  full_name: string;
  email: string;
}

export interface KycPage {
  items: KycReviewItem[];
  total: number;
  page: number;
  size: number;
}

export interface SubmitKycRequest {
  legal_name: string;
  document_keys: string[];
}

export interface ReviewKycRequest {
  approved: boolean;
  notes?: string | null;
}