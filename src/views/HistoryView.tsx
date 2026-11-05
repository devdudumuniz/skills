import { useState } from "react";
import { useProject } from "../context/ProjectContext";
import {
  Icon,
  Pill,
  SectionHead,
  Disclosure,
  Empty,
  fmt,
  fmtDay,
  fmtTime,
} from "../components/UIPrimitives";
import { TimelineItem } from "../types";

const PAGE_SIZE = 25;

export function HistoryView() {
  const { hours, timeline } = useProject();
  const [offset, setOffset] = useState(0);

  const paginatedItems = timeline.slice(offset, offset + PAGE_SIZE);

  // Group items by day
  const groups: [string, TimelineItem[]][] = [];
  for (const item of paginatedItems) {
    const day = fmtDay(item.ts);
    const last = groups[groups.length - 1];
    if (last && last[0] === day) {
      last[1].push(item);
    } else {
      groups.push([day, [item]]);
    }
  }

  return (
    <section className="panel">
      <SectionHead icon="history" title="Histórico de atualizações e auditoria" count={timeline.length} />

      {/* Painel de Horas Apuradas */}
      <div className="hours-total">
        <div className="hours-main">
          <span className="hours-icon">
            <Icon n="clock" size={20} />
          </span>
          <div>
            <span className="big-hours">{hours.total_label}</span> trabalhadas
            {hours.running ? " (sessão em andamento)" : ""}
          </div>
        </div>
        <div className="hours-split">
          <span>
            <b>{hours.registered_label}</b> registradas (tarefas e sessões)
          </span>
          <span>
            <b>{hours.reconstructed_label}</b> reconstruídas da atividade gravada
          </span>
          <span>
            <b>{hours.tasks_label}</b> em execução de tarefas
          </span>
        </div>
        <Disclosure
          summary={`Sessões de trabalho (${hours.sessions.length}) e método de cálculo`}
          className="mini-disc"
        >
          <ul className="rows small">
            {hours.sessions.slice().reverse().map((s) => (
              <li key={s.start} className="row-line">
                {fmt(s.start)} → {fmtTime(s.end)} · <b>{s.label}</b> ·{" "}
                <span className="faint">{s.source}</span>
              </li>
            ))}
          </ul>
          <p className="faint" style={{ marginTop: 6, fontSize: 11.5 }}>{hours.method}</p>
        </Disclosure>
      </div>

      {/* Linha do Tempo Agrupada por Dia */}
      {groups.length ? (
        <div className="tl-groups">
          {groups.map(([day, rows]) => (
            <section key={day} className="tl-day" aria-label={day}>
              <h3 className="tl-day-head">
                <Icon n="calendar" size={14} />
                {day}
              </h3>
              <ol className="tl">
                {rows.map((x, i) => (
                  <li key={`${x.ts}-${i}`} className="tone-ok">
                    <span className="tl-time">{fmtTime(x.ts)}</span>
                    <span className="tl-body">
                      <span className="tl-title">{x.action}</span>
                      {x.task_id && (
                        <span className="tl-task one-line">
                          <span className="tid">{x.task_id}</span> {x.task_title}
                        </span>
                      )}
                      <span className="faint">
                        {x.executor}
                        {x.phase_title ? ` · ${x.phase_title}` : ""}
                      </span>
                    </span>
                    <span className="tl-state">
                      <Pill code="DONE" label={x.result} dot={false} />
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <Empty>Nenhuma atividade registrada no período.</Empty>
      )}

      {/* Paginação */}
      {timeline.length > PAGE_SIZE && (
        <div className="pager">
          <button
            type="button"
            className="secondary"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            ← Mais recentes
          </button>
          <span className="faint">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, timeline.length)} de {timeline.length}
          </span>
          <button
            type="button"
            className="secondary"
            disabled={offset + PAGE_SIZE >= timeline.length}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Mais antigas →
          </button>
        </div>
      )}
    </section>
  );
}
