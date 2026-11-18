import React, { useState } from "react";
import { AgentSkill } from "../types";
import { BookCover } from "../components/BookCover";
import { Icon } from "../components/Icons";
import { calculateSkillTokenProfile, formatTokens } from "../utils/tokenUtils";

interface SkillsStoreViewProps {
  skills: AgentSkill[];
  onSelectSkill: (skill: AgentSkill) => void;
  onToggleInstall: (skillId: string) => void;
  onToggleFavorite: (skillId: string) => void;
  onlyFavorites?: boolean;
  onClearFavoritesFilter?: () => void;
  onNavigateCreate: () => void;
  onNavigateTest: (skillId?: string) => void;
  onNavigatePlanned?: () => void;
  onNavigateGlobalSync: () => void;
}

export const SkillsStoreView: React.FC<SkillsStoreViewProps> = ({
  skills,
  onSelectSkill,
  onToggleInstall,
  onToggleFavorite,
  onlyFavorites = false,
  onClearFavoritesFilter,
  onNavigateCreate,
  onNavigateTest,
  onNavigatePlanned,
  onNavigateGlobalSync,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");
  const [installedOnly, setInstalledOnly] = useState(false);
  const [localFavoritesOnly, setLocalFavoritesOnly] = useState(false);

  const isFilteringFavorites = onlyFavorites || localFavoritesOnly;

  const categories = [
    { id: "todos", label: "Todos", icon: "layers" },
    { id: "codificacao", label: "Codificação", icon: "code" },
    { id: "dados", label: "Análise de Dados", icon: "database" },
    { id: "design", label: "Design", icon: "layout" },
    { id: "escrita", label: "Escrita", icon: "file-text" },
  ];

  const isSkillInTopic = (skill: AgentSkill, topicId: string): boolean => {
    if (topicId === "todos") return true;
    const cat = (skill.category || "").toLowerCase();
    const name = skill.name.toLowerCase();
    const desc = skill.description.toLowerCase();

    if (topicId === "codificacao") {
      return (
        cat === "programacao" ||
        cat === "devops" ||
        cat === "automacao" ||
        cat === "engineering" ||
        name.includes("devops") ||
        name.includes("código") ||
        name.includes("refatoração") ||
        desc.includes("tdd") ||
        desc.includes("pipeline")
      );
    }

    if (topicId === "dados") {
      return (
        cat === "dados" ||
        cat === "security" ||
        cat === "diagnostics" ||
        cat === "governance" ||
        name.includes("segurança") ||
        name.includes("auditoria") ||
        name.includes("dados") ||
        name.includes("governança") ||
        desc.includes("vulnerabilidades")
      );
    }

    if (topicId === "design") {
      return (
        cat === "design" ||
        cat === "frontend" ||
        cat === "midia" ||
        name.includes("design") ||
        name.includes("ui") ||
        name.includes("layout") ||
        name.includes("mídia")
      );
    }

    if (topicId === "escrita") {
      return (
        cat === "conteudo" ||
        cat === "negocios" ||
        cat === "copywriting" ||
        name.includes("conteúdo") ||
        name.includes("copywriting") ||
        name.includes("redação") ||
        desc.includes("documentação")
      );
    }

    return false;
  };

  const filteredSkills = skills.filter((skill) => {
    // Favorites filter
    if (isFilteringFavorites && !skill.isFavorite) return false;

    // Installed filter
    if (installedOnly && !skill.installed) return false;

    // Category filter
    if (activeCategory !== "todos" && !isSkillInTopic(skill, activeCategory)) {
      return false;
    }

    // Search query: allows filtering by name, category, description or tags
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = skill.name.toLowerCase().includes(q);
      const matchDesc = skill.description.toLowerCase().includes(q);
      const matchTag = skill.tags?.some((t) => t.toLowerCase().includes(q));
      const matchCategoryText = (skill.category || "").toLowerCase().includes(q);

      // Category semantic aliases (e.g. searching "programação" or "devops" or "apps")
      const categoryAliases: Record<string, string[]> = {
        programacao: ["programação", "programacao", "devops", "engineering", "frontend", "código", "codigo", "infra"],
        dados: ["dados", "data", "security", "segurança", "diagnostics", "diagnóstico", "análise"],
        automacao: ["automação", "automacao", "workflow", "processos", "automation"],
        negocios: ["negócios", "negocios", "governance", "governanca", "gestão", "business"],
        design: ["design", "ui", "ux", "visual", "interface", "extração"],
        midia: ["mídia", "midia", "video", "áudio", "audio"],
        conteudo: ["conteúdo", "conteudo", "copywriting", "texto", "redação"],
        aplicativos: ["aplicativos", "apps", "discord", "audacity", "lightroom", "illustrator"],
      };

      const matchCategoryAlias = Object.entries(categoryAliases).some(([catKey, aliases]) => {
        const isThisSkillCategory =
          skill.category?.toLowerCase() === catKey ||
          (catKey === "programacao" && (skill.category === "devops" || skill.category === "frontend")) ||
          (catKey === "dados" && (skill.category === "security" || skill.category === "diagnostics")) ||
          (catKey === "aplicativos" && (skill.id.includes("discord") || skill.id.includes("audacity")));

        return isThisSkillCategory && aliases.some((alias) => alias.includes(q) || q.includes(alias));
      });

      if (!matchName && !matchCategoryText && !matchCategoryAlias && !matchDesc && !matchTag) {
        return false;
      }
    }

    return true;
  });

  const installedCount = skills.filter((s) => s.installed).length;
  const favoriteCount = skills.filter((s) => s.isFavorite).length;

  return (
    <div
      className="skills-store-container"
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        padding: "24px 20px 60px 20px",
        color: "#EAEAEA",
      }}
    >
      {/* Top Action Bar (Laboratório Header: Create, Test, Installed, Favorites, Planned, Demo) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: "#292929",
              border: "1px solid #545454",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#EAEAEA",
            }}
          >
            <Icon n="beaker" size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#EAEAEA", letterSpacing: "-0.01em" }}>
              Laboratório de Habilidades
            </h1>
            <span style={{ fontSize: 12, color: "#9B9B9B" }}>
              Catálogo oficial e estúdio de criação para Agentes de IA
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Próximas Skills (Roadmap & Contribuição) */}
          {onNavigatePlanned && (
            <button
              type="button"
              onClick={onNavigatePlanned}
              style={{
                backgroundColor: "#333333",
                color: "#EAEAEA",
                border: "1px solid #545454",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#444444";
                e.currentTarget.style.borderColor = "#767676";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#333333";
                e.currentTarget.style.borderColor = "#545454";
              }}
            >
              <Icon n="calendar" size={13} />
              Próximas Skills
            </button>
          )}

          {/* Favoritas Filter Toggle */}
          <button
            type="button"
            onClick={() => {
              if (onlyFavorites && onClearFavoritesFilter) {
                onClearFavoritesFilter();
              } else {
                setLocalFavoritesOnly(!localFavoritesOnly);
              }
            }}
            style={{
              backgroundColor: isFilteringFavorites ? "#383838" : "#262626",
              color: isFilteringFavorites ? "#EAEAEA" : "#C2C2C2",
              border: isFilteringFavorites ? "1px solid #767676" : "1px solid #383838",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12.5,
              fontWeight: isFilteringFavorites ? 600 : 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!isFilteringFavorites) {
                e.currentTarget.style.backgroundColor = "#303030";
                e.currentTarget.style.borderColor = "#545454";
              }
            }}
            onMouseLeave={(e) => {
              if (!isFilteringFavorites) {
                e.currentTarget.style.backgroundColor = "#262626";
                e.currentTarget.style.borderColor = "#383838";
              }
            }}
          >
            <Icon n={isFilteringFavorites ? "star-filled" : "star"} size={14} />
            Favoritas ({favoriteCount})
          </button>

          {/* Minhas Habilidades Filter Toggle */}
          <button
            type="button"
            onClick={() => setInstalledOnly(!installedOnly)}
            style={{
              backgroundColor: installedOnly ? "#383838" : "#262626",
              color: installedOnly ? "#EAEAEA" : "#C2C2C2",
              border: installedOnly ? "1px solid #767676" : "1px solid #383838",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon n="check-circle" size={14} />
            Minhas Habilidades ({installedCount})
          </button>

          {/* Playground button */}
          <button
            type="button"
            onClick={() => onNavigateTest()}
            style={{
              backgroundColor: "#262626",
              color: "#C2C2C2",
              border: "1px solid #383838",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon n="play" size={13} />
            Testar no Playground
          </button>

          {/* + Criar Habilidade Button (Highlighted in Cyber Orange #D97757) */}
          <button
            type="button"
            onClick={onNavigateCreate}
            style={{
              backgroundColor: "#D97757",
              color: "#151515",
              border: "none",
              borderRadius: 8,
              padding: "7px 16px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 10px rgba(255, 107, 0, 0.35)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E28768";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(255, 107, 0, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#D97757";
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(255, 107, 0, 0.35)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Criar Nova Habilidade
          </button>

          {/* Ativação Global para Agentes */}
          <button
            type="button"
            onClick={onNavigateGlobalSync}
            title="Sincronizar skills globalmente para todos os agentes de IA (Claude Code, Codex, Manus, etc.)"
            style={{
              backgroundColor: "#222222",
              color: "#C2C2C2",
              border: "1px solid #444444",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2d2d2d";
              e.currentTarget.style.borderColor = "#767676";
              e.currentTarget.style.color = "#EAEAEA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#222222";
              e.currentTarget.style.borderColor = "#444444";
              e.currentTarget.style.color = "#C2C2C2";
            }}
          >
            <Icon n="terminal" size={13} />
            Ativação Global
          </button>
        </div>
      </div>

      {/* Main Search Pill Input matching monochrome palette */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <div
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#767676",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <input
          type="text"
          placeholder="Pesquisar por nome ou categoria..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            backgroundColor: "#202020",
            border: "1px solid #545454",
            borderRadius: 24,
            padding: "11px 16px 11px 42px",
            color: "#EAEAEA",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s, background-color 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#C2C2C2";
            e.currentTarget.style.backgroundColor = "#262626";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#545454";
            e.currentTarget.style.backgroundColor = "#202020";
          }}
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "#9B9B9B",
              cursor: "pointer",
              padding: 4,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Active Badge (When Filtering Favorites) */}
      {isFilteringFavorites && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#222222",
            border: "1px solid #545454",
            borderRadius: 8,
            padding: "8px 14px",
            marginBottom: 14,
            fontSize: 12.5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#EAEAEA" }}>
            <Icon n="star-filled" size={14} />
            <span>
              Exibindo apenas <b>Habilidades Favoritas</b> ({filteredSkills.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onClearFavoritesFilter) onClearFavoritesFilter();
              setLocalFavoritesOnly(false);
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#C2C2C2",
              cursor: "pointer",
              fontSize: 12,
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Ver todas as habilidades
          </button>
        </div>
      )}

      {/* Category Filter Pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 12,
          marginBottom: 16,
          scrollbarWidth: "none",
        }}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setInstalledOnly(false);
              }}
              style={{
                backgroundColor: isActive ? "#333333" : "transparent",
                color: isActive ? "#EAEAEA" : "#9B9B9B",
                border: isActive ? "1px solid #767676" : "1px solid transparent",
                borderRadius: 18,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#EAEAEA";
                  e.currentTarget.style.backgroundColor = "#262626";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#9B9B9B";
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Skill Rows List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filteredSkills.length > 0 ? (
          filteredSkills.map((skill) => (
            <div
              key={skill.id}
              onClick={() => onSelectSkill(skill)}
              className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#202020] border border-[#383838] hover:border-[#545454] transition-all cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              {/* Favorite Toggle Button in top-right corner */}
              <button
                type="button"
                title={skill.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                aria-label={skill.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(skill.id);
                }}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  background: skill.isFavorite ? "#292929" : "transparent",
                  border: skill.isFavorite ? "1px solid #545454" : "1px solid transparent",
                  borderRadius: 6,
                  width: 32,
                  height: 32,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: skill.isFavorite ? "#D97757" : "#767676",
                  transition: "all 0.15s ease",
                  zIndex: 2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#333333";
                  e.currentTarget.style.borderColor = "#767676";
                  e.currentTarget.style.color = "#D97757";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = skill.isFavorite ? "#292929" : "transparent";
                  e.currentTarget.style.borderColor = skill.isFavorite ? "#545454" : "transparent";
                  e.currentTarget.style.color = skill.isFavorite ? "#D97757" : "#767676";
                }}
              >
                <Icon n={skill.isFavorite ? "star-filled" : "star"} size={16} />
              </button>

              {/* Left Booklet Graphic & Middle Information */}
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-8 sm:pr-2">
                <div className="shrink-0">
                  <BookCover
                    title={skill.name}
                    theme={skill.coverTheme}
                    variant="thumbnail"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-[#EAEAEA] group-hover:text-white transition-colors mb-1 leading-snug">
                    {skill.name}
                  </h3>

                  <p className="text-xs sm:text-[13px] text-[#C2C2C2] mb-2 leading-relaxed line-clamp-2">
                    {skill.description}
                  </p>

                  {/* Verified Shield, Update Date & Token Footprint */}
                  <div className="flex items-center gap-2 sm:gap-3 text-[#9B9B9B] text-xs flex-wrap">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                      <Icon n="check-circle" size={13} className="text-[#D97757]" />
                      <span>Atualizado em {skill.updatedAt || "28 de set. de 2026"}</span>
                    </div>
                    <span>•</span>
                    {(() => {
                      const profile = calculateSkillTokenProfile(skill);
                      return (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: profile.categoryColor,
                            fontWeight: 700,
                            fontFamily: "monospace",
                            fontSize: 11,
                          }}
                        >
                          <Icon n="zap" size={11} />
                          <span>{formatTokens(profile.totalTokens)}</span>
                          <span style={{ fontSize: 9.5, opacity: 0.85 }}>({profile.categoryLabel})</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Right Action Button: + Adicionar */}
              <div className="w-full sm:w-auto shrink-0 flex items-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInstall(skill.id);
                  }}
                  className={`w-full sm:w-auto py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    skill.installed
                      ? "bg-[#292929] text-[#C2C2C2] border border-[#444]"
                      : "bg-[#262626] hover:bg-[#D97757] text-[#EAEAEA] hover:text-[#151515] border border-[#3d3d3d] hover:border-[#D97757] shadow-sm"
                  }`}
                >
                  {skill.installed ? (
                    <>
                      <Icon n="check" size={13} className="text-[#D97757]" />
                      <span>Adicionado</span>
                    </>
                  ) : (
                    <>
                      <Icon n="plus" size={13} />
                      <span>Adicionar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : isFilteringFavorites ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              backgroundColor: "#202020",
              borderRadius: 14,
              border: "1px dashed #545454",
              color: "#9B9B9B",
            }}
          >
            <div style={{ color: "#C2C2C2", marginBottom: 12, display: "flex", justifyContent: "center" }}>
              <Icon n="star" size={36} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#EAEAEA" }}>
              Nenhuma habilidade favoritada encontrada
            </div>
            <p style={{ fontSize: 13, margin: "0 0 16px 0", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
              Clique no ícone de estrela no canto superior direito de qualquer card para salvar suas habilidades favoritas.
            </p>
            <button
              type="button"
              onClick={() => {
                if (onClearFavoritesFilter) onClearFavoritesFilter();
                setLocalFavoritesOnly(false);
                setSearchQuery("");
                setActiveCategory("todos");
              }}
              style={{
                backgroundColor: "#333333",
                color: "#EAEAEA",
                border: "1px solid #545454",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Explorar todas as habilidades
            </button>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              backgroundColor: "#202020",
              borderRadius: 14,
              border: "1px dashed #545454",
              color: "#9B9B9B",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#EAEAEA" }}>
              Nenhuma habilidade encontrada
            </div>
            <p style={{ fontSize: 13, margin: "0 0 16px 0" }}>
              Tente buscar por outro nome ou categoria, ou selecione a categoria "Todos".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("todos");
                setInstalledOnly(false);
              }}
              style={{
                backgroundColor: "#333333",
                color: "#EAEAEA",
                border: "1px solid #545454",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
