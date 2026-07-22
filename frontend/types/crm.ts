import type { UserStatus } from "@/types/auth";

export interface BuyerCrmRow {
  id: string;
  full_name: string;
  email: string;
  status: UserStatus;
  created_at: string;
  bids: number;
  auctions_won: number;
  properties_bought: number;
}

export interface SellerCrmRow {
  id: string;
  full_name: string;
  email: string;
  status: UserStatus;
  created_at: string;
  listings: number;
  sold: number;
  payouts: string;
}

export interface BuyerCrmPage {
  items: BuyerCrmRow[];
  total: number;
  page: number;
  size: number;
}

export interface SellerCrmPage {
  items: SellerCrmRow[];
  total: number;
  page: number;
  size: number;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadPage {
  items: Lead[];
  total: number;
  page: number;
  size: number;
}

export interface CreateLeadRequest {
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: LeadStatus;
  notes?: string | null;
}

export interface UpdateLeadRequest {
  name?: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: LeadStatus;
  notes?: string | null;
}

export interface ListCrmParams {
  page?: number;
  size?: number;
  search?: string;
}

export interface ListLeadsParams {
  page?: number;
  size?: number;
  status?: LeadStatus;
}