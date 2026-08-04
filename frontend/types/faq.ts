export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
export interface FAQPage {
  items: FAQ[];
  total: number;
  page: number;
  size: number;
}
export interface CreateFAQRequest {
  question: string;
  answer: string;
  category?: string | null;
  sort_order?: number;
  is_published?: boolean;
}
export interface UpdateFAQRequest {
  question?: string;
  answer?: string;
  category?: string | null;
  sort_order?: number;
  is_published?: boolean;
}