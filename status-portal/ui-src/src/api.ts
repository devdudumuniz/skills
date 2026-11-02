// Porta de dados do painel: Query API somente leitura (GET /api/*). Em modo estático (`status export`) lê api/<rota>.json.
export type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any

declare global {
  interface Window {
    STATUS_STATIC?: boolean;
  }
}

/** O servidor do kit é somente leitura (sem Command API): quem gera relatórios é o CLI. */
export const CAN_COMMAND = false;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function errorOf(res: Response): Promise<ApiError> {
  let msg = `HTTP ${res.status}`;
  try {
    msg = (await res.json()).error ?? msg;
  } catch {
    /* corpo não-JSON */
  }
  return new ApiError(res.status, msg);
}

async function getJson(url: string): Promise<Json> {
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw await errorOf(res);
  return res.json();
}

export async function api<T = Json>(path: string): Promise<T> {
  if (!window.STATUS_STATIC) return getJson(`api/${path}`) as Promise<T>;
  const [p, query] = path.split("?");
  const d = await getJson(`api/${p}.json`);
  if (p === "project/timeline") {
    const q = new URLSearchParams(query ?? "");
    const limit = Number(q.get("limit")) || 25;
    const offset = Number(q.get("offset")) || 0;
    return { total: d.total, offset, limit, items: d.items.slice(offset, offset + limit), hours: d.hours } as T;
  }
  return d as T;
}

export function qs(params: Record<string, string>): string {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && p.set(k, v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function command<T = Json>(_name: string, _body: Record<string, unknown>): Promise<T> {
  throw new ApiError(405, "painel somente leitura: use o CLI (python status/status.py ...)");
}
