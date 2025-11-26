import { QueryClient, QueryFunction } from "@tanstack/react-query";

// API request helper function
export async function apiRequest<T = any>(
  method: string,
  url: string,
  body?: any
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `Request failed with status ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text);
}

// Helper functions for common HTTP methods
export const api = {
  get: <T = any>(url: string) => apiRequest<T>("GET", url),
  post: <T = any>(url: string, body?: any) => apiRequest<T>("POST", url, body),
  patch: <T = any>(url: string, body?: any) => apiRequest<T>("PATCH", url, body),
  put: <T = any>(url: string, body?: any) => apiRequest<T>("PUT", url, body),
  delete: <T = any>(url: string) => apiRequest<T>("DELETE", url),
};

// Type for error responses
type UnauthorizedBehavior = "returnNull" | "throw";

// Default query function for TanStack Query
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("token");

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(queryKey[0] as string, {
      headers,
    });

    if (response.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      // Clear auth data on 401
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  };

// Create the query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401 or 403 errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Helper to invalidate queries
export function invalidateQueries(keys: string[]) {
  keys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}