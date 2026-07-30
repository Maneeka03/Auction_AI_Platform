export interface Review {
  id: string;
  author_id: string;
  author_name: string;
  seller_id: string;
  property_id: string;
  rating: number;
  body: string | null;
  created_at: string;
}

export interface CreateReviewPayload {
  property_id: string;
  rating: number;
  body?: string | null;
}
