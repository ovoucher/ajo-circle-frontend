import { API_URL, type RuntimeConfig } from "../lib/config";
import type { CircleEvent, CircleRecord } from "../types";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(res.status === 404 ? "Not found" : `API error ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  config: () => get<RuntimeConfig>("/api/config"),
  circles: () => get<{ count: number; circles: CircleRecord[] }>("/api/circles"),
  circle: (id: number) => get<CircleRecord>(`/api/circles/${id}`),
  events: (id: number) => get<{ events: CircleEvent[] }>(`/api/circles/${id}/events`),
  verifyTx: async (hash: string) => {
    await fetch(`${API_URL}/api/transactions/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hash }),
    });
  },
};
