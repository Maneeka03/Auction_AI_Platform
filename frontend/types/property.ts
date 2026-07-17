export type PropertyCategory = "residential" | "commercial";

export type PropertyStatus = "draft" | "published" | "sold" | "rejected";

// Only these two are settable via PATCH — sold and rejected are system-set
// (by a purchase/award, or by the approval quorum), never by a direct edit.
export type EditablePropertyStatus = "draft" | "published";

export type PaymentMethod = "token" | "full";

export type ApproverSeat = "director" | "appraiser" | "legal_finance";

export interface PropertyVote {
  seat: ApproverSeat;
  voter_name: string;
  approved: boolean;
  decided_at: string;
}

export interface Property {
  id: string;
  title: string;
  address: string;
  category: PropertyCategory;
  status: PropertyStatus;
  reserve_price: string;
  description: string | null;
  image_url: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  seller_id: string | null;
  seller_name: string | null;
  buyer_id: string | null;
  payment_method: PaymentMethod | null;
  paid_amount: string | null;
  purchased_at: string | null;
  votes: PropertyVote[];
  created_at: string;
}

export interface PropertyPage {
  items: Property[];
  total: number;
  page: number;
  size: number;
}

export interface CreatePropertyRequest {
  title: string;
  address: string;
  category: PropertyCategory;
  reserve_price: string;
  description?: string | null;
  image_url?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
}

export interface UpdatePropertyRequest {
  title?: string;
  address?: string;
  category?: PropertyCategory;
  status?: EditablePropertyStatus;
  reserve_price?: string;
  description?: string | null;
  image_url?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
}

export interface PurchaseRequest {
  method: PaymentMethod;
}

export interface VoteRequest {
  approved: boolean;
}

export interface ListPropertiesParams {
  page?: number;
  size?: number;
  search?: string;
  category?: PropertyCategory;
  status?: PropertyStatus;
  min_price?: number;
  max_price?: number;
}

export interface DemoPaymentResult {
  method: PaymentMethod;
  amount: number;
  confirmedAt: string;
}