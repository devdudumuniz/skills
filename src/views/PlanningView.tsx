import { useState } from "react";
import { useProject } from "../context/ProjectContext";
import {
  Icon,
  Pill,
  Bar,
  SectionHead,
  MoreList,
  fmtDay,
} from "../components/UIPrimitives";
import { Priority, TaskItem } from "../types";

interface PlanningViewProps {
  onNavigate: (tab: string, extra?: Record<string, string>) => void;
}

const PRIO_KEYS: Priority[] = ["P0", "P1", "P2", "P3"];
const PRIO_LABELS: Record<Priority, string> = {
  P0: "Crítica",
  P1: "Alta",
  P2: "Média",
  P3: "Baixa",
};

export function PlanningView({ onNavigate }: PlanningViewProps) {
  const { phases, tasks } = useProject();
  const [openPhaseId, setOpenPhaseId] = useState<string | null>(phases[0]?.phase_id ?? null);

  return (
    <>
      <section className="panel">
        <SectionHead icon="flag" title="Fases do projeto" />
        <p className="faint lead">
          Cada fase agrupa tarefas do planejamento; situação e progresso vêm do histórico real de execução. Clique em uma fase para ver os detalhes e tarefas associadas.
        </p>

        <ol className="phases">
          {phases.map((p) => {
            const isOpen = openPhaseId === p.phase_id;
            const phaseTasks = tasks.filter((t) => p.tasks.includes(t.id));
            return (
              <li key={p.phase_id} className={`phase s-${p.status}`}>
                <button
                  type="button"
                  className="phase-row"
                  onClick={() => setOpenPhaseId(isOpen ? null : p.phase_id)}
                  aria-expanded={isOpen}
                >
                  <span className="phase-icon">
                    <Icon n={p.status === "COMPLETED" ? "check-circle" : p.status === "IN_PROGRESS" ? "play" : "clock"} size={16} />
                  </span>
                  <span className="phase-title one-line">{p.title}</span>
                  <Pill code={p.status} label={p.status_label} />
                  <span className="phase-count">
                    {p.tasks_done}/{p.tasks_total}
                  </span>
                  <span className="phase-bar">
                    <Bar
                      value={p.progress}
                      tone={p.status === "COMPLETED" ? "ok" : p.status === "WAITING" ? "warn" : "info"}
                    />
                  </span>
                  <span className="phase-pct">{p.progress}%</span>
                  <span className="phase-hours" title="horas trabalhadas na fase">
                    {p.worked?.label ?? "—"}
                  </span>
                </button>

                {isOpen && (
                  <div className="phase-detail">
                    <div className="phase-detail-head">
                      <Pill code={p.status} label={p.status_label} />
                      <span className="faint">
                        {fmtDay(p.started_at)} → {fmtDay(p.completed_at)} · {p.worked?.label ?? "horas não registradas"}
                      </span>
                    </div>
                    {p.description && <p className="desc">{p.description}</p>}
                    <p className="desc">
                      <b>Objetivo:</b> {p.objective}
                    </p>
                    <div className="rows compact-rows">
                      {phaseTasks.map((t) => (
                        <div
                          key={t.id}
                          className="row-line"
                          style={{ cursor: "pointer" }}
                          onClick={() => onNavigate("tarefas", { task: t.id })}
                        >
                          <Pill code={t.status} label={t.status_label} />
                          <span className="task-ref one-line">
                            <span className="tid">{t.id}</span> — {t.title}
                          </span>
                          <span className="faint">{t.executor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="panel">
        <SectionHead icon="list" title="Planejamento por prioridade" />
        <p className="faint lead">Distribuição de esforço e criticidade de negócio conforme matriz P0 a P3.</p>
        <div className="prio-grid">
          {PRIO_KEYS.map((pr) => {
            const prTasks = tasks.filter((t) => t.priority === pr);
            const done = prTasks.filter((t) => t.status === "DONE").length;
            return (
              <div key={pr} className={`prio-col prio-${pr}`}>
                <div className="prio-head">
                  <h3>{PRIO_LABELS[pr]} ({pr})</h3>
                  <span className="faint">
                    {done}/{prTasks.length} concluídas
                  </span>
                </div>
                {prTasks.length ? (
                  <MoreList
                    items={prTasks}
                    initial={6}
                    className="prio-list"
                    render={(x: TaskItem) => (
                      <button
                        key={x.id}
                        type="button"
                        className="prio-item"
                        title={`${x.id} — ${x.title}`}
                        onClick={() => onNavigate("tarefas", { task: x.id })}
                      >
                        <Pill code={x.status} label={x.status_label} dot={false} />
                        <span className="task-ref one-line">
                          <span className="tid">{x.id}</span> {x.title}
                        </span>
                      </button>
                    )}
                  />
                ) : (
                  <div className="faint">Nenhuma tarefa.</div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
