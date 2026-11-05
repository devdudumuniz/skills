import { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { Icon } from "./Icons";
import { SectionHead } from "./UIPrimitives";
import { AgentSkill } from "../types";

export function SkillsCatalog() {
  const { skills } = useProject();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSkill, setActiveSkill] = useState<AgentSkill | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("claude");
  const [copied, setCopied] = useState(false);

  const categories = [
    { id: "all", label: "Todas as Categorias" },
    { id: "devops", label: "DevOps" },
    { id: "engineering", label: "Engenharia" },
    { id: "automation", label: "Automação" },
    { id: "security", label: "Segurança" },
    { id: "diagnostics", label: "Diagnóstico" },
    { id: "frontend", label: "Frontend" },
    { id: "governance", label: "Governança" },
  ];

  const agentRuntimes = [
    { id: "claude", name: "Claude Code", path: "~/.claude/skills/" },
    { id: "codex", name: "OpenAI Codex", path: "~/.codex/skills/" },
    { id: "antigravity", name: "Antigravity (DeepMind)", path: "~/.gemini/config/skills/" },
    { id: "hermes", name: "Hermes Agent", path: "~/.hermes/skills/" },
    { id: "opencode", name: "OpenCode", path: "~/.opencode/skills/" },
    { id: "local", name: "Projeto Local", path: "./.skills/" },
  ];

  const filteredSkills = skills.filter((s) => {
    if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchDesc = s.description.toLowerCase().includes(q);
      const matchTag = s.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTag) return false;
    }
    return true;
  });

  const getCliCommand = (skillId?: string) => {
    if (!skillId) {
      return `python install.py --agent ${selectedAgent} --all`;
    }
    return `python install.py --agent ${selectedAgent} --skill ${skillId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <section className="panel">
        <SectionHead icon="layers" title="Catálogo de Skills para Agentes de IA" count={skills.length} />
        <p className="faint lead">
          Hub universal e aberto de competências de engenharia de software prontas para produção (production-grade agent skills).
          Projetadas com princípios de Plan-First, Zero Exfiltração e compatibilidade multi-runtime.
        </p>

        {/* Gerador de Comandos CLI de Instalação */}
        <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--line)", borderRadius: 8, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              Instalador Universal (<code>install.py</code>)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="faint" style={{ fontSize: 12 }}>Runtime alvo:</span>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                style={{ padding: "4px 8px", fontSize: 12 }}
              >
                {agentRuntimes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="cli-box">
            <code>{getCliCommand()}</code>
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyToClipboard(getCliCommand())}
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Filtros de Categoria e Busca */}
        <div className="toolbar" style={{ marginTop: 14 }}>
          <div className="subtabs">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={selectedCategory === c.id ? "tab active" : "tab"}
                onClick={() => setSelectedCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="filters-inline">
            <input
              type="text"
              placeholder="Filtrar competência..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 180 }}
            />
          </div>
        </div>

        {/* Grid de Cards de Skills */}
        <div className="skills-grid" style={{ marginTop: 16 }}>
          {filteredSkills.map((s) => (
            <div key={s.id} className="skill-card">
              <div className="skill-header">
                <div>
                  <span className="skill-category">{s.category}</span>
                  <h3>{s.name}</h3>
                </div>
                <span className="skill-mode">{s.execution_mode}</span>
              </div>

              <p className="skill-desc">{s.description}</p>

              <div className="skill-tags">
                {s.tags.map((t) => (
                  <span key={t} className="skill-tag">
                    #{t}
                  </span>
                ))}
              </div>

              <div className="skill-footer">
                <span className="faint" style={{ fontSize: 11.5 }}>
                  <code>{s.entrypoint}</code>
                </span>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setActiveSkill(s)}
                  style={{ fontSize: 12 }}
                >
                  Documentação & Regras
                  <Icon n="arrow" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal de Detalhes da Skill */}
      {activeSkill && (
        <div className="modal-overlay" onClick={() => setActiveSkill(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="skill-category">{activeSkill.category}</span>
                <h2>{activeSkill.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveSkill(null)}
                style={{ color: "var(--muted)" }}
                aria-label="Fechar"
              >
                <Icon n="x" size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                <span className="badge info">Modo: {activeSkill.execution_mode}</span>
                <span className="badge neutral">Pacote: {activeSkill.package}</span>
                <span className="badge ok">Open Standard Compatible</span>
              </div>

              <p style={{ fontSize: 14, color: "var(--ink)" }}>{activeSkill.description}</p>

              <div style={{ margin: "16px 0" }}>
                <b style={{ color: "var(--ink)", display: "block", marginBottom: 6 }}>Comando de Instalação:</b>
                <div className="cli-box" style={{ margin: 0 }}>
                  <code>{getCliCommand(activeSkill.id)}</code>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={() => copyToClipboard(getCliCommand(activeSkill.id))}
                  >
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--line)", borderRadius: 8, padding: 14 }}>
                <h4 style={{ margin: "0 0 8px", color: "var(--accent)", fontSize: 13 }}>Conteúdo de Referência (SKILL.md)</h4>
                <pre style={{ margin: 0, maxHeight: 280 }}>{activeSkill.markdown}</pre>
              </div>
            </div>

            <div className="modal-foot">
              <button type="button" className="secondary" onClick={() => setActiveSkill(null)}>
                Fechar
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(activeSkill.markdown)}
              >
                Copiar SKILL.md
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
