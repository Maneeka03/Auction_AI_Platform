import { apiClient } from "@/lib/api/client";
import type {
  Category,
  CategoryField,
  CategoryTree,
  CreateCategoryFieldRequest,
  CreateCategoryRequest,
  UpdateCategoryFieldRequest,
  UpdateCategoryRequest,
} from "@/types/category";

const BASE = "/api/v1/categories";

export function listCategories(accessToken: string): Promise<CategoryTree[]> {
  return apiClient.get<CategoryTree[]>(BASE, { accessToken });
}

export function listPublicCategories(): Promise<CategoryTree[]> {
  return apiClient.get<CategoryTree[]>(`${BASE}/public`);
}

export function getCategory(accessToken: string, categoryId: string): Promise<CategoryTree> {
  return apiClient.get<CategoryTree>(`${BASE}/${categoryId}`, { accessToken });
}

export function createCategory(accessToken: string, payload: CreateCategoryRequest): Promise<Category> {
  return apiClient.post<Category>(BASE, payload, { accessToken });
}

export function updateCategory(
  accessToken: string,
  categoryId: string,
  payload: UpdateCategoryRequest,
): Promise<Category> {
  return apiClient.patch<Category>(`${BASE}/${categoryId}`, payload, { accessToken });
}

export function deleteCategory(accessToken: string, categoryId: string): Promise<void> {
  return apiClient.delete<void>(`${BASE}/${categoryId}`, { accessToken });
}

// ── Custom fields ──────────────────────────────────────────────────────────────

export function listCategoryFields(accessToken: string, categoryId: string): Promise<CategoryField[]> {
  return apiClient.get<CategoryField[]>(`${BASE}/${categoryId}/fields`, { accessToken });
}

export function listPublicCategoryFields(categoryId: string): Promise<CategoryField[]> {
  return apiClient.get<CategoryField[]>(`${BASE}/${categoryId}/fields/public`);
}

export function createCategoryField(
  accessToken: string,
  categoryId: string,
  payload: CreateCategoryFieldRequest,
): Promise<CategoryField> {
  return apiClient.post<CategoryField>(`${BASE}/${categoryId}/fields`, payload, { accessToken });
}

export function updateCategoryField(
  accessToken: string,
  categoryId: string,
  fieldId: string,
  payload: UpdateCategoryFieldRequest,
): Promise<CategoryField> {
  return apiClient.patch<CategoryField>(`${BASE}/${categoryId}/fields/${fieldId}`, payload, { accessToken });
}

export function deleteCategoryField(
  accessToken: string,
  categoryId: string,
  fieldId: string,
): Promise<void> {
  return apiClient.delete<void>(`${BASE}/${categoryId}/fields/${fieldId}`, { accessToken });
}
