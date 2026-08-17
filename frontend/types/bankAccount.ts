export type BankAccountType = "savings" | "current";

export interface BankAccountReviewItem {
  id: string;
  account_holder_name: string;
  bank_name: string;
  // Masked - only the last 4 digits are ever sent back by the API.
  account_number_masked: string;
  ifsc_code: string;
  branch_name: string | null;
  account_type: BankAccountType;
  is_verified: boolean;
  updated_at: string;
}

export interface BankAccountPage {
  items: BankAccountReviewItem[];
  total: number;
  page: number;
  size: number;
}

export interface ReviewBankAccountRequest {
  approved: boolean;
}
