import { useProject } from "../context/ProjectContext";
import {
  Icon,
  IconName,
  Pill,
  SectionHead,
  Clamp,
  Disclosure,
  KV,
  Empty,
  MoreList,
} from "../components/UIPrimitives";

const EVO_KEYS: [string, string, IconName][] = [
  ["existed", "O que existia", "history"],
  ["identified", "O que foi identificado", "eye"],
  ["preserved", "O que foi preservado", "shield"],
  ["rebuilt", "O que foi reconstruído", "gear"],
  ["improved", "O que foi melhorado", "trend"],
  ["missing", "O que falta", "hourglass"],
];

export function EvolutionView() {
  const { overview, comparative, evolution, findings } = useProject();

  return (
    <>
      {/* Tabela Comparativa de Ambientes */}
      <section className="panel">
        <SectionHead icon="swap" title={overview.labels.comparative_title} />
        <div className="table-wrap">
          <table className="resp data-table compare-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Ambiente atual</th>
                <th aria-hidden style={{ width: 28 }} />
                <th>Nova arquitetura</th>
              </tr>
            </thead>
            <tbody>
              {comparative.map((c) => (
                <tr key={c.category}>
                  <td data-h="Categoria" className="strong">
                    {c.category}
                  </td>
                  <td data-h="Ambiente atual" className="desc">
                    {c.current}
                  </td>
                  <td className="arrow-cell" aria-hidden>
                    <Icon n="arrow" size={14} />
                  </td>
                  <td data-h="Nova arquitetura" className="new-cell">
                    {c.new}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grid de Evolução */}
      <section className="panel">
        <SectionHead icon="trend" title="Evolução do projeto" />
        <div className="evo-grid">
          {EVO_KEYS.map(([k, l, ic]) => {
            const items = evolution[k]?.items ?? [];
            return (
              <article key={k} className={`evo-card evo-${k}`}>
                <div className="evo-head">
                  <Icon n={ic} size={16} />
                  <h3>{l}</h3>
                  <span className="sec-count">{items.length}</span>
                </div>
                {items.length ? (
                  <MoreList
                    items={items}
                    initial={3}
                    label="Ver detalhes"
                    className="evo-list"
                    render={(item) => (
                      <div key={item} className="evo-item">
                        {item}
                      </div>
                    )}
                  />
                ) : (
                  <p className="faint">Não registrado.</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Achados do Levantamento */}
      <section className="panel">
        <SectionHead icon="alert" title="Achados do levantamento e segurança" count={findings.length} />
        {findings.length ? (
          <div className="find-grid">
            {findings.map((x) => (
              <article key={x.finding_id} className={`finding st-${x.status}`}>
                <div className="cap-top">
                  <span className="badge neutral">{x.category}</span>
                  <Pill code={x.status} label={x.situation} />
                </div>
                <h3>{x.title}</h3>
                <Clamp lines={2} className="desc">
                  {x.description}
                </Clamp>
                <Disclosure summary="Impacto, ação e tarefas" className="mini-disc">
                  <KV
                    rows={[
                      ["impacto", x.impact],
                      ["ação relacionada", x.action],
                      ["tarefas vinculadas", x.tasks.join(", ") || "—"],
                    ]}
                  />
                </Disclosure>
              </article>
            ))}
          </div>
        ) : (
          <Empty>Nenhum achado registrado.</Empty>
        )}
      </section>
    </>
  );
}
