import { useState } from "react";
import { AgentSkill } from "../types";
import { Icon } from "./Icons";

interface SkillDetailModalProps {
  skill: AgentSkill | null;
  onClose: () => void;
  onTestSkill: (skillId: string) => void;
  onOpenStatusPortalDemo?: () => void;
}

export function SkillDetailModal({
  skill,
  onClose,
  onTestSkill,
  onOpenStatusPortalDemo,
}: SkillDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"spec" | "rules" | "install">("spec");
  const [selectedRuntime, setSelectedRuntime] = useState<string>("claude");
  const [copied, setCopied] = useState(false);

  if (!skill) return null;

  const getCliCommand = (runtime: string) => {
    return `python install.py --agent ${runtime} --skill ${skill.id}`;
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 880 }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Head */}
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              className="sec-icon"
              style={{
                background: skill.isOfficial ? "rgba(91, 155, 255, .15)" : "rgba(63, 210, 154, .15)",
                color: skill.isOfficial ? "var(--accent)" : "var(--ok)",
                width: 36,
                height: 36,
              }}
            >
              <Icon n={skill.category === "security" ? "shield" : skill.category === "devops" ? "play" : "gear"} size={20} />
            </span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2>{skill.name}</h2>
                <span className={`badge ${skill.isOfficial ? "info" : "ok"}`}>
                  {skill.isOfficial ? "Oficial DM Skills" : "Custom Lab"}
                </span>
                <span className="badge neutral">v{skill.version}</span>
              </div>
              <div className="faint" style={{ fontSize: 12 }}>
                <code>{skill.id}</code> · Autor: {skill.author} · Modo: <b>{skill.execution_mode}</b>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: "var(--muted)", padding: 6 }}
            aria-label="Fechar"
          >
            <Icon n="x" size={20} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div style={{ padding: "0 20px", borderBottom: "1px solid var(--line)" }}>
          <div className="subtabs" style={{ borderBottom: 0 }}>
            <button
              type="button"
              className={activeTab === "spec" ? "tab active" : "tab"}
              onClick={() => setActiveTab("spec")}
            >
              Especificação (SKILL.md)
            </button>
            <button
              type="button"
              className={activeTab === "rules" ? "tab active" : "tab"}
              onClick={() => setActiveTab("rules")}
            >
              Heurísticas & Diretrizes
            </button>
            <button
              type="button"
              className={activeTab === "install" ? "tab active" : "tab"}
              onClick={() => setActiveTab("install")}
            >
              Instalação em Agentes
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ maxHeight: "65vh" }}>
          {activeTab === "spec" && (
            <div>
              <p style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.5, marginBottom: 14 }}>
                {skill.description}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {skill.tags.map((t) => (
                  <span key={t} className="skill-tag">
                    #{t}
                  </span>
                ))}
              </div>

              <div
                style={{
                  background: "#070d18",
                  border: "1px solid var(--line-2)",
                  borderRadius: 8,
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
                    Arquivo de Definição ({skill.entrypoint})
                  </span>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={() => copyText(skill.markdown)}
                  >
                    {copied ? "Copiado!" : "Copiar SKILL.md"}
                  </button>
                </div>
                <pre style={{ margin: 0, maxHeight: 320, background: "transparent", border: 0, padding: 0 }}>
                  {skill.markdown}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "rules" && (
            <div style={{ display: "grid", gap: 16 }}>
              {skill.whenToUse && (
                <div style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: 14 }}>
                  <h4 style={{ margin: "0 0 6px", color: "var(--ok)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon n="check-circle" size={16} />
                    Quando usar (Triggers de Ativação)
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                    {skill.whenToUse}
                  </p>
                </div>
              )}

              {skill.whenNotToUse && (
                <div style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: 14 }}>
                  <h4 style={{ margin: "0 0 6px", color: "var(--warn)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon n="alert" size={16} />
                    Quando NÃO usar (Limitações e Guardrails)
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                    {skill.whenNotToUse}
                  </p>
                </div>
              )}

              {skill.preconditions && (
                <div style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: 14 }}>
                  <h4 style={{ margin: "0 0 6px", color: "var(--accent)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon n="shield" size={16} />
                    Pré-condições e Isolamento de Segredos
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                    {skill.preconditions}
                  </p>
                </div>
              )}

              {skill.procedure && skill.procedure.length > 0 && (
                <div style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: 14 }}>
                  <h4 style={{ margin: "0 0 8px", color: "var(--ink)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon n="list" size={16} />
                    Procedimento Determinístico de Execução
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
                    {skill.procedure.map((step, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: "var(--ink-2)" }}>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "install" && (
            <div>
              <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 14 }}>
                Instale esta skill diretamente nos seus agentes locais ou em nuvem com o padrão aberto <code>install.py</code>:
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span className="faint" style={{ fontSize: 12 }}>Selecione o agente de IA:</span>
                <select
                  value={selectedRuntime}
                  onChange={(e) => setSelectedRuntime(e.target.value)}
                  style={{ padding: "5px 10px", fontSize: 13 }}
                >
                  <option value="claude">Claude Code (Anthropic)</option>
                  <option value="codex">OpenAI Codex</option>
                  <option value="antigravity">Antigravity (Google DeepMind)</option>
                  <option value="manus">Manus</option>
                  <option value="hermes">Hermes Agent</option>
                  <option value="opencode">OpenCode</option>
                  <option value="local">Diretório Local (.skills/)</option>
                </select>
              </div>

              <div className="cli-box">
                <code>{getCliCommand(selectedRuntime)}</code>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => copyText(getCliCommand(selectedRuntime))}
                >
                  {copied ? "Copiado!" : "Copiar Comando"}
                </button>
              </div>

              <div style={{ marginTop: 16, background: "rgba(255,255,255,.02)", border: "1px solid var(--line)", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
                  Local de Instalação Automático
                </div>
                <div className="faint" style={{ fontSize: 12, fontFamily: "monospace" }}>
                  {selectedRuntime === "claude" && "~/.claude/skills/" + skill.id}
                  {selectedRuntime === "codex" && "~/.codex/skills/" + skill.id}
                  {selectedRuntime === "antigravity" && "~/.gemini/config/skills/" + skill.id}
                  {selectedRuntime === "manus" && "Pacote .skill para importação direta no workspace"}
                  {selectedRuntime === "hermes" && "~/.hermes/skills/" + skill.id}
                  {selectedRuntime === "opencode" && "~/.opencode/skills/" + skill.id}
                  {selectedRuntime === "local" && "./.skills/" + skill.id}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Foot */}
        <div className="modal-foot">
          {skill.id === "status-portal" && onOpenStatusPortalDemo && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                onClose();
                onOpenStatusPortalDemo();
              }}
              style={{ marginRight: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Icon n="eye" size={14} />
              Abrir Demo Interativa da Skill
            </button>
          )}

          <button type="button" className="secondary" onClick={onClose}>
            Fechar
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onTestSkill(skill.id);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Icon n="play" size={14} />
            Testar no Laboratório
          </button>
        </div>
      </div>
    </div>
  );
}
