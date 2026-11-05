import { useState, useEffect, useRef } from "react";
import { useProject } from "../context/ProjectContext";
import {
  Icon,
  Pill,
  SectionHead,
  KV,
  Empty,
  fmt,
  fmtDay,
} from "../components/UIPrimitives";


interface TasksViewProps {
  initialTab?: string;
  focusTaskId?: string;
}

const TASK_TABS: [string, string][] = [
  ["concluidas", "Concluídas"],
  ["em_execucao", "Em execução"],
  ["proximas", "Próximas"],
  ["bloqueadas", "Aguardando"],
  ["todas", "Todas"],
];

const PRIO_OPTIONS: [string, string][] = [
  ["", "todas"],
  ["P0", "Crítica (P0)"],
  ["P1", "Alta (P1)"],
  ["P2", "Média (P2)"],
  ["P3", "Baixa (P3)"],
];

export function TasksView({ initialTab = "todas", focusTaskId }: TasksViewProps) {
  const { role, tasks, phases, updateTaskStatus } = useProject();
  const [tab, setTab] = useState(initialTab);
  const [phaseFilter, setPhaseFilter] = useState("");
  const [prioFilter, setPrioFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openTaskId, setOpenTaskId] = useState<string | null>(focusTaskId ?? null);

  const focusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusTaskId) {
      setOpenTaskId(focusTaskId);
      const targetTask = tasks.find((t) => t.id === focusTaskId);
      if (targetTask) {
        setTab("todas");
      }
      setTimeout(() => {
        focusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [focusTaskId, tasks]);

  const countByTab = (k: string) => {
    if (k === "todas") return tasks.length;
    return tasks.filter((t) => t.tab === k).length;
  };

  const filteredTasks = tasks.filter((t) => {
    if (tab !== "todas" && t.tab !== tab) return false;
    if (phaseFilter && t.phase_id !== phaseFilter) return false;
    if (prioFilter && t.priority !== prioFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = t.id.toLowerCase().includes(q);
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchGoal = t.goal.toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchGoal) return false;
    }
    return true;
  });

  return (
    <section className="panel">
      <SectionHead icon="check-square" title="Tarefas do projeto" count={tasks.length} />

      <div className="toolbar">
        <div className="subtabs" role="tablist" aria-label="Situação das tarefas">
          {TASK_TABS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              className={tab === k ? "tab active" : "tab"}
              onClick={() => setTab(k)}
            >
              {l} <span className="count">{countByTab(k)}</span>
            </button>
          ))}
        </div>

        <div className="filters-inline">
          <label>
            Fase
            <select value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)}>
              <option value="">todas as fases</option>
              {phases.map((p) => (
                <option key={p.phase_id} value={p.phase_id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Prioridade
            <select value={prioFilter} onChange={(e) => setPrioFilter(e.target.value)}>
              {PRIO_OPTIONS.map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label>
            Buscar
            <input
              type="text"
              placeholder="ID, título..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 140 }}
            />
          </label>
        </div>
      </div>

      <div className="faint list-count">
        {filteredTasks.length} tarefa(s) exibida(s)
      </div>

      {filteredTasks.length ? (
        <div className="task-list">
          {filteredTasks.map((t) => {
            const isOpen = openTaskId === t.id;
            const isFocus = focusTaskId === t.id;
            const when = t.completed_at
              ? `concluída ${fmtDay(t.completed_at)}`
              : t.started_at
              ? `início ${fmtDay(t.started_at)}`
              : null;

            return (
              <article
                key={t.id}
                ref={isFocus ? focusRef : undefined}
                className={`task s-${t.status} ${isFocus ? "focused" : ""}`}
              >
                <button
                  type="button"
                  className="task-row"
                  onClick={() => setOpenTaskId(isOpen ? null : t.id)}
                  aria-expanded={isOpen}
                >
                  <span className="task-id">{t.id}</span>
                  <span className="task-main">
                    <span className="task-title one-line">{t.title}</span>
                    <span className="task-meta">
                      <span className="one-line">{t.phase_title ?? "—"}</span>
                      <span>
                        <Icon n="user" size={12} />
                        {t.executor}
                      </span>
                      {when && (
                        <span>
                          <Icon n="calendar" size={12} />
                          {when}
                        </span>
                      )}
                      {t.worked && (
                        <span>
                          <Icon n="clock" size={12} />
                          {t.worked.label}
                          {t.worked.running ? " (em andamento)" : ""}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="task-badges">
                    <Pill code={t.status} label={t.status_label} />
                    <span className={`prio-tag prio-${t.priority}`}>{t.priority_label}</span>
                  </span>
                  <Icon n="chevron" size={16} className="chev" />
                </button>

                {isOpen && (
                  <div className="task-body">
                    <KV
                      rows={[
                        ["objetivo", t.goal],
                        ["resultado", t.result ?? (t.status === "DONE" ? "Concluída com verificação" : "Ainda não concluída")],
                        [
                          "verificações (gates)",
                          t.gates.length
                            ? t.gates.map((g) => (
                                <div key={g.gate}>
                                  {g.label}: <Pill code={g.status} label={g.status} />
                                </div>
                              ))
                            : "Não aplicável",
                        ],
                        [
                          "evidências",
                          t.evidence.length
                            ? t.evidence.map((e) => (
                                <div key={e.label}>
                                  {e.label}
                                  {e.count > 1 ? ` (${e.count})` : ""}
                                </div>
                              ))
                            : "Não registrado",
                        ],
                        [
                          "depende de",
                          t.depends_on.length
                            ? t.depends_on.map((x) => (
                                <div key={x.id}>
                                  {x.id} — {x.title}
                                </div>
                              ))
                            : "Nenhuma dependência pendente",
                        ],
                        [
                          "bloqueios",
                          t.blocked_by && t.blocked_by.length
                            ? <span className="badge warn">{t.blocked_by.join(", ")}</span>
                            : "Sem bloqueios externos",
                        ],
                        [
                          "datas",
                          `${t.started_at ? `início ${fmt(t.started_at)}` : "não iniciada"}${
                            t.completed_at ? ` · conclusão ${fmt(t.completed_at)}` : ""
                          }`,
                        ],
                      ]}
                    />

                    {/* Visão Administrativa Completa */}
                    {role === "ADMIN" && (
                      <div className="admin-only">
                        <summary style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <Icon n="shield" size={14} />
                          <b>Auditoria Administrativa & Metadados Canônicos</b>
                        </summary>
                        <KV
                          rows={[
                            ["status canônico", t.status],
                            ["responsável técnico", t.assignee ?? "—"],
                            ["concluída por", t.completed_by ?? "—"],
                            [
                              "evidências por caminho",
                              t.evidence.map((e) => (
                                <div key={e.ref}>
                                  <code>{e.ref}</code>
                                </div>
                              )),
                            ],
                            [
                              "gates detalhados",
                              t.gates.map((g) => (
                                <div key={g.gate}>
                                  <code>{g.gate}</code> [{g.status}] {g.at ?? ""}
                                </div>
                              )),
                            ],
                            [
                              "histórico de eventos auditáveis",
                              t.history && t.history.length
                                ? t.history.map((h) => (
                                    <div key={h.seq}>
                                      #{h.seq} {h.type} · {h.actor} · {fmt(h.ts)}
                                    </div>
                                  ))
                                : "Nenhum evento registrado",
                            ],
                          ]}
                        />

                        {/* Ações administrativas para simular ciclos de trabalho */}
                        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>Ações de status:</span>
                          <button
                            type="button"
                            className="secondary"
                            style={{ fontSize: 11, padding: "3px 8px" }}
                            onClick={() => updateTaskStatus(t.id, "IN_PROGRESS")}
                            disabled={t.status === "IN_PROGRESS"}
                          >
                            Iniciar Execução
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            style={{ fontSize: 11, padding: "3px 8px" }}
                            onClick={() => updateTaskStatus(t.id, "DONE")}
                            disabled={t.status === "DONE"}
                          >
                            Marcar Concluída
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            style={{ fontSize: 11, padding: "3px 8px" }}
                            onClick={() => updateTaskStatus(t.id, "WAITING")}
                            disabled={t.status === "WAITING"}
                          >
                            Registrar Bloqueio
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <Empty>Nenhuma tarefa corresponde aos filtros selecionados.</Empty>
      )}
    </section>
  );
}
