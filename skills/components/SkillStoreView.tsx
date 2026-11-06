import React, { useState } from "react";
import { AgentSkillSuite } from "../types";
import { Icon } from "../../src/components/Icons";
import { DedaLogo } from "../../src/components/DedaLogo";

interface SkillStoreViewProps {
  suites: AgentSkillSuite[];
  onSelectSuite: (suite: AgentSkillSuite) => void;
  onToggleInstall: (suiteId: string) => void;
  onToggleFavorite: (suiteId: string) => void;
  onlyFavorites?: boolean;
  onClearFavoritesFilter?: () => void;
  onNavigateCreate: () => void;
  onNavigateTest: (suiteId?: string) => void;
  onNavigatePlanned?: () => void;
  onNavigateGlobalSync: () => void;
  onNavigateMascots?: () => void;
}

export const SkillStoreView: React.FC<SkillStoreViewProps> = ({
  suites,
  onSelectSuite,
  onToggleInstall,
  onToggleFavorite,
  onlyFavorites = false,
  onClearFavoritesFilter,
  onNavigateCreate,
  onNavigateTest,
  onNavigatePlanned,
  onNavigateGlobalSync,
  onNavigateMascots,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");
  const [installedOnly, setInstalledOnly] = useState(false);
  const [localFavoritesOnly, setLocalFavoritesOnly] = useState(false);

  const isFilteringFavorites = onlyFavorites || localFavoritesOnly;

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

  const filteredSuites = suites.filter((suite) => {
    // Favorites filter
    if (isFilteringFavorites && !suite.isFavorite) return false;

    // Installed filter
    if (installedOnly && !suite.installed) return false;

    // Category filter
    if (activeCategory !== "todos") {
      const cat = suite.category?.toLowerCase() || "";
      const matchesCategory =
        cat === activeCategory ||
        (activeCategory === "programacao" && (cat === "devops" || cat === "engineering" || cat === "frontend")) ||
        (activeCategory === "dados" && (cat === "security" || cat === "diagnostics" || cat === "data")) ||
        (activeCategory === "negocios" && cat === "governance") ||
        (activeCategory === "automacao" && cat === "automation") ||
        (activeCategory === "aplicativos" && (suite.id.includes("discord") || suite.id.includes("audacity") || cat === "aplicativos"));

      if (!matchesCategory) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = suite.name.toLowerCase().includes(q);
      const matchDesc = suite.description.toLowerCase().includes(q);
      const matchTagline = suite.tagline.toLowerCase().includes(q);
      const matchSubskills = suite.skills.some(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
      const matchCat = suite.category.toLowerCase().includes(q);

      if (!matchName && !matchDesc && !matchTagline && !matchSubskills && !matchCat) {
        return false;
      }
    }

    return true;
  });

  const totalBundledSkills = suites.reduce((acc, s) => acc + s.skills.length, 0);
  const installedCount = suites.filter((s) => s.installed).length;
  const favoriteCount = suites.filter((s) => s.isFavorite).length;

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        padding: "16px 20px 60px",
        color: "#EAEAEA",
      }}
    >
      {/* Top Banner / Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: "#222222",
              border: "1px solid #383838",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#EAEAEA",
            }}
          >
            <DedaLogo size={22} color="#EAEAEA" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#EAEAEA" }}>
              Deda Skills • Catálogo de Agentes
            </h1>
            <p style={{ fontSize: 12.5, color: "#9B9B9B", margin: "2px 0 0" }}>
              {suites.length} agentes especializados agrupando {totalBundledSkills} habilidades com arte em xilogravura
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onNavigateTest()}
            style={{
              background: "#222222",
              border: "1px solid #383838",
              color: "#EAEAEA",
              padding: "7px 12px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#222222")}
          >
            <Icon n="play" size={14} />
            <span>Playground</span>
          </button>

          <button
            type="button"
            onClick={onNavigateGlobalSync}
            style={{
              background: "#222222",
              border: "1px solid #383838",
              color: "#EAEAEA",
              padding: "7px 12px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#222222")}
          >
            <Icon n="terminal" size={14} />
            <span>Ativação Global</span>
          </button>

          {onNavigateMascots && (
            <button
              type="button"
              onClick={onNavigateMascots}
              style={{
                background: "#222222",
                border: "1px solid #383838",
                color: "#EAEAEA",
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#222222")}
            >
              <Icon n="users" size={14} />
              <span>Mascotes (4)</span>
            </button>
          )}

          {onNavigatePlanned && (
            <button
              type="button"
              onClick={onNavigatePlanned}
              style={{
                background: "#222222",
                border: "1px solid #383838",
                color: "#EAEAEA",
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2a2a2a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#222222")}
            >
              <Icon n="calendar" size={14} />
              <span>Próximas Skills</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateCreate}
            style={{
              background: "#333333",
              border: "1px solid #545454",
              color: "#EAEAEA",
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#3c3c3c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#333333")}
          >
            <Icon n="plus" size={14} />
            <span>Criar Nova</span>
          </button>
        </div>
      </div>

      {/* Hero Banner: Xilogravura de Cordel do Sertão */}
      <div
        style={{
          position: "relative",
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #383838",
          marginBottom: 20,
          boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
          background: "#181818",
        }}
      >
        <img
          src="/assets/cordel/hero_banner.jpg"
          alt="Xilogravura de Cordel do Sertão"
          style={{
            width: "100%",
            maxHeight: 180,
            objectFit: "cover",
            display: "block",
            filter: "contrast(1.08) brightness(0.92)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(to top, rgba(21, 21, 21, 0.95) 0%, rgba(21, 21, 21, 0.6) 60%, transparent 100%)",
            padding: "16px 20px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#C2C2C2", fontWeight: 700 }}>
              Inspiração Nordestina • Arte de Xilogravura & Literatura de Cordel
            </div>
            <div style={{ fontSize: 14, color: "#EAEAEA", fontWeight: 600 }}>
              Habilidades Forjadas com a Maestria e Resiliência do Sertão
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11.5,
              color: "#9B9B9B",
              background: "rgba(0,0,0,0.6)",
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Icon n="check-circle" size={13} />
            <span>Gravuras em Xilogravura Tradicional</span>
          </div>
        </div>
      </div>

      {/* Search Input Bar (Matching image_6bbb1f03.png) */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <div
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#767676",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Icon n="search" size={18} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar habilidades, agentes ou categorias..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            backgroundColor: "#202020",
            border: "1px solid #383838",
            borderRadius: 10,
            padding: "12px 14px 12px 44px",
            fontSize: 14,
            color: "#EAEAEA",
            outline: "none",
            transition: "border-color 0.15s, background 0.15s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#767676";
            e.target.style.backgroundColor = "#242424";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#383838";
            e.target.style.backgroundColor = "#202020";
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#9B9B9B",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <Icon n="x" size={14} />
          </button>
        )}
      </div>

      {/* Category Pills (Matching image_6bbb1f03.png) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 8,
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
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: "6px 14px",
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                backgroundColor: isActive ? "#EAEAEA" : "#222222",
                color: isActive ? "#151515" : "#C2C2C2",
                border: `1px solid ${isActive ? "#EAEAEA" : "#383838"}`,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#2b2b2b";
                  e.currentTarget.style.color = "#EAEAEA";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#222222";
                  e.currentTarget.style.color = "#C2C2C2";
                }
              }}
            >
              {cat.label}
            </button>
          );
        })}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setLocalFavoritesOnly(!localFavoritesOnly)}
            style={{
              padding: "6px 12px",
              borderRadius: 9999,
              fontSize: 12.5,
              fontWeight: isFilteringFavorites ? 600 : 400,
              backgroundColor: isFilteringFavorites ? "#333333" : "#1e1e1e",
              color: isFilteringFavorites ? "#EAEAEA" : "#9B9B9B",
              border: `1px solid ${isFilteringFavorites ? "#767676" : "#383838"}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <Icon n="star" size={13} />
            <span>Favoritas ({favoriteCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setInstalledOnly(!installedOnly)}
            style={{
              padding: "6px 12px",
              borderRadius: 9999,
              fontSize: 12.5,
              fontWeight: installedOnly ? 600 : 400,
              backgroundColor: installedOnly ? "#333333" : "#1e1e1e",
              color: installedOnly ? "#EAEAEA" : "#9B9B9B",
              border: `1px solid ${installedOnly ? "#767676" : "#383838"}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <Icon n="check" size={13} />
            <span>Instaladas ({installedCount})</span>
          </button>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {isFilteringFavorites && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#222222",
            border: "1px solid #383838",
            borderRadius: 8,
            padding: "8px 14px",
            marginBottom: 16,
            fontSize: 13,
            color: "#C2C2C2",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon n="star" size={15} />
            <span>Exibindo apenas habilidades marcadas como favoritas ({favoriteCount})</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLocalFavoritesOnly(false);
              if (onClearFavoritesFilter) onClearFavoritesFilter();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#EAEAEA",
              fontSize: 12,
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Ver todas
          </button>
        </div>
      )}

      {/* Agent Suites Grid (List of multi-capability agents avoiding repetition) */}
      {filteredSuites.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            backgroundColor: "#1a1a1a",
            border: "1px dashed #383838",
            borderRadius: 12,
            marginTop: 16,
          }}
        >
          <Icon n="search" size={32} />
          <h3 style={{ fontSize: 16, color: "#EAEAEA", margin: "12px 0 6px" }}>
            Nenhuma habilidade encontrada
          </h3>
          <p style={{ fontSize: 13, color: "#9B9B9B", margin: 0 }}>
            Tente buscar com outro termo ou limpe os filtros de categoria e favoritos.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("todos");
              setInstalledOnly(false);
              setLocalFavoritesOnly(false);
              if (onClearFavoritesFilter) onClearFavoritesFilter();
            }}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              borderRadius: 6,
              background: "#333333",
              border: "1px solid #545454",
              color: "#EAEAEA",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredSuites.map((suite) => (
            <div
              key={suite.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 20px",
                borderRadius: 12,
                backgroundColor: "#1c1c1c",
                border: "1px solid #2e2e2e",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onClick={() => onSelectSuite(suite)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#232323";
                e.currentTarget.style.borderColor = "#444444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1c1c1c";
                e.currentTarget.style.borderColor = "#2e2e2e";
              }}
            >
              {/* Left: Avatar & Info */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: suite.coverTheme.bg || "#1e1e1e",
                    border: "1px solid #3d3d3d",
                    flexShrink: 0,
                    boxShadow: "0 3px 10px rgba(0,0,0,0.45)",
                    position: "relative",
                  }}
                >
                  {suite.coverTheme.imageUrl ? (
                    <img
                      src={suite.coverTheme.imageUrl}
                      alt={suite.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        filter: "contrast(1.08)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: suite.coverTheme.accent || "#EAEAEA",
                      }}
                    >
                      <Icon n={suite.coverTheme.icon || "layers"} size={24} />
                    </div>
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3
                      style={{
                        fontSize: 15.5,
                        fontWeight: 650,
                        color: "#EAEAEA",
                        margin: 0,
                      }}
                    >
                      {suite.name}
                    </h3>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "1px 7px",
                        borderRadius: 4,
                        background: "#282828",
                        border: "1px solid #383838",
                        color: "#9B9B9B",
                      }}
                    >
                      {suite.skills.length} habilidades
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 13,
                      color: "#9B9B9B",
                      margin: "4px 0 6px",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {suite.tagline}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 11.5,
                      color: "#767676",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon n="check-circle" size={12} />
                      <span>Atualizado em {suite.updatedAt}</span>
                    </span>
                    <span>•</span>
                    <span>{suite.usageCount} usos</span>
                  </div>
                </div>
              </div>

              {/* Right: Favorite Toggle + Add/Manage Button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexShrink: 0,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onToggleFavorite(suite.id)}
                  title={suite.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  style={{
                    background: suite.isFavorite ? "#333333" : "transparent",
                    border: `1px solid ${suite.isFavorite ? "#767676" : "#383838"}`,
                    color: suite.isFavorite ? "#EAEAEA" : "#767676",
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#EAEAEA";
                    e.currentTarget.style.borderColor = "#767676";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = suite.isFavorite ? "#EAEAEA" : "#767676";
                    e.currentTarget.style.borderColor = suite.isFavorite ? "#767676" : "#383838";
                  }}
                >
                  <Icon n="star" size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => onToggleInstall(suite.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: suite.installed ? "#282828" : "#EAEAEA",
                    color: suite.installed ? "#EAEAEA" : "#151515",
                    border: `1px solid ${suite.installed ? "#545454" : "#EAEAEA"}`,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (suite.installed) {
                      e.currentTarget.style.backgroundColor = "#333333";
                    } else {
                      e.currentTarget.style.backgroundColor = "#C2C2C2";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (suite.installed) {
                      e.currentTarget.style.backgroundColor = "#282828";
                    } else {
                      e.currentTarget.style.backgroundColor = "#EAEAEA";
                    }
                  }}
                >
                  <Icon n={suite.installed ? "check" : "plus"} size={14} />
                  <span>{suite.installed ? "Instalado" : "Adicionar"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
