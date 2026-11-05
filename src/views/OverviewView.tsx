import { useProject } from "../context/ProjectContext";
import {
  Icon,
  Pill,
  Bar,
  Ring,
  SectionHead,
  LinkButton,
  Clamp,
  MoreList,
  Disclosure,
  Metric,
  Empty,
  fmt,
  fmtDay,
  ago,
} from "../components/UIPrimitives";
import { QualityGate, ReportItem } from "../types";

interface OverviewViewProps {
  onNavigate: (tab: string, extra?: Record<string, string>) => void;
  onOpenReport: (r: ReportItem) => void;
}

export function OverviewView({ onNavigate, onOpenReport }: OverviewViewProps) {
  const { overview, tasks, phases, milestones, quality, timeline, reports, hours } = useProject();

  const doneCount = tasks.filter((t) => t.status === "DONE").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const waitingTasks = tasks.filter((t) => t.status === "WAITING" || t.status === "BLOCKED");
  const nextTasks = tasks.filter((t) => t.status === "NEXT" || t.status === "PLANNED");
  const completedPhases = phases.filter((p) => p.status === "COMPLETED").length;
  const totalPhases = phases.length;
  const progressPct = Math.round((doneCount / tasks.length) * 100);

  const nx = tasks.find((t) => t.status === "IN_PROGRESS") || tasks.find((t) => t.status === "NEXT") || null;
  const runningTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const deliveredMilestones = milestones.filter((m) => m.delivered);
  const nextMilestone = overview.summary.next_milestones[0];

  const chips: [string, number | string, string, Record<string, string>][] = [
    ["ok", doneCount, "Concluídas", { tarefas: "concluidas" }],
    ["info", inProgressCount, "Em execução", { tarefas: "em_execucao" }],
    ["neutral", nextTasks.length, "Próximas", { tarefas: "proximas" }],
    ["warn", waitingTasks.length, "Aguardando", { tarefas: "bloqueadas" }],
  ];

  return (
    <div className="ov">
      {/* Header Executivo */}
      <header className="exec-head">
        <div className="exec-main">
          <div className="kicker">{overview.project.office}</div>
          <h1>{overview.project.title} — visão executiva</h1>
          <div className="exec-sub">
            <Pill code={progressPct === 100 ? "DONE" : "IN_PROGRESS"} label={progressPct === 100 ? "Concluído" : "Em andamento"} />
            <span>Fase atual: <b>{overview.current_phase?.title ?? "—"}</b></span>
          </div>
          <div className="exec-meta">
            Atualizado {ago(overview.last_update)} ({fmt(overview.last_update)}) · atualização automática contínua
          </div>
          <div className="exec-chips">
            {chips.map(([tone, n, label, ex]) => (
              <button
                key={label}
                type="button"
                className={`chip ${tone}`}
                onClick={() => onNavigate("tarefas", ex)}
              >
                <b>{n}</b>
                {label}
              </button>
            ))}
            <button
              type="button"
              className="chip hours"
              onClick={() => onNavigate("historico")}
              title={hours.method}
            >
              <Icon n="clock" size={14} />
              <b>{hours.total_label}</b>
              trabalhadas{hours.running ? " (em andamento)" : ""}
            </button>
          </div>
        </div>
        <div className="exec-progress">
          <Ring value={progressPct} />
          <div className="exec-progress-text">
            <div className="exec-progress-count">
              <b>{doneCount}</b> de {tasks.length} tarefas
            </div>
            <Bar value={progressPct} tone="ok" />
            <div className="exec-meta">
              {completedPhases} de {totalPhases} fases concluídas
            </div>
          </div>
        </div>
      </header>

      {/* Próximo Passo & Aguardando */}
      <div className="ov-row ov-top">
        <section className="panel next-card" aria-label="Próximo passo">
          <SectionHead
            icon="play"
            title="Próximo passo"
            action={nx && <LinkButton onClick={() => onNavigate("tarefas", { task: nx.id })}>Ver tarefa</LinkButton>}
          />
          {nx ? (
            <div className="next-body">
              <div className="next-title">
                <span className="tid">{nx.id}</span> — {nx.title}
              </div>
              <div>
                <Pill code={nx.status} label={nx.status_label} />
              </div>
              <Clamp lines={3} className="next-desc">
                {nx.goal}
              </Clamp>
              <div className="meta-row">
                <span>
                  <Icon n="flag" size={14} />
                  Prioridade {nx.priority_label.toLowerCase()}
                </span>
                <span>
                  <Icon n="layers" size={14} />
                  {nx.phase_title ?? "—"}
                </span>
                <span>
                  <Icon n="user" size={14} />
                  {nx.executor}
                </span>
                {nx.depends_on.length > 0 && (
                  <span>
                    <Icon n="list" size={14} />
                    {nx.depends_on.length} dependência(s)
                  </span>
                )}
              </div>
              {overview.next.why?.length > 0 && (
                <div className="faint">Por quê: {overview.next.why.join(" · ")}</div>
              )}
            </div>
          ) : (
            <Empty>Nenhuma tarefa pronta para começar — veja “Aguardando”.</Empty>
          )}

          {runningTasks.length > 0 && (
            <div className="running">
              <span className="faint">Em execução agora</span>
              {runningTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="running-item"
                  onClick={() => onNavigate("tarefas", { task: t.id })}
                >
                  <Pill code="IN_PROGRESS" label="Em execução" />
                  <span className="task-ref one-line">
                    <span className="tid">{t.id}</span> {t.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="panel" aria-label="Aguardando">
          <SectionHead
            icon="hourglass"
            title="Aguardando"
            count={waitingTasks.length}
            action={
              waitingTasks.length > 5 && (
                <LinkButton onClick={() => onNavigate("tarefas", { tarefas: "bloqueadas" })}>
                  Ver todos ({waitingTasks.length})
                </LinkButton>
              )
            }
          />
          {waitingTasks.length ? (
            <ul className="rows">
              {waitingTasks.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="row-btn"
                    onClick={() => onNavigate("tarefas", { task: t.id })}
                  >
                    <Icon n="hourglass" size={14} className="tone-warn" />
                    <span className="task-ref one-line">
                      <span className="tid">{t.id}</span> {t.title}
                    </span>
                    <span title={t.status_label} className="badge-wrap">
                      <Pill code="WAITING" label={t.status_label} dot={false} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{overview.labels.nothing_waiting}</Empty>
          )}
        </section>
      </div>

      {/* Resumo do Projeto */}
      <section className="panel" aria-label="Resumo do projeto">
        <SectionHead icon="info" title="Resumo do projeto" />
        <div className="summary-grid">
          <article className="sum-card">
            <span className="sum-icon">
              <Icon n="target" size={18} />
            </span>
            <div className="sum-text">
              <h3>Objetivo</h3>
              <Clamp lines={3} className="desc">
                {overview.summary.objective}
              </Clamp>
            </div>
          </article>
          <article className="sum-card">
            <span className="sum-icon">
              <Icon n="gear" size={18} />
            </span>
            <div className="sum-text">
              <h3>{overview.labels.modernizing}</h3>
              <Clamp lines={3} className="desc">
                {overview.summary.modernizing}
              </Clamp>
            </div>
          </article>
          <article className="sum-card">
            <span className="sum-icon">
              <Icon n="chart" size={18} />
            </span>
            <div className="sum-text">
              <h3>Fase atual</h3>
              <div className="desc">
                {overview.current_phase?.title ?? "—"}{" "}
                {overview.current_phase && (
                  <Pill code={overview.current_phase.status} label={overview.current_phase.status_label} />
                )}
              </div>
            </div>
          </article>
          <article className="sum-card">
            <span className="sum-icon">
              <Icon n="flag" size={18} />
            </span>
            <div className="sum-text">
              <h3>Próximo marco</h3>
              <div className="desc">
                {nextMilestone ?? "—"}
                {overview.summary.next_milestones.length > 1 && (
                  <span className="faint">
                    {" "}· depois: {overview.summary.next_milestones.slice(1).join(" · ")}
                  </span>
                )}
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Fases & Entregas */}
      <div className="ov-row ov-mid">
        <section className="panel" aria-label="Fases">
          <SectionHead
            icon="flag"
            title="Fases"
            action={<LinkButton onClick={() => onNavigate("planejamento")}>Ver planejamento</LinkButton>}
          />
          <ol className="phases compact">
            {phases.map((p) => (
              <li key={p.phase_id} className={`phase s-${p.status}`}>
                <div className="phase-row" style={{ cursor: "default" }}>
                  <span className="phase-icon">
                    <Icon n={p.status === "COMPLETED" ? "check-circle" : p.status === "IN_PROGRESS" ? "play" : "clock"} size={16} />
                  </span>
                  <span className="phase-title one-line">{p.title}</span>
                  <span className="phase-count">
                    {p.tasks_done}/{p.tasks_total}
                  </span>
                  <span className="phase-bar">
                    <Bar value={p.progress} tone={p.status === "COMPLETED" ? "ok" : p.status === "WAITING" ? "warn" : "info"} />
                  </span>
                  <span className="phase-pct">{p.progress}%</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel" aria-label="O que já foi entregue">
          <SectionHead icon="check-circle" title="O que já foi entregue" count={deliveredMilestones.length} />
          {deliveredMilestones.length ? (
            <MoreList
              items={deliveredMilestones.slice().reverse()}
              initial={6}
              label="Ver todos"
              className="deliv-grid"
              render={(x) => (
                <article key={x.milestone_id} className="deliv">
                  <div className="deliv-head">
                    <Pill code="DONE" label="Entregue" />
                    <span className="faint">{fmtDay(x.delivered_at)}</span>
                  </div>
                  <h3>{x.title}</h3>
                  <div className="desc clamp clamp-2" title={x.description}>
                    {x.description}
                  </div>
                  <Disclosure summary="Tarefas e evidências" className="mini-disc">
                    <div className="faint">Tarefas: {x.tasks.join(", ")}</div>
                    {x.evidence.length > 0 && <div className="faint">Evidências: {x.evidence.join(", ")}</div>}
                  </Disclosure>
                </article>
              )}
            />
          ) : (
            <Empty>Nenhum marco entregue ainda.</Empty>
          )}
        </section>
      </div>

      {/* Qualidade, Métricas & Atividades Recentes */}
      <div className="ov-row ov-bottom">
        <section className="panel" aria-label="Qualidade">
          <SectionHead icon="shield" title="Qualidade" />
          <ul className="quality">
            {quality.map((q: QualityGate) => (
              <li key={q.id}>
                <span className="q-label">{q.label}</span>
                <Pill code={q.status} label={q.status_label} />
                <span className="faint q-date">{q.at ? fmt(q.at) : "—"}</span>
                {q.note && <span className="faint q-note">{q.note}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel" aria-label="Métricas">
          <SectionHead icon="chart" title="Métricas" />
          <div className="metric-grid">
            <Metric icon="file" value={tasks.length} label="Tarefas totais" />
            <Metric icon="check-circle" value={doneCount} label="Concluídas" tone="ok" />
            <Metric icon="layers" value={overview.metrics.processes_count} label="Processos mapeados" />
            <Metric icon="gear" value={overview.metrics.processes_automated} label="Processos automatizados" tone="ok" />
            <Metric icon="swap" value={overview.metrics.processes_in_migration} label="Processos em migração" />
            <Metric icon="beaker" value={overview.metrics.tests_count} label="Testes automatizados" />
            <Metric icon="clock" value={hours.total_label} label="Horas trabalhadas" />
            <Metric icon="flag" value={`${completedPhases} / ${totalPhases}`} label="Fases concluídas" />
          </div>
        </section>

        <section className="panel" aria-label="Últimas atividades">
          <SectionHead
            icon="history"
            title="Últimas atividades"
            action={<LinkButton onClick={() => onNavigate("historico")}>Ver histórico</LinkButton>}
          />
          <ol className="tl compact">
            {timeline.slice(0, 6).map((x, i) => (
              <li key={`${x.ts}-${i}`} className="tone-ok">
                <span className="tl-time">{fmt(x.ts)}</span>
                <span className="tl-body">
                  <span className="tl-title one-line">
                    {x.action}{x.task_id ? ` — ${x.task_id}` : ""}
                  </span>
                  <span className="faint one-line">
                    {x.executor}{x.phase_title ? ` · ${x.phase_title}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Relatórios */}
      <section className="panel" aria-label="Relatórios">
        <SectionHead
          icon="file"
          title="Relatórios executivos"
          count={reports.length}
          action={<LinkButton onClick={() => onNavigate("relatorios")}>Ver todos</LinkButton>}
        />
        <ul className="reports compact">
          {reports.slice(0, 4).map((r) => (
            <li key={r.report_id}>
              <span className="rep-icon">
                <Icon n="file" size={16} />
              </span>
              <div className="rep-main">
                <div className="rep-title one-line">{r.title}</div>
                <div className="faint">
                  versão {r.version} · gerado em {fmtDay(r.generated_at)} · {r.audience === "admin" ? "visão administrativa" : "visão do cliente"}
                </div>
              </div>
              <div className="rep-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => onOpenReport(r)}
                >
                  <Icon n="eye" size={14} />
                  Ver relatório
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
