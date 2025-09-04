// src/api/client.ts
const API_BASE = import.meta.env.VITE_API_BASE as string; // напр. "https://localhost:7287"

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  // на всякий случай: 204/пустое тело
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    // @ts-expect-error — вызывающий знает, что тела может не быть
    return undefined;
  }

  return (await res.json()) as T;
}