import React, { useState } from "react";
import { AgentSkill } from "../types";
import { BookCover } from "../components/BookCover";

interface SkillsStoreViewProps {
  skills: AgentSkill[];
  onSelectSkill: (skill: AgentSkill) => void;
  onToggleInstall: (skillId: string) => void;
  onNavigateCreate: () => void;
  onNavigateTest: (skillId?: string) => void;
  onNavigatePlanned?: () => void;
  onOpenStatusPortalDemo: () => void;
}

export const SkillsStoreView: React.FC<SkillsStoreViewProps> = ({
  skills,
  onSelectSkill,
  onToggleInstall,
  onNavigateCreate,
  onNavigateTest,
  onNavigatePlanned,
  onOpenStatusPortalDemo,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");
  const [installedOnly, setInstalledOnly] = useState(false);

  const categories = [
    { id: "todos", label: "Todos" },
    { id: "programacao", label: "Programação" },
    { id: "dados", label: "Dados" },
    { id: "automacao", label: "Automação" },
    { id: "negocios", label: "Negócios" },
    { id: "design", label: "Design" },
    { id: "midia", label: "Mídia" },
    { id: "conteudo", label: "Conteúdo" },
    { id: "aplicativos", label: "Aplicativos" },
  ];

  const filteredSkills = skills.filter((skill) => {
    // Installed filter
    if (installedOnly && !skill.installed) return false;

    // Category filter
    if (activeCategory !== "todos") {
      const cat = skill.category?.toLowerCase() || "";
      const matchesCategory =
        cat === activeCategory ||
        (activeCategory === "programacao" && (cat === "devops" || cat === "engineering" || cat === "frontend")) ||
        (activeCategory === "dados" && (cat === "security" || cat === "diagnostics" || cat === "data")) ||
        (activeCategory === "negocios" && cat === "governance") ||
        (activeCategory === "automacao" && cat === "automation") ||
        (activeCategory === "aplicativos" && (skill.id.includes("discord") || skill.id.includes("audacity") || cat === "aplicativos"));

      if (!matchesCategory) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = skill.name.toLowerCase().includes(q);
      const matchDesc = skill.description.toLowerCase().includes(q);
      const matchTag = skill.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTag) return false;
    }

    return true;
  });

  const installedCount = skills.filter((s) => s.installed).length;

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
      {/* Top Action Bar (Laboratório Header: Create, Test, Installed, Planned, Demo) */}
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Próximas Skills
            </button>
          )}

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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Testar no Playground
          </button>

          {/* + Criar Habilidade Button */}
          <button
            type="button"
            onClick={onNavigateCreate}
            style={{
              backgroundColor: "#EAEAEA",
              color: "#151515",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#C2C2C2")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#EAEAEA")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Criar Nova Habilidade
          </button>

          {/* Demo Status Portal link */}
          <button
            type="button"
            onClick={onOpenStatusPortalDemo}
            title="Demonstração da skill status-portal em execução"
            style={{
              backgroundColor: "#222222",
              color: "#9B9B9B",
              border: "1px solid #383838",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Demo Status Portal
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
          placeholder="Pesquisar habilidades"
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
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 18,
                backgroundColor: "#202020",
                border: "1px solid #383838",
                borderRadius: 14,
                padding: "16px 20px",
                cursor: "pointer",
                transition: "background-color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#262626";
                e.currentTarget.style.borderColor = "#545454";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#202020";
                e.currentTarget.style.borderColor = "#383838";
              }}
            >
              {/* Left Booklet Graphic */}
              <div style={{ flexShrink: 0 }}>
                <BookCover
                  title={skill.name}
                  theme={skill.coverTheme}
                  variant="thumbnail"
                />
              </div>

              {/* Middle Information */}
              <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <h3
                  style={{
                    fontSize: 15.5,
                    fontWeight: 700,
                    color: "#EAEAEA",
                    margin: "0 0 4px 0",
                    lineHeight: 1.3,
                  }}
                >
                  {skill.name}
                </h3>

                <p
                  style={{
                    fontSize: 13,
                    color: "#C2C2C2",
                    margin: "0 0 8px 0",
                    lineHeight: 1.45,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {skill.description}
                </p>

                {/* Verified Shield & Update Date */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#9B9B9B",
                    fontSize: 12,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  <span>Atualizado em {skill.updatedAt || "28 de set. de 2026"}</span>
                </div>
              </div>

              {/* Right Action Button: + Adicionar */}
              <div style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInstall(skill.id);
                  }}
                  style={{
                    backgroundColor: skill.installed ? "#2b2b2b" : "#333333",
                    color: skill.installed ? "#C2C2C2" : "#EAEAEA",
                    border: skill.installed ? "1px solid #767676" : "1px solid #545454",
                    borderRadius: 20,
                    padding: "7px 16px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!skill.installed) {
                      e.currentTarget.style.backgroundColor = "#444444";
                      e.currentTarget.style.borderColor = "#767676";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!skill.installed) {
                      e.currentTarget.style.backgroundColor = "#333333";
                      e.currentTarget.style.borderColor = "#545454";
                    }
                  }}
                >
                  {skill.installed ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Adicionado
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
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
              Tente buscar com outro termo ou selecione a categoria "Todos".
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
