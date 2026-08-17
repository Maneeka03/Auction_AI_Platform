import type { BankAccount } from "@/types/portal";

export interface BankAccountReviewItem extends BankAccount {
  user_id: string;
  full_name: string;
  email: string;
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