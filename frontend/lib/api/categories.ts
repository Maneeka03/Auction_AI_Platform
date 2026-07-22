import { apiClient } from "@/lib/api/client";
import type { Category, CategoryTree, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category";

const BASE = "/api/v1/categories";

export function listCategories(accessToken: string): Promise<CategoryTree[]> {
  return apiClient.get<CategoryTree[]>(BASE, { accessToken });
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