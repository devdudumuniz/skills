import { ReportItem } from "../types";
import { Icon } from "./Icons";
import { fmtDay } from "./UIPrimitives";

interface ReportModalProps {
  report: ReportItem | null;
  onClose: () => void;
}

export function ReportModal({ report, onClose }: ReportModalProps) {
  if (!report) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="sec-icon" style={{ background: "#333333", color: "#EAEAEA" }}>
              <Icon n="file" size={20} />
            </span>
            <div>
              <h2>{report.title}</h2>
              <div className="faint" style={{ fontSize: 12 }}>
                Versão {report.version} · Gerado em {fmtDay(report.generated_at)} · {report.audience === "admin" ? "Visão Administrativa" : "Visão do Cliente"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: "var(--muted)", padding: 4 }}
            aria-label="Fechar"
          >
            <Icon n="x" size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--line)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--accent)", fontWeight: 700, marginBottom: 6 }}>
              Resumo Executivo
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink)", lineHeight: 1.6 }}>{report.summary}</p>
          </div>

          <h3 style={{ fontSize: 15, margin: "16px 0 10px", color: "var(--ink)" }}>Destaques e Evidências da Fase</h3>
          <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
            {report.highlights.map((h, i) => (
              <li key={i} style={{ color: "var(--ink-2)", fontSize: 13.5 }}>{h}</li>
            ))}
          </ul>

          <div style={{ marginTop: 24, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="faint">
                {report.period?.started_at ? `Período coberto: ${fmtDay(report.period.started_at)} até ${fmtDay(report.period.completed_at)}` : "Auditoria acumulada"}
              </div>
              <div className="badge ok" style={{ fontSize: 12 }}>Assinatura Auditável</div>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="secondary" onClick={onClose} style={{ padding: "6px 14px" }}>
            Fechar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px" }}
          >
            <Icon n="download" size={14} />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
