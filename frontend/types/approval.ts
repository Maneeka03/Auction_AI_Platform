export type ApproverRole = "director" | "appraiser" | "legal_finance";

export type VoteStatus = "pending" | "approved" | "rejected";

export interface ApproverVote {
  role: ApproverRole;
  name: string;
  status: VoteStatus;
  decidedAt?: string;
}

export type ApprovalOutcome = "awaiting_approval" | "approved" | "rejected" | "cancelled";

export interface ApprovalItem {
  id: string;
  lotTitle: string;
  category: string;
  submittedBySeller: string;
  submittedAt: string;
  reservePrice: string;
  votes: ApproverVote[];
  outcome: ApprovalOutcome;
}