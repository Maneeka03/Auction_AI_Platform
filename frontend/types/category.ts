export type CategoryFieldType = "text" | "textarea" | "number" | "select" | "boolean" | "date";

export interface CategoryField {
  id: string;
  label: string;
  field_key: string;
  field_type: CategoryFieldType;
  options: string[] | null;
  unit: string | null;
  required: boolean;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  group_label: string | null;
  fields: CategoryField[];
  created_at: string;
}

export interface CategoryTree extends Category {
  children: Category[];
}

export interface CategoryFieldInput {
  label: string;
  field_type: CategoryFieldType;
  options?: string[] | null;
  unit?: string | null;
  required?: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  parent_id?: string | null;
  group_label?: string | null;
  fields?: CategoryFieldInput[];
}

export interface UpdateCategoryRequest {
  name?: string;
  parent_id?: string | null;
  group_label?: string | null;
  // Omit to leave fields unchanged; pass a list to replace the whole set.
  fields?: CategoryFieldInput[] | null;
}
