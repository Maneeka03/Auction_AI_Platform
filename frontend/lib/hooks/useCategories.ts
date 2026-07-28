"use client";

import { useCallback, useEffect, useState } from "react";
import { listCategories } from "@/lib/api/categories";
import { ApiRequestError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session-context";
import type { CategoryTree } from "@/types/category";

export function useCategories() {
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await listCategories(accessToken);
      setCategories(result);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { categories, isLoading, error, refetch };
}   