// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
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

export const sendMessage = (data: any) => apiFetch('/api/messages/send', {
  method: 'POST',
  body: JSON.stringify(data)
});

export default apiFetch;
