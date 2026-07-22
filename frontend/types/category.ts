export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
}

export interface CategoryTree extends Category {
  children: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  parent_id?: string | null;
}

export interface UpdateCategoryRequest {
  name?: string;
  parent_id?: string | null;
}