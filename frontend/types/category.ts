// export interface Category {
//   id: string;
//   name: string;
//   slug: string;
//   parent_id: string | null;
//   created_at: string;
// }

// export type FieldType = "text" | "number" | "dropdown" | "date" | "boolean" | "file";

// export interface CategoryField {
//   id: string;
//   category_id: string;
//   label: string;
//   field_type: FieldType;
//   options: string[] | null;
//   required: boolean;
//   sort_order: number;
//   created_at: string;
// }

// export interface CategoryTree extends Category {
//   children: Category[];
//   fields: CategoryField[];
// }

// export interface CreateCategoryRequest {
//   name: string;
//   parent_id?: string | null;
// }

// export interface UpdateCategoryRequest {
//   name?: string;
//   parent_id?: string | null;
// }

// export interface CreateCategoryFieldRequest {
//   label: string;
//   field_type: FieldType;
//   options?: string[] | null;
//   required?: boolean;
//   sort_order?: number;
// }

// export interface UpdateCategoryFieldRequest {
//   label?: string;
//   field_type?: FieldType;
//   options?: string[] | null;
//   required?: boolean;
//   sort_order?: number;
// }

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "date"
  | "boolean";


export interface CategoryField {
  id: string;
  category_id: string;
  label: string;
  field_type: FieldType;
  options: string[] | null;
  required: boolean;
  sort_order: number;
  created_at: string;
}


// export interface CategoryTree extends Category {
//   children: CategoryTree[];
//   fields: CategoryField[];
// }
export interface CategoryTree extends Category {
  children: CategoryTree[];
  fields: CategoryField[];
}


export interface CreateCategoryRequest {
  name: string;
  parent_id?: string | null;
}


export interface UpdateCategoryRequest {
  name?: string;
  parent_id?: string | null;
}


export interface CreateCategoryFieldRequest {
  label: string;
  field_type: FieldType;
  options?: string[] | null;
  required?: boolean;
  sort_order?: number;
}


export interface UpdateCategoryFieldRequest {
  label?: string;
  field_type?: FieldType;
  options?: string[] | null;
  required?: boolean;
  sort_order?: number;
}


// API response types

export interface CategoryTreeResponse {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
  children: CategoryTree[];
  fields: CategoryField[];
}


// Seller custom field values
// Example:
// {
//   "field_uuid": "value"
// }

export type CategoryFieldValues = Record<string, string | number | boolean | null>;