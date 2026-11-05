import { ReactNode, useId, useLayoutEffect, useRef, useState } from "react";
import { Icon, IconName } from "./Icons";

export { Icon };
export type { IconName };

const TONES: Record<string, string> = {
  DONE: "ok",
  COMPLETED: "ok",
  PASS: "ok",
  RESOLVED: "ok",
  SIM: "ok",
  IN_PROGRESS: "info",
  NEXT: "neutral",
  PLANNED: "neutral",
  NOT_STARTED: "neutral",
  RECORDED: "neutral",
  NOT_RECORDED: "neutral",
  WAITING: "warn",
  BLOCKED: "warn",
  WARNING: "warn",
  PARCIAL: "warn",
  PENDING: "neutral",
  FAIL: "bad",
  NÃO: "neutral",
};

const LADDER = ["Identificada", "Em migração", "Implementada", "Testada", "Homologada"];

export const fmt = (ts?: string | null) =>
  ts ? new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export const fmtDay = (ts?: string | null) =>
  ts ? new Date(ts).toLocaleDateString("pt-BR") : "—";

export const fmtTime = (ts?: string | null) =>
  ts ? new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";

export function ago(ts?: string | null): string {
  if (!ts) return "sem registro";
  const min = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 60000));
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} minuto${min === 1 ? "" : "s"}`;
  const h = Math.floor(min / 60);
  if (h < 48) return `há ${h} hora${h === 1 ? "" : "s"}`;
  return `há ${Math.floor(h / 24)} dias`;
}

export function Pill({
  code,
  label,
  dot = true,
}: {
  code?: string | null;
  label: ReactNode;
  dot?: boolean;
}) {
  const tone = TONES[code ?? ""] ?? "neutral";
  return (
    <span className={`badge ${tone}`}>
      {dot && <span className="dot" aria-hidden />}
      {label}
    </span>
  );
}

export function Bar({ value, tone }: { value: number; tone?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className="bar"
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${v}%`}
    >
      <div className={`bar-fill ${tone ?? ""}`} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Ring({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 100 100" role="img" aria-label={`${v}% concluído`}>
      <circle cx="50" cy="50" r={r} className="ring-track" />
      <circle
        cx="50"
        cy="50"
        r={r}
        className="ring-fill"
        strokeDasharray={`${(c * v) / 100} ${c}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="49" className="ring-value">
        {v}%
      </text>
      <text x="50" y="64" className="ring-label">
        concluído
      </text>
    </svg>
  );
}

export function Ladder({ level }: { level: number }) {
  const clamped = Math.max(0, Math.min(LADDER.length - 1, level));
  return (
    <ol className="ladder" aria-label={`Situação: ${LADDER[clamped]}`}>
      {LADDER.map((s, i) => (
        <li key={s} className={i <= clamped ? "on" : ""} title={s}>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function SectionHead({
  icon,
  title,
  action,
  count,
}: {
  icon: IconName;
  title: string;
  action?: ReactNode;
  count?: number;
}) {
  return (
    <div className="sec-head">
      <span className="sec-icon">
        <Icon n={icon} />
      </span>
      <h2>
        {title}
        {count !== undefined && <span className="sec-count">{count}</span>}
      </h2>
      {action && <div className="sec-action">{action}</div>}
    </div>
  );
}

export function LinkButton({
  children,
  onClick,
  icon = "arrow",
}: {
  children: ReactNode;
  onClick: () => void;
  icon?: IconName;
}) {
  return (
    <button type="button" className="link-btn" onClick={onClick}>
      {children}
      <Icon n={icon} size={14} />
    </button>
  );
}

export function Clamp({
  lines,
  children,
  className,
}: {
  lines: number;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(false);
  const id = useId();

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !open) {
      setOver(el.scrollHeight - el.clientHeight > 2);
    }
  });

  return (
    <div className={className}>
      <div id={id} ref={ref} className={open ? "clamp-open" : `clamp clamp-${lines}`}>
        {children}
      </div>
      {(over || open) && (
        <button
          type="button"
          className="more-btn"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {open ? "ver menos" : "ver mais"}
        </button>
      )}
    </div>
  );
}

export function MoreList<T>({
  items,
  initial,
  render,
  label = "Ver mais",
  className,
}: {
  items: T[];
  initial: number;
  render: (x: T) => ReactNode;
  label?: string;
  className?: string;
}) {
  const [all, setAll] = useState(false);
  const id = useId();
  const shown = all ? items : items.slice(0, initial);

  return (
    <>
      <div id={id} className={className}>
        {shown.map(render)}
      </div>
      {items.length > initial && (
        <button
          type="button"
          className="more-btn block"
          aria-expanded={all}
          aria-controls={id}
          onClick={() => setAll(!all)}
        >
          {all ? "Mostrar menos" : `${label} (${items.length - initial})`}
        </button>
      )}
    </>
  );
}

export function Disclosure({
  summary,
  children,
  className,
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className={`disclosure ${open ? "open" : ""} ${className ?? ""}`}>
      <button
        type="button"
        className="disc-btn"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span>{summary}</span>
        <Icon n="chevron" size={14} className="chev" />
      </button>
      {open && <div id={id} className="disc-body">{children}</div>}
    </div>
  );
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

export function Metric({
  icon,
  value,
  label,
  tone,
}: {
  icon: IconName;
  value: ReactNode;
  label: string;
  tone?: string;
}) {
  return (
    <div className={`metric ${tone ?? ""}`}>
      <span className="metric-icon">
        <Icon n={icon} size={18} />
      </span>
      <div>
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
      </div>
    </div>
  );
}
