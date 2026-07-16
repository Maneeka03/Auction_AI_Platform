const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DEFAULT_TIMEOUT_MS = 15_000;

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  accessToken?: string | null;
}

async function request<T>(
  path: string,
  { body, timeoutMs = DEFAULT_TIMEOUT_MS, headers, accessToken, ...init }: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      method: init.method ?? "GET",
      credentials: "include",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      const apiError = payload?.error;
      const fieldErrors: Record<string, string> | undefined = apiError?.fields
        ? Object.fromEntries(
            (apiError.fields as { field: string; reason: string }[]).map((f) => [f.field, f.reason]),
          )
        : undefined;

      throw new ApiRequestError(
        response.status,
        apiError?.code ?? "unknown_error",
        apiError?.message ?? "Something went wrong. Please try again.",
        fieldErrors,
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiRequestError(0, "timeout", "The request timed out. Please try again.");
    }
    throw new ApiRequestError(0, "network_error", "Unable to reach the server. Check your connection.");
  } finally {
    clearTimeout(timeout);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
};