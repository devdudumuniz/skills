import { ReactNode, useEffect, useState } from "react";
import { api, Json } from "./api";

export function useApi<T = Json>(path: string | null, refreshMs = 0, keepPolling?: (d: T) => boolean):
  { data: T | null; error: string | null; loading: boolean } {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    let alive = true;
    if (tick === 0) setState((s) => ({ ...s, loading: true, error: null }));
    api<T>(path)
      .then((data) => {
        if (!alive) return;
        setState({ data, error: null, loading: false });
        if (refreshMs > 0 && (!keepPolling || keepPolling(data))) setTimeout(() => alive && setTick((x) => x + 1), refreshMs);
      })
      .catch((e: Error) => alive && setState({ data: null, error: e.message, loading: false }));
    return () => {
      alive = false;
    };
  }, [path, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

export function Load<T>({ q, children }: { q: { data: T | null; error: string | null; loading: boolean }; children: (d: T) => ReactNode }) {
  if (q.error) return <div className="callout error">Erro ao consultar a API: {q.error}</div>;
  if (q.loading || q.data === null) return <div className="muted">Carregando…</div>;
  return <>{children(q.data)}</>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v ?? <span className="muted">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}
