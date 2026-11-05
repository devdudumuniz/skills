import { useProject } from "../context/ProjectContext";
import {
  Icon,
  SectionHead,
  Metric,
  Disclosure,
} from "../components/UIPrimitives";

const CMP_TONE: Record<string, string> = {
  DONE: "ok",
  IN_PROGRESS: "info",
  WAITING: "warn",
  PLANNED: "neutral",
  WARNING: "warn",
};

const FLOW_LABEL: Record<string, string> = {
  DONE: "Concluído",
  IN_PROGRESS: "Em andamento",
  WAIT: "Aguardando",
  OPEN: "Em aberto",
  NONE: "Sem tarefa",
};

const FLOW_TONE: Record<string, string> = {
  DONE: "DONE",
  IN_PROGRESS: "IN_PROGRESS",
  WAIT: "WAITING",
  OPEN: "PLANNED",
  NONE: "WARNING",
};

function CmpPill({ tone, label }: { tone?: string; label: string }) {
  return (
    <span className={`badge ${CMP_TONE[tone ?? ""] ?? "neutral"}`}>
      <span className="dot" aria-hidden />
      {label}
    </span>
  );
}

export function BeforeAfterView() {
  const { role, overview, flows, changes, decisions, errors } = useProject();

  const totalErrors = errors.length;
  const fixedErrors = errors.filter((e) => e.status === "DONE").length;
  const openErrors = errors.filter((e) => e.status === "WAIT" || e.status === "OPEN").length;
  const noTaskErrors = errors.filter((e) => e.tasks.length === 0).length;
  const pendingDecisions = decisions.filter((d) => d.tone === "WAITING").length;

  return (
    <section className="panel">
      <SectionHead icon="swap" title="Antes × agora" />
      <p className="faint lead">{overview.labels.before_after_intro}</p>

      {/* Métricas do comparativo */}
      <div className="cmp-counts">
        <Metric icon="alert" value={totalErrors} label="erros encontrados" />
        <Metric icon="check-circle" value={fixedErrors} label="corrigidos" tone="ok" />
        <Metric icon="hourglass" value={openErrors} label="em aberto" />
        <Metric icon="flag" value={noTaskErrors} label="sem tarefa vinculada" />
        <Metric icon="scale" value={pendingDecisions} label="decisões pendentes" />
      </div>

      {/* Fluxos: como era e como ficou */}
      <h2 className="cmp-h">Fluxos: como era e como ficou</h2>
      <div className="flow-stack">
        {flows.map((f) => (
          <article key={f.id} className="flow-cmp">
            <div className="flow-cmp-head">
              <h3>{f.name}</h3>
              <CmpPill tone={FLOW_TONE[f.status]} label={FLOW_LABEL[f.status] ?? f.status} />
            </div>
            <div className="flow-cmp-grid">
              <div className="flow-side flow-before">
                <div className="flow-side-title">Antes</div>
                <ul>
                  {f.before.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="flow-arrow" aria-hidden>
                <Icon n="arrow" size={22} />
              </div>
              <div className="flow-side flow-now">
                <div className="flow-side-title">Agora</div>
                <ul>
                  {f.now.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
            {f.tasks.length > 0 && (
              <div className="cmp-tasks">
                {f.tasks.map((t) => (
                  <span key={t.id} className="tid-chip">
                    {t.id} · {t.status_label}
                  </span>
                ))}
              </div>
            )}
            {role === "ADMIN" && f.source && (
              <div className="faint admin-src" style={{ marginTop: 6, fontSize: 11.5 }}>
                Fonte administrativa: <code>{f.source}</code>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Principais mudanças */}
      <h2 className="cmp-h">Principais mudanças: o que, por que e impacto</h2>
      <div className="cap-grid">
        {changes.map((c) => (
          <article key={c.id} className="cap cmp-card">
            <div className="cap-top">
              <CmpPill tone={c.tone} label={c.status_label} />
            </div>
            <h3>{c.title}</h3>
            {c.decision && (
              <div className="cmp-row">
                <span className="cmp-k">Decisão</span>
                <span className="desc">{c.decision}</span>
              </div>
            )}
            {c.why && (
              <div className="cmp-row">
                <span className="cmp-k">Por que</span>
                <span className="desc">{c.why}</span>
              </div>
            )}
            {c.impact && (
              <div className="cmp-row">
                <span className="cmp-k">Impacto</span>
                <span className="desc">{c.impact}</span>
              </div>
            )}
            {c.tasks.length > 0 && (
              <div className="cmp-tasks">
                {c.tasks.map((t) => (
                  <span key={t.id} className="tid-chip">
                    {t.id}
                  </span>
                ))}
              </div>
            )}
            {role === "ADMIN" && c.source && (
              <div className="faint admin-src" style={{ fontSize: 11.5 }}>
                Fonte: <code>{c.source}</code>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Decisões */}
      <h2 className="cmp-h">Decisões tomadas e pendentes</h2>
      <div className="cap-grid">
        {decisions.map((c) => (
          <article key={c.id} className="cap cmp-card">
            <div className="cap-top">
              <CmpPill tone={c.tone} label={c.status_label} />
            </div>
            <h3>{c.title}</h3>
            {c.why && (
              <div className="cmp-row">
                <span className="cmp-k">Por que</span>
                <span className="desc">{c.why}</span>
              </div>
            )}
            {c.impact && (
              <div className="cmp-row">
                <span className="cmp-k">Impacto</span>
                <span className="desc">{c.impact}</span>
              </div>
            )}
            {c.tasks.length > 0 && (
              <div className="cmp-tasks">
                {c.tasks.map((t) => (
                  <span key={t.id} className="tid-chip">
                    {t.id}
                  </span>
                ))}
              </div>
            )}
            {role === "ADMIN" && c.source && (
              <div className="faint admin-src" style={{ fontSize: 11.5 }}>
                Fonte: <code>{c.source}</code>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Erros Encontrados */}
      <h2 className="cmp-h">Erros encontrados e situação</h2>
      <p className="faint lead">
        "Sem tarefa vinculada" indica um problema identificado durante a auditoria que ainda requer criação de tarefa de tratamento.
      </p>
      <ul className="err-list">
        {errors.map((e) => (
          <li key={e.id} className={`err st-${e.status}`}>
            <div className="err-head">
              <h3>{e.title}</h3>
              <CmpPill tone={e.tone} label={e.status_label} />
            </div>
            {e.what && <div className="desc">{e.what}</div>}
            {e.tasks.length > 0 && (
              <div className="cmp-tasks">
                {e.tasks.map((t) => (
                  <span key={t.id} className="tid-chip">
                    {t.id} · {t.status_label}
                  </span>
                ))}
              </div>
            )}
            {role === "ADMIN" && (e.where || e.source) && (
              <Disclosure summary="Referência técnica (administração)" className="mini-disc admin-only">
                {e.where && (
                  <div className="faint">
                    Onde: <code>{e.where}</code>
                  </div>
                )}
                {e.source && (
                  <div className="faint">
                    Fonte: <code>{e.source}</code>
                  </div>
                )}
              </Disclosure>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
