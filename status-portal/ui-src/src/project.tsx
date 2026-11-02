import { ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Empty, KV, Load, useApi } from "./components";
import { CAN_COMMAND, command, Json } from "./api";

/** ACOMPANHAMENTO — portal do projeto para o cliente. Projeção somente leitura de work/backlog.yaml +
 *  work/events.jsonl + evidências (GET /api/project/*). Nenhum status é mantido aqui: esta página só APRESENTA
 *  o que a API devolve (mesmos dados, mesmas regras; detalhes extensos ficam em expansões). */

const POLL = 30000;

/** Textos que mudam de projeto para projeto. Vêm de `labels:` no portal.yaml (via /api/project/overview). */
export const LABELS: Record<string, string> = {
  nothing_waiting: "Nada aguardando o cliente ou a equipe.",
  modernizing: "O que está sendo feito",
  processes_title: "Processos do projeto",
  capabilities_title: "Capacidades identificadas",
  capabilities_intro: "Capacidades identificadas no levantamento, agrupadas por área. A situação de cada área vem do andamento real das tarefas.",
  comparative_title: "Ambiente atual × nova plataforma",
  before_after_intro: "Como era antes, o que existe hoje, por que cada mudança foi feita, o impacto e os erros encontrados. A situação de cada item vem das tarefas do projeto.",
  automation_pill: "Automatizada",
  components_label: "componentes da plataforma",
  skills_label: "skills encontradas",
};
type Go = (tab: string, extra?: Record<string, string>) => void;

const TABS: [string, string, IconName][] = [
  ["visao", "Visão geral", "home"], ["planejamento", "Fases e planejamento", "list"], ["tarefas", "Tarefas", "check-square"],
  ["processos", "Processos e capacidades", "layers"], ["antes-agora", "Antes × agora", "swap"],
  ["evolucao", "Evolução e achados", "trend"], ["historico", "Histórico", "history"],
  ["relatorios", "Relatórios", "file"],
];
const TASK_TABS: [string, string][] = [
  ["concluidas", "Concluídas"], ["em_execucao", "Em execução"], ["proximas", "Próximas"], ["bloqueadas", "Aguardando"],
  ["todas", "Todas"],
];
const TONES: Record<string, string> = {
  DONE: "ok", COMPLETED: "ok", PASS: "ok", RESOLVED: "ok", SIM: "ok",
  IN_PROGRESS: "info", NEXT: "neutral", PLANNED: "neutral", NOT_STARTED: "neutral", RECORDED: "neutral", NOT_RECORDED: "neutral",
  WAITING: "warn", BLOCKED: "warn", WARNING: "warn", PARCIAL: "warn", PENDING: "neutral", FAIL: "bad", NÃO: "neutral",
};
const LADDER = ["Identificada", "Em migração", "Implementada", "Testada", "Homologada"];
const GATE_PT: Record<string, string> = { PASS: "Aprovado", FAIL: "Reprovado", PENDING: "Pendente", NOT_RECORDED: "Não registrado" };
const PRIO: Record<string, string> = { P0: "Crítica", P1: "Alta", P2: "Média", P3: "Baixa" };

export const fmt = (ts?: string | null) =>
  ts ? new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
export const fmtDay = (ts?: string | null) => (ts ? new Date(ts).toLocaleDateString("pt-BR") : "—");
const fmtTime = (ts?: string | null) => (ts ? new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—");

function ago(ts?: string | null): string {
  if (!ts) return "sem registro";
  const min = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 60000));
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} minuto${min === 1 ? "" : "s"}`;
  const h = Math.floor(min / 60);
  if (h < 48) return `há ${h} hora${h === 1 ? "" : "s"}`;
  return `há ${Math.floor(h / 24)} dias`;
}

// ------------------------------------------------------------------ ícones (SVG inline, sem dependência nova)
type IconName = "home" | "list" | "check-square" | "layers" | "trend" | "history" | "file" | "play" | "hourglass" | "info" |
  "flag" | "check-circle" | "shield" | "chart" | "clock" | "target" | "gear" | "user" | "alert" | "arrow" | "chevron" |
  "download" | "eye" | "calendar" | "scale" | "beaker" | "swap";
const PATHS: Record<IconName, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  "check-square": "M9 11l3 3 8-8M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11",
  layers: "M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 18l10 5 10-5",
  trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
  history: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 3",
  file: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6",
  play: "M8 5v14l11-7z",
  hourglass: "M6 3h12M6 21h12M7 3c0 5 10 6 10 9s-10 4-10 9M17 3c0 5-10 6-10 9s10 4 10 9",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  "check-circle": "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM8 12l3 3 5-6",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 7v5l3 2",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  chevron: "M6 9l6 6 6-6",
  download: "M12 3v12M7 10l5 5 5-5M5 21h14",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  calendar: "M4 5h16v16H4zM4 9h16M8 3v4M16 3v4",
  scale: "M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z",
  beaker: "M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3",
  swap: "M7 7h13l-4-4M17 17H4l4 4",
};
export function Icon({ n, size = 16, className }: { n: IconName; size?: number; className?: string }) {
  return (
    <svg className={`ic ${className ?? ""}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[n]} />
    </svg>
  );
}

// ------------------------------------------------------------------ primitivas visuais
function Pill({ code, label, dot = true }: { code?: string | null; label: ReactNode; dot?: boolean }) {
  const tone = TONES[code ?? ""] ?? "neutral";
  return <span className={`badge ${tone}`}>{dot && <span className="dot" aria-hidden />}{label}</span>;
}

function Bar({ value, tone }: { value: number; tone?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="bar" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={`${v}%`}>
      <div className={`bar-fill ${tone ?? ""}`} style={{ width: `${v}%` }} />
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = 42, c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 100 100" role="img" aria-label={`${v}% concluído`}>
      <circle cx="50" cy="50" r={r} className="ring-track" />
      <circle cx="50" cy="50" r={r} className="ring-fill" strokeDasharray={`${(c * v) / 100} ${c}`} transform="rotate(-90 50 50)" />
      <text x="50" y="49" className="ring-value">{v}%</text>
      <text x="50" y="64" className="ring-label">concluído</text>
    </svg>
  );
}

function Ladder({ level }: { level: number }) {
  return (
    <ol className="ladder" aria-label={`Situação: ${LADDER[level]}`}>
      {LADDER.map((s, i) => <li key={s} className={i <= level ? "on" : ""} title={s}><span>{s}</span></li>)}
    </ol>
  );
}

function SectionHead({ icon, title, action, count }: { icon: IconName; title: string; action?: ReactNode; count?: number }) {
  return (
    <div className="sec-head">
      <span className="sec-icon"><Icon n={icon} /></span>
      <h2>{title}{count !== undefined && <span className="sec-count">{count}</span>}</h2>
      {action && <div className="sec-action">{action}</div>}
    </div>
  );
}

function LinkButton({ children, onClick, icon = "arrow" }: { children: ReactNode; onClick: () => void; icon?: IconName }) {
  return <button type="button" className="link-btn" onClick={onClick}>{children}<Icon n={icon} size={14} /></button>;
}

/** Texto cortado em N linhas; "ver mais" só aparece quando há de fato texto escondido. */
function Clamp({ lines, children, className }: { lines: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(false);
  const id = useId();
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !open) setOver(el.scrollHeight - el.clientHeight > 2);
  });
  return (
    <div className={className}>
      <div id={id} ref={ref} className={open ? "clamp-open" : `clamp clamp-${lines}`}>{children}</div>
      {(over || open) && (
        <button type="button" className="more-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          {open ? "ver menos" : "ver mais"}
        </button>
      )}
    </div>
  );
}

/** Lista com os primeiros N itens e expansão progressiva. */
function MoreList<T>({ items, initial, render, label = "Ver mais", className }: {
  items: T[]; initial: number; render: (x: T) => ReactNode; label?: string; className?: string;
}) {
  const [all, setAll] = useState(false);
  const id = useId();
  const shown = all ? items : items.slice(0, initial);
  return (
    <>
      <div id={id} className={className}>{shown.map(render)}</div>
      {items.length > initial && (
        <button type="button" className="more-btn block" aria-expanded={all} aria-controls={id} onClick={() => setAll(!all)}>
          {all ? "Mostrar menos" : `${label} (${items.length - initial})`}
        </button>
      )}
    </>
  );
}

function Disclosure({ summary, children, className }: { summary: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`disclosure ${open ? "open" : ""} ${className ?? ""}`}>
      <button type="button" className="disc-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span>{summary}</span><Icon n="chevron" size={14} className="chev" />
      </button>
      {open && <div id={id} className="disc-body">{children}</div>}
    </div>
  );
}

// ------------------------------------------------------------------ página
export function ProjectPortal({ initial, role }: { initial: URLSearchParams; role: string }) {
  const [tab, setTab] = useState(initial.get("tab") ?? "visao");
  const [extra, setExtra] = useState<Record<string, string>>(() => {
    const e: Record<string, string> = {};
    for (const k of ["tarefas", "task"]) if (initial.get(k)) e[k] = initial.get(k) as string;
    return e;
  });
  const admin = role === "ADMIN";
  // endereço alterado por fora (link, voltar/avançar): a aba acompanha o hash
  const urlKey = initial.toString();
  useEffect(() => {
    const t = initial.get("tab");
    if (t) setTab(t);
    const e: Record<string, string> = {};
    for (const k of ["tarefas", "task"]) if (initial.get(k)) e[k] = initial.get(k) as string;
    setExtra(e);
  }, [urlKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const go: Go = (t, ex = {}) => {
    setTab(t);
    setExtra(ex);
    const qs = new URLSearchParams({ tab: t, ...ex }).toString();
    // location.hash (não replaceState): o roteador do App é avisado e o botão "voltar" percorre as abas
    if (location.hash !== `#/acompanhamento?${qs}`) location.hash = `#/acompanhamento?${qs}`;
    window.scrollTo({ top: 0 });
  };
  const ov = useApi("project/overview", POLL);
  if (ov.data?.labels) Object.assign(LABELS, ov.data.labels);
  const sideFoot = typeof document !== "undefined" ? document.getElementById("side-foot") : null;
  return (
    <div className="portal portal-theme">
      {sideFoot && ov.data && createPortal(
        <div className="side-update"><Icon n="clock" size={14} /><span>Última atualização<br /><b>{fmt(ov.data.last_update)}</b></span></div>, sideFoot)}
      <Load q={ov}>{(d: Json) => <Header d={d} go={go} />}</Load>
      <nav className="tabs" aria-label="Seções do acompanhamento">
        {TABS.map(([k, l, ic]) => (
          <button key={k} type="button" className={tab === k ? "tab active" : "tab"} aria-current={tab === k ? "page" : undefined}
            onClick={() => go(k)}>
            <Icon n={ic} size={15} />{l}
          </button>
        ))}
      </nav>
      {tab === "visao" && <Load q={ov}>{(d: Json) => <Home d={d} go={go} />}</Load>}
      {tab === "planejamento" && <Planning go={go} />}
      {tab === "tarefas" && <Tasks key={`${extra.tarefas ?? ""}${extra.task ?? ""}`} admin={admin}
        initialTab={extra.tarefas ?? (extra.task ? "todas" : "todas")} focus={extra.task} />}
      {tab === "processos" && <Processes />}
      {tab === "antes-agora" && <BeforeAfter admin={admin} />}
      {tab === "evolucao" && <Evolution />}
      {tab === "historico" && <History />}
      {tab === "relatorios" && <Reports admin={admin} />}
    </div>
  );
}

function Header({ d, go }: { d: Json; go: Go }) {
  const m = d.metrics;
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const chips: [string, number | string, string, Record<string, string>][] = [
    ["ok", m.tasks_done, "Concluídas", { tarefas: "concluidas" }],
    ["info", m.tasks_in_progress, "Em execução", { tarefas: "em_execucao" }],
    ["neutral", m.tasks_next, "Próximas", { tarefas: "proximas" }],
    ["warn", m.tasks_waiting, "Aguardando", { tarefas: "bloqueadas" }],
  ];
  return (
    <header className="exec-head">
      <div className="exec-main">
        <div className="kicker">{d.project.office ?? "Projeto"}</div>
        <h1>{d.project.title ?? "Projeto"} — visão executiva</h1>
        <div className="exec-sub">
          <Pill code={d.status === "COMPLETED" ? "DONE" : "IN_PROGRESS"} label={d.status_label} />
          <span>Fase atual: <b>{d.current_phase ? d.current_phase.title : "—"}</b></span>
        </div>
        <div className="exec-meta" title={d.last_update ?? ""}>
          Atualizado {ago(d.last_update)} ({fmt(d.last_update)}) · atualização automática a cada 30 s
        </div>
        <div className="exec-chips">
          {chips.map(([tone, n, label, ex]) => (
            <button key={label} type="button" className={`chip ${tone}`} onClick={() => go("tarefas", ex)}>
              <b>{n}</b>{label}
            </button>
          ))}
          <button type="button" className="chip hours" onClick={() => go("historico")} title={d.hours?.method}>
            <Icon n="clock" size={14} /><b>{d.hours?.total_label ?? "—"}</b>trabalhadas{d.hours?.running ? " (em andamento)" : ""}
          </button>
        </div>
      </div>
      <div className="exec-progress">
        <Ring value={m.progress} />
        <div className="exec-progress-text">
          <div className="exec-progress-count"><b>{m.tasks_done}</b> de {m.tasks_total} tarefas</div>
          <Bar value={m.progress} tone="ok" />
          <div className="exec-meta">{d.status_label} · {m.phases_completed} de {m.phases_total} fases concluídas</div>
        </div>
      </div>
    </header>
  );
}

function TaskRef({ t, clamp = true }: { t: Json; clamp?: boolean }) {
  return <span className={clamp ? "task-ref one-line" : "task-ref"}><span className="tid">{t.id}</span> {t.title}</span>;
}

// ------------------------------------------------------------------ visão geral
function Home({ d, go }: { d: Json; go: Go }) {
  const nx = d.next.task;
  const m = d.metrics;
  const delivered = d.milestones.filter((x: Json) => x.delivered);
  const nextMilestone = (d.summary.next_milestones ?? [])[0];
  return (
    <div className="ov">
      <div className="ov-row ov-top">
        <section className="panel next-card" aria-labelledby="sec-next">
          <SectionHead icon="play" title="Próximo passo"
            action={nx && <LinkButton onClick={() => go("tarefas", { task: nx.id })}>Ver tarefa</LinkButton>} />
          {nx ? (
            <div className="next-body">
              <div className="next-title"><span className="tid">{nx.id}</span> — {nx.title}</div>
              <div><Pill code={nx.status} label={nx.status_label} /></div>
              <Clamp lines={3} className="next-desc">{nx.goal}</Clamp>
              <div className="meta-row">
                <span><Icon n="flag" size={14} />Prioridade {String(nx.priority_label).toLowerCase()}</span>
                <span><Icon n="layers" size={14} />{nx.phase_title ?? "—"}</span>
                <span><Icon n="user" size={14} />{nx.executor}</span>
                {nx.depends_on.length > 0 && <span><Icon n="list" size={14} />{nx.depends_on.length} dependência(s)</span>}
              </div>
              {d.next.why?.length > 0 && <div className="faint">Por quê: {d.next.why.join(" · ")}</div>}
            </div>
          ) : <Empty>Nenhuma tarefa pronta para começar — veja “Aguardando”.</Empty>}
          {d.next.in_progress.length > 0 && (
            <div className="running">
              <span className="faint">Em execução agora</span>
              {d.next.in_progress.map((t: Json) => (
                <button key={t.id} type="button" className="running-item" onClick={() => go("tarefas", { task: t.id })}>
                  <Pill code="IN_PROGRESS" label="Em execução" /><TaskRef t={t} />
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="panel" aria-label="Aguardando">
          <SectionHead icon="hourglass" title="Aguardando" count={d.waiting.length}
            action={d.waiting.length > 5 && <LinkButton onClick={() => go("tarefas", { tarefas: "bloqueadas" })}>Ver todos ({d.waiting.length})</LinkButton>} />
          {d.waiting.length ? (
            <ul className="rows">
              {d.waiting.slice(0, 5).map((t: Json) => (
                <li key={t.id}>
                  <button type="button" className="row-btn" onClick={() => go("tarefas", { task: t.id })}>
                    <Icon n="hourglass" size={14} className="tone-warn" /><TaskRef t={t} />
                    <span title={t.status_label} className="badge-wrap"><Pill code="WAITING" label={t.status_label} dot={false} /></span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <Empty>{LABELS.nothing_waiting}</Empty>}
        </section>
      </div>

      <section className="panel" aria-label="Resumo do projeto">
        <SectionHead icon="info" title="Resumo do projeto" />
        <div className="summary-grid">
          <SummaryCard icon="target" title="Objetivo">{d.summary.objective}</SummaryCard>
          <SummaryCard icon="gear" title={LABELS.modernizing}>{d.summary.modernizing}</SummaryCard>
          <SummaryCard icon="chart" title="Fase atual">
            {d.summary.current_phase ?? "—"} {d.current_phase && <Pill code={d.current_phase.status} label={d.current_phase.status_label} />}
          </SummaryCard>
          <SummaryCard icon="flag" title="Próximo marco">
            {nextMilestone ?? "—"}
            {(d.summary.next_milestones ?? []).length > 1 && <span className="faint"> · depois: {d.summary.next_milestones.slice(1).join(" · ")}</span>}
          </SummaryCard>
        </div>
      </section>

      <div className="ov-row ov-mid">
        <section className="panel" aria-label="Fases">
          <SectionHead icon="flag" title="Fases" action={<LinkButton onClick={() => go("planejamento")}>Ver planejamento</LinkButton>} />
          <PhaseList phases={d.phases} compact />
        </section>
        <section className="panel" aria-label="O que já foi entregue">
          <SectionHead icon="check-circle" title="O que já foi entregue" count={delivered.length} />
          {delivered.length ? (
            <MoreList items={delivered.slice().reverse()} initial={6} label="Ver todos" className="deliv-grid"
              render={(x: Json) => (
                <article key={x.milestone_id} className="deliv">
                  <div className="deliv-head"><Pill code="DONE" label="Entregue" /><span className="faint">{fmtDay(x.delivered_at)}</span></div>
                  <h3>{x.title}</h3>
                  <div className="desc clamp clamp-2" title={x.description}>{x.description}</div>
                  <Disclosure summary="Tarefas e evidências" className="mini-disc">
                    <div className="faint">Tarefas: {x.tasks.join(", ")}</div>
                    {x.evidence.length > 0 && <div className="faint">Evidências: {x.evidence.join(", ")}</div>}
                  </Disclosure>
                </article>
              )} />
          ) : <Empty>Nenhum marco entregue ainda.</Empty>}
        </section>
      </div>

      <div className="ov-row ov-bottom">
        <section className="panel" aria-label="Qualidade">
          <SectionHead icon="shield" title="Qualidade" />
          <Quality items={d.quality} />
        </section>
        <section className="panel" aria-label="Métricas">
          <SectionHead icon="chart" title="Métricas" />
          <div className="metric-grid">
            <Metric icon="file" value={m.tasks_total} label="Tarefas totais" />
            <Metric icon="check-circle" value={m.tasks_done} label="Concluídas" tone="ok" />
            <Metric icon="layers" value={m.processes_count} label="Processos identificados" />
            <Metric icon="gear" value={m.processes_automated} label="Processos automatizados" tone="ok" />
            <Metric icon="swap" value={m.processes_in_migration} label="Processos em migração" />
            <Metric icon="beaker" value={m.tests_count ?? "—"} label="Testes automatizados" />
            <Metric icon="clock" value={m.hours_worked ?? "—"} label="Horas trabalhadas" />
            <Metric icon="flag" value={`${m.phases_completed} / ${m.phases_total}`} label="Fases concluídas" />
          </div>
        </section>
        <section className="panel" aria-label="Últimas atividades">
          <SectionHead icon="history" title="Últimas atividades" action={<LinkButton onClick={() => go("historico")}>Ver histórico</LinkButton>} />
          <Timeline items={d.timeline.slice(0, 6)} compact />
        </section>
      </div>

      <section className="panel" aria-label="Relatórios">
        <SectionHead icon="file" title="Relatórios" count={d.reports.length}
          action={<LinkButton onClick={() => go("relatorios")}>Ver todos</LinkButton>} />
        <ReportList items={d.reports.slice(0, 5)} compact />
      </section>
    </div>
  );
}

function SummaryCard({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <article className="sum-card">
      <span className="sum-icon"><Icon n={icon} size={18} /></span>
      <div className="sum-text">
        <h3>{title}</h3>
        <Clamp lines={3} className="desc">{children}</Clamp>
      </div>
    </article>
  );
}

function Metric({ icon, value, label, tone }: { icon: IconName; value: ReactNode; label: string; tone?: string }) {
  return (
    <div className={`metric ${tone ?? ""}`}>
      <span className="metric-icon"><Icon n={icon} size={18} /></span>
      <div><div className="metric-value">{value}</div><div className="metric-label">{label}</div></div>
    </div>
  );
}

function Quality({ items }: { items: Json[] }) {
  return (
    <ul className="quality">
      {items.map((q) => (
        <li key={q.id}>
          <span className="q-label">{q.label}</span>
          <Pill code={q.status} label={q.status_label} />
          <span className="faint q-date">{q.at ? fmt(q.at) : "—"}</span>
          {q.note && <span className="faint q-note">{q.note}</span>}
        </li>
      ))}
    </ul>
  );
}

const PHASE_ICON: Record<string, IconName> = { COMPLETED: "check-circle", IN_PROGRESS: "play", WAITING: "hourglass", NOT_STARTED: "clock" };

function PhaseList({ phases, compact }: { phases: Json[]; compact?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const base = useId();
  return (
    <ol className={`phases ${compact ? "compact" : ""}`}>
      {phases.map((p) => {
        const isOpen = open === p.phase_id;
        const did = `${base}-${p.phase_id}`;
        return (
          <li key={p.phase_id} className={`phase s-${p.status}`}>
            <button type="button" className="phase-row" onClick={() => setOpen(isOpen ? null : p.phase_id)} aria-expanded={isOpen} aria-controls={did}>
              <span className="phase-icon"><Icon n={PHASE_ICON[p.status] ?? "clock"} size={16} /></span>
              <span className="phase-title one-line">{p.title}</span>
              {!compact && <Pill code={p.status} label={p.status_label} />}
              <span className="phase-count">{p.tasks_done}/{p.tasks_total}</span>
              <span className="phase-bar"><Bar value={p.progress} tone={p.status === "COMPLETED" ? "ok" : p.status === "WAITING" ? "warn" : "info"} /></span>
              <span className="phase-pct">{p.progress}%</span>
              {!compact && <span className="phase-hours" title="horas trabalhadas na fase">{p.worked?.seconds ? p.worked.label : "—"}</span>}
            </button>
            {isOpen && <div id={did}><PhaseDetail id={p.phase_id} status={p} /></div>}
          </li>
        );
      })}
    </ol>
  );
}

function PhaseDetail({ id, status }: { id: string; status: Json }) {
  const q = useApi(`project/phases/${encodeURIComponent(id)}`);
  return (
    <div className="phase-detail">
      <Load q={q}>
        {(p: Json) => (
          <>
            <div className="phase-detail-head"><Pill code={status.status} label={status.status_label} />
              <span className="faint">{fmtDay(p.started_at)} → {fmtDay(p.completed_at)} · {p.worked?.seconds ? p.worked.label : "horas não registradas"}</span></div>
            {p.description && <p className="desc">{p.description}</p>}
            <p className="desc"><b>Objetivo:</b> {p.objective}</p>
            <MoreList items={p.task_items} initial={8} className="rows compact-rows" render={(t: Json) => (
              <div key={t.id} className="row-line"><Pill code={t.status} label={t.status_label} /><TaskRef t={t} /><span className="faint">{t.executor}</span></div>
            )} />
            {p.reports.length > 0 && <ReportList items={p.reports} compact />}
          </>
        )}
      </Load>
    </div>
  );
}

// ------------------------------------------------------------------ fases e planejamento
function Planning({ go }: { go: Go }) {
  const q = useApi("project/phases", POLL);
  const t = useApi("project/tasks", POLL);
  return (
    <>
      <section className="panel">
        <SectionHead icon="flag" title="Fases do projeto" />
        <p className="faint lead">Cada fase agrupa tarefas do planejamento; situação e progresso vêm do histórico real de execução. Clique em uma fase para ver as tarefas.</p>
        <Load q={q}>{(p: Json) => <PhaseList phases={p} />}</Load>
      </section>
      <section className="panel">
        <SectionHead icon="list" title="Planejamento por prioridade" />
        <Load q={t}>
          {(tasks: Json[]) => (
            <div className="prio-grid">
              {["P0", "P1", "P2", "P3"].map((pr) => {
                const rows = tasks.filter((x) => x.priority === pr);
                const done = rows.filter((x) => x.status === "DONE").length;
                return (
                  <div key={pr} className={`prio-col prio-${pr}`}>
                    <div className="prio-head">
                      <h3>{rows[0]?.priority_label ?? PRIO[pr]}</h3>
                      <span className="faint">{done}/{rows.length} concluídas</span>
                    </div>
                    {rows.length ? (
                      <MoreList items={rows} initial={6} className="prio-list" render={(x: Json) => (
                        <button key={x.id} type="button" className="prio-item" title={`${x.id} — ${x.title}`} onClick={() => go("tarefas", { task: x.id })}>
                          <Pill code={x.status} label={x.status_label} dot={false} />
                          <TaskRef t={x} />
                        </button>
                      )} />
                    ) : <div className="faint">Nenhuma tarefa.</div>}
                  </div>
                );
              })}
            </div>
          )}
        </Load>
      </section>
    </>
  );
}

// ------------------------------------------------------------------ tarefas
function Tasks({ admin, initialTab, focus }: { admin: boolean; initialTab: string; focus?: string }) {
  const [tab, setTab] = useState(initialTab);
  const [phase, setPhase] = useState("");
  const [prio, setPrio] = useState("");
  const all = useApi("project/tasks", POLL);
  const phases = useApi("project/phases");
  return (
    <section className="panel">
      <SectionHead icon="check-square" title="Tarefas" />
      <Load q={all}>
        {(tasks: Json[]) => {
          const count = (k: string) => (k === "todas" ? tasks.length : tasks.filter((x) => x.tab === k).length);
          const rows = tasks.filter((x) => (tab === "todas" || x.tab === tab) && (!phase || x.phase_id === phase) && (!prio || x.priority === prio));
          return (
            <>
              <div className="toolbar">
                <div className="subtabs" role="tablist" aria-label="Situação das tarefas">
                  {TASK_TABS.map(([k, l]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "tab active" : "tab"} onClick={() => setTab(k)}>
                      {l} <span className="count">{count(k)}</span>
                    </button>
                  ))}
                </div>
                <div className="filters-inline">
                  <label>Fase
                    <select value={phase} onChange={(e) => setPhase(e.target.value)}>
                      <option value="">todas</option>
                      {(phases.data ?? []).map((p: Json) => <option key={p.phase_id} value={p.phase_id}>{p.title}</option>)}
                    </select>
                  </label>
                  <label>Prioridade
                    <select value={prio} onChange={(e) => setPrio(e.target.value)}>
                      <option value="">todas</option>
                      {Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </label>
                </div>
              </div>
              <div className="faint list-count">{rows.length} tarefa(s)</div>
              {rows.length ? <div className="task-list">{rows.map((x) => <TaskRow key={x.id} t={x} admin={admin} focus={focus === x.id} />)}</div>
                : <Empty>Nenhuma tarefa neste filtro.</Empty>}
            </>
          );
        }}
      </Load>
    </section>
  );
}

function TaskRow({ t, admin, focus }: { t: Json; admin: boolean; focus?: boolean }) {
  const [open, setOpen] = useState(!!focus);
  const ref = useRef<HTMLElement>(null);
  const id = useId();
  useEffect(() => {
    if (focus) ref.current?.scrollIntoView({ block: "center" });
  }, [focus]);
  const when = t.completed_at ? `concluída ${fmtDay(t.completed_at)}` : t.started_at ? `início ${fmtDay(t.started_at)}` : null;
  return (
    <article ref={ref} className={`task s-${t.status} ${focus ? "focused" : ""}`}>
      <button type="button" className="task-row" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={id}>
        <span className="task-id">{t.id}</span>
        <span className="task-main">
          <span className="task-title one-line">{t.title}</span>
          <span className="task-meta">
            <span className="one-line">{t.phase_title ?? "—"}</span>
            <span><Icon n="user" size={12} />{t.executor}</span>
            {when && <span><Icon n="calendar" size={12} />{when}</span>}
            {t.worked && <span><Icon n="clock" size={12} />{t.worked.label}{t.worked.running ? " (em andamento)" : ""}</span>}
          </span>
        </span>
        <span className="task-badges">
          <Pill code={t.status} label={t.status_label} />
          <span className={`prio-tag prio-${t.priority}`}>{t.priority_label}</span>
        </span>
        <Icon n="chevron" size={16} className="chev" />
      </button>
      {open && (
        <div id={id} className="task-body">
          <KV rows={[
            ["objetivo", t.goal],
            ["resultado", t.result ?? (t.status === "DONE" ? "Não registrado" : "Ainda não concluída")],
            ["verificações (gates)", t.gates.length ? t.gates.map((g: Json) => <div key={g.label}>{g.label}: <Pill code={g.status} label={GATE_PT[g.status] ?? g.status} /></div>) : "Não aplicável"],
            ["evidências", t.evidence.length ? t.evidence.map((e: Json) => <div key={e.label}>{e.label}{e.count > 1 ? ` (${e.count})` : ""}</div>) : "Não registrado"],
            ["depende de", t.depends_on.length ? t.depends_on.map((x: Json) => <div key={x.id}>{x.id} — {x.title}</div>) : "—"],
            ["datas", `${t.started_at ? `início ${fmt(t.started_at)}` : "não iniciada"}${t.completed_at ? ` · conclusão ${fmt(t.completed_at)}` : ""}`],
          ]} />
          {admin && <AdminTask id={t.id} />}
        </div>
      )}
    </article>
  );
}

/** Visão administrativa (somente ADMIN): ids técnicos, evidências por caminho, gates e eventos. */
function AdminTask({ id }: { id: string }) {
  const q = useApi(`project/tasks/${id}?view=admin`);
  return (
    <details className="admin-only">
      <summary>Detalhes técnicos (somente administração)</summary>
      <Load q={q}>
        {(t: Json) => (
          <KV rows={[["status canônico", t.status], ["responsável", t.assignee ?? "—"], ["concluída por", t.completed_by ?? "—"],
            ["evidências", t.evidence.map((e: Json) => <div key={e.ref}><code>{e.ref}</code></div>)],
            ["gates", t.gates.map((g: Json) => <div key={g.gate}><code>{g.gate}</code> {g.status} {g.at ?? ""}</div>)],
            ["bloqueio externo", (t.blocked_by ?? []).join("; ") || "—"],
            ["eventos", t.history.map((h: Json) => <div key={h.seq}>#{h.seq} {h.type} · {h.actor} · {h.ts}</div>)]]} />
        )}
      </Load>
    </details>
  );
}

// ------------------------------------------------------------------ processos e capacidades
function Processes() {
  const proc = useApi("project/processes", POLL);
  const caps = useApi("project/capabilities", POLL);
  return (
    <>
      <section className="panel">
        <SectionHead icon="layers" title={LABELS.processes_title} />
        <Load q={proc}>
          {(rows: Json[]) => rows.length ? (
            <div className="table-wrap">
              <table className="resp data-table">
                <thead><tr><th>Processo</th><th>Objetivo</th><th>Situação</th><th>Automação</th><th>Prioridade</th><th>Próximo marco</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.process}>
                      <td data-h="Processo" className="strong">{r.process}</td>
                      <td data-h="Objetivo" className="desc">{r.objective}</td>
                      <td data-h="Situação"><Ladder level={r.level} /><div className="faint">{r.status}</div></td>
                      <td data-h="Automação"><Pill code={r.automation} label={r.automation} /></td>
                      <td data-h="Prioridade">{r.priority_label}</td>
                      <td data-h="Próximo marco" className="desc">{r.next_milestone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty>Catálogo de processos não disponível.</Empty>}
        </Load>
      </section>
      <section className="panel">
        <SectionHead icon="gear" title={LABELS.capabilities_title} />
        <Load q={caps}>
          {(c: Json) => (
            <>
              <p className="faint lead">
                {LABELS.capabilities_intro}
                {c.plugin_skills_count != null && <> <b>{c.plugin_skills_count} itens em {c.plugins_count} grupos.</b></>}
              </p>
              <div className="cap-grid">
                {c.domains.map((d: Json) => <Capability key={d.domain_id} d={d} />)}
              </div>
            </>
          )}
        </Load>
      </section>
    </>
  );
}

function Capability({ d }: { d: Json }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <article className="cap">
      <div className="cap-top">
        <Pill code={d.automation} label={`${LABELS.automation_pill}: ${d.automation}`} />
        {d.priority_label && d.priority_label !== "—" && <span className={`prio-tag prio-${d.priority ?? ""}`}>{d.priority_label}</span>}
      </div>
      <h3>{d.label}</h3>
      <div className={open ? "desc" : "desc clamp clamp-2"}>{d.what_it_does}</div>
      <div className="cap-status"><Ladder level={d.level} /><span className="strong small">{d.status}</span></div>
      <button type="button" className="more-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {open ? "Ocultar detalhes" : "Ver detalhes"}
      </button>
      {open && (
        <div id={id} className="cap-detail">
          <KV rows={[["entrada", d.input], ["saída", d.output], ["próximo marco", d.next_milestone],
            [LABELS.skills_label, d.skills_found.length ? d.skills_found.map((f: Json) => (
              <div key={f.label}><b>{f.label}</b>{f.skills ? `: ${f.skills.join(", ")}` : ""}</div>)) : "—"],
            [LABELS.components_label, d.platform_components.length ? d.platform_components.map((x: Json) => <div key={x.name}>{x.name} — {x.status}</div>) : "—"]]} />
        </div>
      )}
    </article>
  );
}

// ------------------------------------------------------------------ evolução e achados
const EVO: [string, string, IconName][] = [["existed", "O que existia", "history"], ["identified", "O que foi identificado", "eye"],
  ["preserved", "O que foi preservado", "shield"], ["rebuilt", "O que foi reconstruído", "gear"],
  ["improved", "O que foi melhorado", "trend"], ["missing", "O que falta", "hourglass"]];

function Evolution() {
  const q = useApi("project/comparative", POLL);
  const f = useApi("project/findings", POLL);
  return (
    <>
      <Load q={q}>
        {(d: Json) => (
          <>
            <section className="panel">
              <SectionHead icon="swap" title={LABELS.comparative_title} />
              <div className="table-wrap">
                <table className="resp data-table compare-table">
                  <thead><tr><th>Categoria</th><th>Ambiente atual</th><th aria-hidden /><th>Nova arquitetura</th></tr></thead>
                  <tbody>
                    {d.comparative.map((c: Json) => (
                      <tr key={c.category}>
                        <td data-h="Categoria" className="strong">{c.category}</td>
                        <td data-h="Ambiente atual" className="desc">{c.current}</td>
                        <td className="arrow-cell" aria-hidden><Icon n="arrow" size={14} /></td>
                        <td data-h="Nova arquitetura" className="new-cell">{c.new}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="panel">
              <SectionHead icon="trend" title="Evolução do projeto" />
              <div className="evo-grid">
                {EVO.map(([k, l, ic]) => {
                  const items: string[] = d.evolution[k]?.items ?? [];
                  return (
                    <article key={k} className={`evo-card evo-${k}`}>
                      <div className="evo-head"><Icon n={ic} size={16} /><h3>{l}</h3><span className="sec-count">{items.length}</span></div>
                      {items.length ? (
                        <MoreList items={items} initial={2} label="Ver detalhes" className="evo-list"
                          render={(i: string) => <div key={i} className="evo-item">{i}</div>} />
                      ) : <p className="faint">Não registrado.</p>}
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </Load>
      <section className="panel">
        <SectionHead icon="alert" title="Achados do levantamento" />
        <Load q={f}>
          {(rows: Json[]) => rows.length ? (
            <div className="find-grid">
              {rows.map((x) => (
                <article key={x.finding_id} className={`finding st-${x.status}`}>
                  <div className="cap-top"><span className="badge neutral">{x.category}</span><Pill code={x.status} label={x.situation} /></div>
                  <h3>{x.title}</h3>
                  <Clamp lines={2} className="desc">{x.description}</Clamp>
                  <Disclosure summary="Impacto, ação e tarefas" className="mini-disc">
                    <KV rows={[["impacto", x.impact], ["ação relacionada", x.action], ["tarefas", x.tasks.join(", ") || "—"]]} />
                  </Disclosure>
                </article>
              ))}
            </div>
          ) : <Empty>Nenhum achado registrado.</Empty>}
        </Load>
      </section>
    </>
  );
}

// ------------------------------------------------------------------ histórico
function eventTone(x: Json): string {
  const a = String(x.action ?? "");
  if (/conclu|entregue|publicado/i.test(a)) return "DONE";
  if (/aguard|bloque/i.test(a)) return "WAITING";
  if (/pendênc|falh/i.test(String(x.result ?? ""))) return "WARNING";
  if (/iniciad/i.test(a)) return "IN_PROGRESS";
  return "RECORDED";
}

function Timeline({ items, compact }: { items: Json[]; compact?: boolean }) {
  if (!items.length) return <Empty>Nenhuma atividade registrada.</Empty>;
  if (compact) {
    return (
      <ol className="tl compact">
        {items.map((x, i) => (
          <li key={`${x.ts}-${i}`} className={`tone-${TONES[eventTone(x)] ?? "neutral"}`}>
            <span className="tl-time">{fmt(x.ts)}</span>
            <span className="tl-body">
              <span className="tl-title one-line">{x.action}{x.task_id ? ` — ${x.task_id}` : ""}</span>
              <span className="faint one-line">{x.executor}{x.phase_title ? ` · ${x.phase_title}` : ""}</span>
            </span>
          </li>
        ))}
      </ol>
    );
  }
  const groups: [string, Json[]][] = [];
  for (const x of items) {
    const day = fmtDay(x.ts);
    const last = groups[groups.length - 1];
    if (last && last[0] === day) last[1].push(x); else groups.push([day, [x]]);
  }
  return (
    <div className="tl-groups">
      {groups.map(([day, rows]) => (
        <section key={day} className="tl-day" aria-label={day}>
          <h3 className="tl-day-head"><Icon n="calendar" size={14} />{day}</h3>
          <ol className="tl">
            {rows.map((x, i) => (
              <li key={`${x.ts}-${i}`} className={`tone-${TONES[eventTone(x)] ?? "neutral"}`}>
                <span className="tl-time">{fmtTime(x.ts)}</span>
                <span className="tl-body">
                  <span className="tl-title">{x.action}</span>
                  {x.task_id && <span className="tl-task one-line"><span className="tid">{x.task_id}</span> {x.task_title}</span>}
                  <span className="faint">{x.executor}{x.phase_title ? ` · ${x.phase_title}` : ""}</span>
                </span>
                <span className="tl-state"><Pill code={eventTone(x)} label={x.result} dot={false} /></span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function History() {
  const [offset, setOffset] = useState(0);
  const q = useApi(`project/timeline?limit=25&offset=${offset}`, POLL);
  return (
    <section className="panel">
      <SectionHead icon="history" title="Histórico de atualizações" />
      <Load q={q}>
        {(p: Json) => (
          <>
            {p.hours && <HoursPanel h={p.hours} />}
            <Timeline items={p.items} />
            <div className="pager">
              <button type="button" className="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 25))}>← Mais recentes</button>
              <span className="faint">{p.total ? `${offset + 1}–${Math.min(offset + 25, p.total)} de ${p.total}` : "0"}</span>
              <button type="button" className="secondary" disabled={offset + 25 >= p.total} onClick={() => setOffset(offset + 25)}>Mais antigas →</button>
            </div>
          </>
        )}
      </Load>
    </section>
  );
}

function HoursPanel({ h }: { h: Json }) {
  return (
    <div className="hours-total">
      <div className="hours-main">
        <span className="hours-icon"><Icon n="clock" size={20} /></span>
        <div><span className="big-hours">{h.total_label}</span> trabalhadas{h.running ? " (sessão em andamento, até agora)" : ""}</div>
      </div>
      <div className="hours-split">
        <span><b>{h.registered_label}</b> registradas (tarefas e sessões)</span>
        <span><b>{h.reconstructed_label}</b> reconstruídas da atividade gravada</span>
        <span><b>{h.tasks_label}</b> em execução de tarefas</span>
      </div>
      <Disclosure summary={`Sessões de trabalho (${(h.sessions ?? []).length}) e método de cálculo`} className="mini-disc">
        <ul className="rows small">
          {(h.sessions ?? []).slice().reverse().map((s: Json) => (
            <li key={s.start} className="row-line">{fmt(s.start)} → {fmtTime(s.end)} · <b>{s.label}</b> · <span className="faint">{s.source}</span></li>
          ))}
        </ul>
        <p className="faint">{h.method}</p>
      </Disclosure>
    </div>
  );
}

// ------------------------------------------------------------------ relatórios
function ReportList({ items, compact }: { items: Json[]; compact?: boolean }) {
  if (!items.length) return <Empty>Nenhum relatório gerado ainda — um relatório é publicado quando uma fase é concluída.</Empty>;
  return (
    <ul className={`reports ${compact ? "compact" : ""}`}>
      {items.map((r) => (
        <li key={r.report_id}>
          <span className="rep-icon"><Icon n="file" size={16} /></span>
          <div className="rep-main">
            <div className="rep-title one-line">{r.title}</div>
            <div className="faint">
              versão {r.version}
              {r.period?.started_at ? ` · ${fmtDay(r.period.started_at)} a ${fmtDay(r.period.completed_at)}` : ""}
              {` · gerado em ${fmtDay(r.generated_at)}`}
              {!compact && r.generated_from_historical_evidence ? " · reconstruído das evidências" : ""}
              {r.audience === "admin" ? " · visão administrativa" : ""}
            </div>
          </div>
          {r.pdf_url ? (
            <div className="rep-actions">
              <a className="btn-ghost" href={`${r.pdf_url}?inline=1`} target="_blank" rel="noopener noreferrer"><Icon n="eye" size={14} />Ver relatório</a>
              <a className="btn-link" href={r.pdf_url} download><Icon n="download" size={14} />Baixar PDF</a>
            </div>
          ) : <span className="faint">PDF indisponível</span>}
        </li>
      ))}
    </ul>
  );
}

function Reports({ admin }: { admin: boolean }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [n, setN] = useState(0);
  const q = useApi(`project/reports?r=${n}`, POLL);
  const consolidated = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await command("GENERATE_PROJECT_REPORT", { scope: "consolidated" });
      const x = r.reports?.[0];
      setMsg(x ? (x.status === "REUSED" ? `Sem mudanças desde a versão ${x.version} — relatório reaproveitado.` : `Versão ${x.version} gerada.`) : "Concluído.");
      setN((v) => v + 1);
    } catch (e) {
      setMsg(`Falha: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel">
      <SectionHead icon="file" title="Relatórios" />
      <p className="faint lead">Um relatório PDF por fase concluída, gerado a partir do planejamento, do histórico e das evidências. Versões novas só quando os dados da fase mudam.</p>
      {admin && (
        <div className="callout admin-only">
          {CAN_COMMAND ? (
            <div className="actions">
              <button type="button" onClick={consolidated} disabled={busy}>{busy ? "Gerando…" : "Gerar relatório consolidado"}</button>
              <span className="small">Somente administração. Reúne todas as fases sem duplicar tarefas.</span>
            </div>
          ) : (
            <div className="small">Somente administração. Para gerar o consolidado (reúne todas as fases sem duplicar tarefas): <code>python status/status.py report generate --scope consolidated</code></div>
          )}
          {msg && <div className="small">{msg}</div>}
        </div>
      )}
      <Load q={q}>{(rows: Json[]) => <ReportList items={rows} />}</Load>
    </section>
  );
}

// ------------------------------------------------------------------ antes × agora
const CMP_TONE: Record<string, string> = { DONE: "ok", IN_PROGRESS: "info", WAITING: "warn", PLANNED: "neutral", WARNING: "warn" };
const FLOW_LABEL: Record<string, string> = { DONE: "Concluído", IN_PROGRESS: "Em andamento", WAIT: "Aguardando", OPEN: "Em aberto", NONE: "Sem tarefa" };
const FLOW_TONE: Record<string, string> = { DONE: "DONE", IN_PROGRESS: "IN_PROGRESS", WAIT: "WAITING", OPEN: "PLANNED", NONE: "WARNING" };

function CmpPill({ tone, label }: { tone?: string; label: string }) {
  return <span className={`badge ${CMP_TONE[tone ?? ""] ?? "neutral"}`}><span className="dot" aria-hidden />{label}</span>;
}

function BeforeAfter({ admin }: { admin: boolean }) {
  const q = useApi(admin ? "project/comparison?view=admin" : "project/comparison", POLL);
  return (
    <section className="panel">
      <SectionHead icon="swap" title="Antes × agora" />
      <p className="faint lead">{LABELS.before_after_intro}</p>
      <Load q={q}>
        {(d: Json) => (
          <>
            <div className="cmp-counts">
              <Metric icon="alert" value={d.counts.errors} label="erros encontrados" />
              <Metric icon="check-circle" value={d.counts.errors_fixed} label="corrigidos" tone="ok" />
              <Metric icon="hourglass" value={d.counts.errors_open} label="em aberto" />
              <Metric icon="flag" value={d.counts.errors_no_task} label="sem tarefa vinculada" />
              <Metric icon="scale" value={d.counts.decisions_pending} label="decisões pendentes" />
            </div>

            <h2 className="cmp-h">Fluxos: como era e como ficou</h2>
            <div className="flow-stack">
              {d.flows.map((f: Json) => (
                <article key={f.id} className="flow-cmp">
                  <div className="flow-cmp-head">
                    <h3>{f.name}</h3>
                    <CmpPill tone={FLOW_TONE[f.status]} label={FLOW_LABEL[f.status] ?? f.status} />
                  </div>
                  <div className="flow-cmp-grid">
                    <div className="flow-side flow-before">
                      <div className="flow-side-title">Antes</div>
                      <ul>{f.before.map((x: string) => <li key={x}>{x}</li>)}</ul>
                    </div>
                    <div className="flow-arrow" aria-hidden><Icon n="arrow" size={22} /></div>
                    <div className="flow-side flow-now">
                      <div className="flow-side-title">Agora</div>
                      <ul>{f.now.map((x: string) => <li key={x}>{x}</li>)}</ul>
                    </div>
                  </div>
                  {f.tasks.length > 0 && (
                    <div className="cmp-tasks">{f.tasks.map((t: Json) => <span key={t.id} className="tid-chip">{t.id} · {t.status_label}</span>)}</div>
                  )}
                  {admin && f.source && <div className="faint admin-src">Fonte: {f.source}</div>}
                </article>
              ))}
            </div>

            <h2 className="cmp-h">Principais mudanças: o que, por que e impacto</h2>
            <div className="cap-grid">
              {d.changes.map((c: Json) => (
                <article key={c.id} className="cap cmp-card">
                  <div className="cap-top"><CmpPill tone={c.tone} label={c.status_label} /></div>
                  <h3>{c.title}</h3>
                  {c.decision && <div className="cmp-row"><span className="cmp-k">Decisão</span><span className="desc">{c.decision}</span></div>}
                  {c.why && <div className="cmp-row"><span className="cmp-k">Por que</span><span className="desc">{c.why}</span></div>}
                  {c.impact && <div className="cmp-row"><span className="cmp-k">Impacto</span><span className="desc">{c.impact}</span></div>}
                  {c.tasks.length > 0 && <div className="cmp-tasks">{c.tasks.map((t: Json) => <span key={t.id} className="tid-chip">{t.id}</span>)}</div>}
                  {admin && c.source && <div className="faint admin-src">Fonte: {c.source}</div>}
                </article>
              ))}
            </div>

            <h2 className="cmp-h">Decisões tomadas e pendentes</h2>
            <div className="cap-grid">
              {d.decisions.map((c: Json) => (
                <article key={c.id} className="cap cmp-card">
                  <div className="cap-top"><CmpPill tone={c.tone} label={c.status_label} /></div>
                  <h3>{c.title}</h3>
                  {c.why && <div className="cmp-row"><span className="cmp-k">Por que</span><span className="desc">{c.why}</span></div>}
                  {c.impact && <div className="cmp-row"><span className="cmp-k">Impacto</span><span className="desc">{c.impact}</span></div>}
                  {c.tasks.length > 0 && <div className="cmp-tasks">{c.tasks.map((t: Json) => <span key={t.id} className="tid-chip">{t.id}</span>)}</div>}
                  {admin && c.source && <div className="faint admin-src">Fonte: {c.source}</div>}
                </article>
              ))}
            </div>

            <h2 className="cmp-h">Erros encontrados e situação</h2>
            <p className="faint lead">
              "Sem tarefa vinculada" indica um problema reconhecido que ainda não está registrado no backlog para ser tratado.
            </p>
            <ul className="err-list">
              {d.errors.map((e: Json) => (
                <li key={e.id} className={`err st-${e.status}`}>
                  <div className="err-head">
                    <h3>{e.title}</h3>
                    <CmpPill tone={e.tone} label={e.status_label} />
                  </div>
                  {e.what && <div className="desc">{e.what}</div>}
                  {e.tasks.length > 0 && (
                    <div className="cmp-tasks">{e.tasks.map((t: Json) => <span key={t.id} className="tid-chip">{t.id} · {t.status_label}</span>)}</div>
                  )}
                  {admin && (e.where || e.source) && (
                    <Disclosure summary="Referência técnica (administração)" className="mini-disc admin-only">
                      {e.where && <div className="faint">Onde: <code>{e.where}</code></div>}
                      {e.source && <div className="faint">Fonte: {e.source}</div>}
                    </Disclosure>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Load>
    </section>
  );
}
