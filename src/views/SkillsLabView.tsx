import { useState } from "react";
import { useProject } from "../context/ProjectContext";
import { Icon } from "../components/Icons";
import { SectionHead } from "../components/UIPrimitives";
import { AgentSkill } from "../types";

interface SkillsLabViewProps {
  onSelectSkill: (skill: AgentSkill) => void;
  onNavigateCreate: () => void;
  onNavigateTest: (skillId?: string) => void;
  onOpenStatusPortalDemo: () => void;
}

export function SkillsLabView({
  onSelectSkill,
  onNavigateCreate,
  onNavigateTest,
  onOpenStatusPortalDemo,
}: SkillsLabViewProps) {
  const { skills, deleteSkill } = useProject();

  const [originFilter, setOriginFilter] = useState<"all" | "official" | "custom">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const officialCount = skills.filter((s) => s.isOfficial).length;
  const customCount = skills.filter((s) => !s.isOfficial).length;

  const categories = [
    { id: "all", label: "Todas" },
    { id: "devops", label: "DevOps" },
    { id: "engineering", label: "Engenharia" },
    { id: "automation", label: "Automação" },
    { id: "security", label: "Segurança" },
    { id: "diagnostics", label: "Diagnóstico" },
    { id: "frontend", label: "Frontend" },
    { id: "governance", label: "Governança" },
  ];

  const filteredSkills = skills.filter((s) => {
    if (originFilter === "official" && !s.isOfficial) return false;
    if (originFilter === "custom" && s.isOfficial) return false;
    if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchId = s.id.toLowerCase().includes(q);
      const matchDesc = s.description.toLowerCase().includes(q);
      const matchTag = s.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchId && !matchDesc && !matchTag) return false;
    }
    return true;
  });

  return (
    <>
      {/* Banner / Hero do Laboratório */}
      <section
        className="panel"
        style={{
          background: "linear-gradient(180deg, #102039 0%, var(--panel) 100%)",
          border: "1px solid var(--line)",
          padding: "24px 28px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ maxWidth: 640 }}>
            <div className="kicker" style={{ color: "var(--accent)", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
              Ambiente de Desenvolvimento & Governança
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "6px 0 10px", color: "var(--ink)" }}>
              Laboratório de Skills para Agentes de IA
            </h1>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
              Hub universal para criar, testar, catalogar e publicar competências determinísticas e seguras para agentes autônomos (Claude Code, OpenAI Codex, Manus, Antigravity e ambientes locais).
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="secondary"
              onClick={() => onNavigateTest()}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", fontWeight: 600 }}
            >
              <Icon n="play" size={15} />
              Playground de Testes
            </button>
            <button
              type="button"
              onClick={onNavigateCreate}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", fontWeight: 600 }}
            >
              <Icon n="gear" size={15} />
              Criar Nova Skill
            </button>
          </div>
        </div>

        {/* Métricas do Laboratório */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,.06)",
          }}
        >
          <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--line-2)", borderRadius: 8, padding: 10 }}>
            <div className="faint" style={{ fontSize: 11.5 }}>Total no Laboratório</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>{skills.length} skills</div>
          </div>
          <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--line-2)", borderRadius: 8, padding: 10 }}>
            <div className="faint" style={{ fontSize: 11.5 }}>Skills Oficiais DM</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--info)" }}>{officialCount} skills</div>
          </div>
          <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--line-2)", borderRadius: 8, padding: 10 }}>
            <div className="faint" style={{ fontSize: 11.5 }}>Criadas no Lab</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ok)" }}>{customCount} custom</div>
          </div>
          <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--line-2)", borderRadius: 8, padding: 10 }}>
            <div className="faint" style={{ fontSize: 11.5 }}>Runtimes Compatíveis</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>8 plataformas</div>
          </div>
        </div>
      </section>

      {/* Seção Principal de Listagem */}
      <section className="panel">
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <SectionHead icon="layers" title="Catálogo de Competências" count={filteredSkills.length} />

          {/* Filtro por Origem (Todas, Oficiais, Criadas no Lab) */}
          <div className="role-toggle-bar" style={{ margin: 0 }}>
            <button
              type="button"
              className={`role-btn ${originFilter === "all" ? "active" : ""}`}
              onClick={() => setOriginFilter("all")}
            >
              Todas ({skills.length})
            </button>
            <button
              type="button"
              className={`role-btn ${originFilter === "official" ? "active" : ""}`}
              onClick={() => setOriginFilter("official")}
            >
              Oficiais ({officialCount})
            </button>
            <button
              type="button"
              className={`role-btn ${originFilter === "custom" ? "active" : ""}`}
              onClick={() => setOriginFilter("custom")}
            >
              Criadas no Lab ({customCount})
            </button>
          </div>
        </div>

        {/* Barra de Filtros por Categoria e Busca */}
        <div className="toolbar">
          <div className="subtabs">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={categoryFilter === c.id ? "tab active" : "tab"}
                onClick={() => setCategoryFilter(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="filters-inline">
            <input
              type="text"
              placeholder="Buscar por nome, tag, slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 220 }}
            />
          </div>
        </div>

        {/* Grid de Cards de Skills */}
        {filteredSkills.length ? (
          <div className="skills-grid" style={{ marginTop: 16 }}>
            {filteredSkills.map((s) => (
              <div
                key={s.id}
                className="skill-card"
                style={{
                  borderLeft: s.isOfficial ? "3px solid var(--accent)" : "3px solid var(--ok)",
                }}
              >
                <div className="skill-header">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span className="skill-category">{s.category}</span>
                      <span className={`badge ${s.isOfficial ? "info" : "ok"}`} style={{ fontSize: 10, padding: "1px 6px" }}>
                        {s.isOfficial ? "Oficial" : "Lab"}
                      </span>
                    </div>
                    <h3>{s.name}</h3>
                    <code className="tid" style={{ fontSize: 11 }}>{s.id}</code>
                  </div>
                  <span className="skill-mode">{s.execution_mode}</span>
                </div>

                <p className="skill-desc">{s.description}</p>

                {s.whenToUse && (
                  <div style={{ fontSize: 11.5, color: "var(--muted)", background: "rgba(255,255,255,.015)", padding: "6px 8px", borderRadius: 6 }}>
                    <b style={{ color: "var(--ink-2)" }}>Gatilho:</b> {s.whenToUse}
                  </div>
                )}

                <div className="skill-tags">
                  {s.tags.map((t) => (
                    <span key={t} className="skill-tag">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="skill-footer">
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => onSelectSkill(s)}
                      style={{ fontSize: 12 }}
                    >
                      <Icon n="eye" size={13} />
                      Especificação
                    </button>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => onNavigateTest(s.id)}
                      style={{ fontSize: 12, color: "var(--accent)" }}
                    >
                      <Icon n="play" size={13} />
                      Testar
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {/* Botão de Demonstração Interativa para a skill status-portal */}
                    {s.id === "status-portal" && (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={onOpenStatusPortalDemo}
                        title="Ver demonstração da skill Status Portal em ação"
                        style={{ fontSize: 11, padding: "4px 8px" }}
                      >
                        Demo da Skill
                      </button>
                    )}

                    {!s.isOfficial && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir a skill '${s.name}' do laboratório?`)) {
                            deleteSkill(s.id);
                          }
                        }}
                        style={{ color: "var(--bad)", fontSize: 11, padding: "4px 6px" }}
                        title="Excluir skill do laboratório"
                      >
                        <Icon n="x" size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ margin: "24px 0" }}>
            Nenhuma skill encontrada com os filtros selecionados.
          </div>
        )}
      </section>
    </>
  );
}
