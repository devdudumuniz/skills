import { useState } from "react";
import { useProject } from "../context/ProjectContext";
import {
  Icon,
  SectionHead,
  Empty,
  fmtDay,
} from "../components/UIPrimitives";
import { ReportItem } from "../types";

interface ReportsViewProps {
  onOpenReport: (r: ReportItem) => void;
}

export function ReportsView({ onOpenReport }: ReportsViewProps) {
  const { role, reports, generateConsolidatedReport } = useProject();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGenerateConsolidated = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const msg = await generateConsolidatedReport();
      setMessage(msg);
    } catch {
      setMessage("Erro ao gerar relatório consolidado.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel">
      <SectionHead icon="file" title="Relatórios executivos e auditoria" count={reports.length} />
      <p className="faint lead">
        Relatórios consolidados por fase concluída e sumários executivos auditáveis, gerados diretamente a partir do planejamento, histórico de execução e evidências.
      </p>

      {/* Ações Administrativas */}
      {role === "ADMIN" && (
        <div className="callout" style={{ background: "#222222", border: "1px solid #545454", marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <b style={{ color: "#fff", fontSize: 13.5 }}>Gerador de Relatório Consolidado (Administração)</b>
              <div className="faint" style={{ fontSize: 12 }}>
                Reúne todas as fases, tarefas e evidências com verificação de integridade sem duplicidades.
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={handleGenerateConsolidated}
              style={{ padding: "6px 14px", fontWeight: 600 }}
            >
              {busy ? "Gerando..." : "Gerar Relatório Consolidado"}
            </button>
          </div>
          {message && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--ok)", fontWeight: 600 }}>
              {message}
            </div>
          )}
        </div>
      )}

      {/* Lista de Relatórios */}
      {reports.length ? (
        <ul className="reports">
          {reports.map((r) => (
            <li key={r.report_id}>
              <span className="rep-icon">
                <Icon n="file" size={18} />
              </span>
              <div className="rep-main">
                <div className="rep-title one-line">{r.title}</div>
                <div className="faint">
                  versão {r.version}
                  {r.period?.started_at ? ` · ${fmtDay(r.period.started_at)} a ${fmtDay(r.period.completed_at)}` : ""}
                  {` · gerado em ${fmtDay(r.generated_at)}`}
                  {r.audience === "admin" ? " · visão da administração" : " · visão do cliente"}
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
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => onOpenReport(r)}
                >
                  <Icon n="download" size={14} />
                  Baixar PDF
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Nenhum relatório emitido até o momento.</Empty>
      )}
    </section>
  );
}
