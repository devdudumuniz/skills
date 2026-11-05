import { useState } from "react";
import { useProject } from "../context/ProjectContext";
import {
  Pill,
  Ladder,
  SectionHead,
  KV,
} from "../components/UIPrimitives";
import { CapabilityDomain } from "../types";

export function ProcessesView() {
  const { overview, processes, capabilities } = useProject();

  return (
    <>
      <section className="panel">
        <SectionHead icon="layers" title={overview.labels.processes_title} count={processes.length} />
        <div className="table-wrap">
          <table className="resp data-table">
            <thead>
              <tr>
                <th>Processo</th>
                <th>Objetivo</th>
                <th>Situação</th>
                <th>Automação</th>
                <th>Prioridade</th>
                <th>Próximo marco</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((r) => (
                <tr key={r.process}>
                  <td data-h="Processo" className="strong">
                    {r.process}
                  </td>
                  <td data-h="Objetivo" className="desc">
                    {r.objective}
                  </td>
                  <td data-h="Situação">
                    <Ladder level={r.level} />
                    <div className="faint">{r.status}</div>
                  </td>
                  <td data-h="Automação">
                    <Pill code={r.automation} label={r.automation} />
                  </td>
                  <td data-h="Prioridade">{r.priority_label}</td>
                  <td data-h="Próximo marco" className="desc">
                    {r.next_milestone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <SectionHead icon="gear" title={overview.labels.capabilities_title} count={capabilities.length} />
        <p className="faint lead">{overview.labels.capabilities_intro}</p>
        <div className="cap-grid">
          {capabilities.map((d) => (
            <CapabilityCard key={d.domain_id} d={d} />
          ))}
        </div>
      </section>
    </>
  );
}

function CapabilityCard({ d }: { d: CapabilityDomain }) {
  const [open, setOpen] = useState(false);
  const { overview } = useProject();

  return (
    <article className="cap">
      <div className="cap-top">
        <Pill code={d.automation} label={`${overview.labels.automation_pill}: ${d.automation}`} />
        {d.priority_label && (
          <span className={`prio-tag prio-${d.priority ?? ""}`}>{d.priority_label}</span>
        )}
      </div>
      <h3>{d.label}</h3>
      <div className={open ? "desc" : "desc clamp clamp-2"}>{d.what_it_does}</div>
      <div className="cap-status">
        <Ladder level={d.level} />
        <span className="strong small">{d.status}</span>
      </div>
      <button
        type="button"
        className="more-btn"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Ocultar detalhes" : "Ver detalhes"}
      </button>
      {open && (
        <div className="cap-detail">
          <KV
            rows={[
              ["entrada", d.input],
              ["saída", d.output],
              ["próximo marco", d.next_milestone],
              [
                overview.labels.skills_label,
                d.skills_found.length ? (
                  d.skills_found.map((f) => (
                    <div key={f.label}>
                      <b>{f.label}</b>
                      {f.skills ? `: ${f.skills.join(", ")}` : ""}
                    </div>
                  ))
                ) : (
                  "—"
                ),
              ],
              [
                overview.labels.components_label,
                d.platform_components.length ? (
                  d.platform_components.map((x) => (
                    <div key={x.name}>
                      {x.name} — {x.status}
                    </div>
                  ))
                ) : (
                  "—"
                ),
              ],
            ]}
          />
        </div>
      )}
    </article>
  );
}
