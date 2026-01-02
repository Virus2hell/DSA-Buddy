// src/lib/api.ts
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiFetch = async (path: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
};
