export type PropertyCategory = "residential" | "commercial";

export type PropertyStatus = "draft" | "published" | "sold";

export interface Property {
  id: string;
  title: string;
  address: string;
  category: PropertyCategory;
  status: PropertyStatus;
  reserve_price: string;
  description: string | null;
  image_url: string | null;
  seller_id: string | null;
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
}

export interface UpdatePropertyRequest {
  title?: string;
  address?: string;
  category?: PropertyCategory;
  status?: "draft" | "published";
  reserve_price?: string;
  description?: string | null;
  image_url?: string | null;
}

export interface ListPropertiesParams {
  page?: number;
  size?: number;
  search?: string;
  category?: PropertyCategory;
  status?: PropertyStatus;
}

export type PaymentMethod = "token" | "full";

export interface DemoPaymentResult {
  method: PaymentMethod;
  amount: number;
  confirmedAt: string;
}