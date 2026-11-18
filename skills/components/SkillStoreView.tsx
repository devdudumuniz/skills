import React, { useState, useEffect, useMemo } from "react";
import { AgentSkillSuite } from "../types";
import { Icon } from "../../src/components/Icons";
import { DedaLogo } from "../../src/components/DedaLogo";
import { calculateSkillTokenProfile, formatTokens } from "../../src/utils/tokenUtils";

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
  onNavigateDiagramStudio?: (promptText?: string) => void;
  onOpenBackup?: () => void;
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
  onNavigateDiagramStudio,
  onOpenBackup,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");
  const [installedOnly, setInstalledOnly] = useState(false);
  const [localFavoritesOnly, setLocalFavoritesOnly] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">(() => {
    try {
      const saved = localStorage.getItem("deda_skills_catalog_layout");
      if (saved === "grid" || saved === "list") return saved;
    } catch {
      // ignore storage errors
    }
    return "list";
  });

  const handleChangeLayoutMode = (mode: "list" | "grid") => {
    setLayoutMode(mode);
    try {
      localStorage.setItem("deda_skills_catalog_layout", mode);
    } catch {
      // ignore storage errors
    }
  };

  const isFilteringFavorites = onlyFavorites || localFavoritesOnly;

  // Topics specifically requested by user: Codificação, Análise de Dados, Design, Escrita
  const categories = [
    { id: "todos", label: "Todos", icon: "layers" },
    { id: "codificacao", label: "Codificação", icon: "code" },
    { id: "dados", label: "Análise de Dados", icon: "database" },
    { id: "design", label: "Design", icon: "layout" },
    { id: "escrita", label: "Escrita", icon: "file-text" },
  ];

  // Helper to map suites to the 4 primary requested topics
  const isSuiteInTopic = (suite: AgentSkillSuite, topicId: string): boolean => {
    if (topicId === "todos") return true;
    const cat = (suite.category || "").toLowerCase();
    const name = suite.name.toLowerCase();
    const desc = suite.description.toLowerCase();
    const tagline = suite.tagline.toLowerCase();

    if (topicId === "codificacao") {
      return (
        cat === "programacao" ||
        cat === "devops" ||
        cat === "automacao" ||
        cat === "engineering" ||
        name.includes("devops") ||
        name.includes("ci/cd") ||
        name.includes("código") ||
        name.includes("engenharia") ||
        desc.includes("refatoração") ||
        desc.includes("testes") ||
        tagline.includes("ci/cd")
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
        name.includes("governança") ||
        name.includes("dados") ||
        desc.includes("vulnerabilidades") ||
        desc.includes("zero exfiltração") ||
        tagline.includes("segurança")
      );
    }

    if (topicId === "design") {
      return (
        cat === "design" ||
        cat === "frontend" ||
        cat === "midia" ||
        name.includes("design") ||
        name.includes("ui") ||
        name.includes("frontend") ||
        name.includes("mídia") ||
        desc.includes("tokens de design") ||
        desc.includes("react + tailwind")
      );
    }

    if (topicId === "escrita") {
      return (
        cat === "conteudo" ||
        cat === "negocios" ||
        cat === "copywriting" ||
        name.includes("conteúdo") ||
        name.includes("copywriting") ||
        name.includes("negócios") ||
        desc.includes("documentação") ||
        desc.includes("rfc") ||
        tagline.includes("redação")
      );
    }

    return false;
  };

  // Pre-calculate count for each category badge
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      counts[cat.id] = suites.filter((s) => isSuiteInTopic(s, cat.id)).length;
    });
    return counts;
  }, [suites]);

  // Filtered skills list
  const filteredSuites = suites.filter((suite) => {
    // Favorites filter
    if (isFilteringFavorites && !suite.isFavorite) return false;

    // Installed filter
    if (installedOnly && !suite.installed) return false;

    // Category filter
    if (activeCategory !== "todos" && !isSuiteInTopic(suite, activeCategory)) {
      return false;
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

  // Average test benchmark duration (real / persisted)
  const [avgTestDuration, setAvgTestDuration] = useState("1.4s");
  useEffect(() => {
    try {
      const rawTimes = localStorage.getItem("deda_skills_test_durations");
      if (rawTimes) {
        const times: number[] = JSON.parse(rawTimes);
        if (times.length > 0) {
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          setAvgTestDuration(`${avg.toFixed(1)}s`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Number of user AI-made creations (persisted in localStorage)
  const [aiCreationsCount, setAiCreationsCount] = useState<number>(() => {
    try {
      const count = localStorage.getItem("deda_skills_ai_creations_count");
      if (count) return Math.max(1, parseInt(count, 10));
    } catch (e) {
      console.error(e);
    }
    return 1;
  });

  // Re-read storage count if updated
  useEffect(() => {
    const handleStorage = () => {
      try {
        const count = localStorage.getItem("deda_skills_ai_creations_count");
        if (count) setAiCreationsCount(Math.max(1, parseInt(count, 10)));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Average token footprint per skill
  const avgTokens = useMemo(() => {
    if (suites.length === 0) return "1.6k";
    const total = suites.reduce((acc, s) => acc + calculateSkillTokenProfile(s).totalTokens, 0);
    return formatTokens(Math.round(total / suites.length));
  }, [suites]);

  return (
    <div
      style={{
        maxWidth: 1040,
        margin: "0 auto",
        padding: "16px 16px 60px",
        color: "#EAEAEA",
      }}
    >
      {/* Top Banner / Actions Bar */}
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
            <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: "#F5F2EB" }}>
              Deda Skills • Catálogo de Agentes
            </h1>
            <p style={{ fontSize: 12, color: "#A39889", margin: "2px 0 0" }}>
              {suites.length} agentes especializados agrupando {totalBundledSkills} habilidades com arte em xilogravura
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onNavigateTest()}
            style={{
              background: "#26211D",
              border: "1px solid #3D352D",
              color: "#F5F2EB",
              padding: "7px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2F2924")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#26211D")}
          >
            <Icon n="play" size={13} />
            <span>Playground</span>
          </button>

          {onNavigateDiagramStudio && (
            <button
              type="button"
              onClick={() => onNavigateDiagramStudio()}
              style={{
                background: "#26211D",
                border: "1px solid #3D352D",
                color: "#F5F2EB",
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2F2924")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#26211D")}
            >
              <Icon n="pen-tool" size={13} />
              <span>Diagramas Excalidraw</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateGlobalSync}
            style={{
              background: "#26211D",
              border: "1px solid #3D352D",
              color: "#F5F2EB",
              padding: "7px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2F2924")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#26211D")}
          >
            <Icon n="terminal" size={13} />
            <span>Ativação Global</span>
          </button>

          {onNavigateMascots && (
            <button
              type="button"
              onClick={onNavigateMascots}
              style={{
                background: "#26211D",
                border: "1px solid #3D352D",
                color: "#F5F2EB",
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2F2924")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#26211D")}
            >
              <Icon n="users" size={13} />
              <span>Mascotes (6)</span>
            </button>
          )}

          {onNavigatePlanned && (
            <button
              type="button"
              onClick={onNavigatePlanned}
              style={{
                background: "#26211D",
                border: "1px solid #3D352D",
                color: "#F5F2EB",
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2F2924")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#26211D")}
            >
              <Icon n="calendar" size={13} />
              <span>Próximas Skills</span>
            </button>
          )}

          {onOpenBackup && (
            <button
              type="button"
              onClick={onOpenBackup}
              title="Exportar ou migrar preferências de habilidades instaladas e favoritas em JSON"
              style={{
                background: "#26211D",
                border: "1px solid #3D352D",
                color: "#F5F2EB",
                padding: "7px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2F2924")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#26211D")}
            >
              <Icon n="download" size={13} />
              <span>Exportar JSON</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateCreate}
            style={{
              background: "#D97757",
              border: "1px solid #D97757",
              color: "#FFFFFF",
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(217, 119, 87, 0.35)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E28768")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D97757")}
          >
            <Icon n="sparkles" size={13} />
            <span>Criar com IA</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          DASHBOARD DE MÉTRICAS (SOLICITADO: TOTAL INSTALADAS, TEMPO MÉDIO, CRIAÇÕES COM IA)
          ========================================================================= */}
      <section
        aria-label="Dashboard de Métricas"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Métrica 1: Habilidades Instaladas */}
        <div
          onClick={() => setInstalledOnly(!installedOnly)}
          style={{
            backgroundColor: installedOnly ? "#34221A" : "#24201D",
            border: `1px solid ${installedOnly ? "#D97757" : "#383129"}`,
            borderRadius: 12,
            padding: "14px 16px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
          }}
          title="Clique para alternar filtro de habilidades instaladas"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#A39889" }}>
              Habilidades Instaladas
            </span>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                backgroundColor: "#2C2621",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D97757",
              }}
            >
              <Icon n="check-circle" size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#F5F2EB", letterSpacing: "-0.02em" }}>
              {installedCount} <span style={{ fontSize: 13, color: "#766B5E", fontWeight: 500 }}>/ {suites.length}</span>
            </div>
            <div style={{ fontSize: 11, color: installedOnly ? "#D97757" : "#8C8172", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: installedCount > 0 ? "#D97757" : "#6E6356" }}></span>
              <span>{installedOnly ? "Filtrando instaladas (ativo)" : "Prontas no agente autônomo"}</span>
            </div>
          </div>
        </div>

        {/* Métrica 2: Tempo Médio de Teste */}
        <div
          onClick={() => onNavigateTest()}
          style={{
            backgroundColor: "#24201D",
            border: "1px solid #383129",
            borderRadius: 12,
            padding: "14px 16px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          title="Abrir Playground de testes"
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#4A4036")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#383129")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#A39889" }}>
              Tempo Médio de Teste
            </span>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                backgroundColor: "#2C2621",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#E09F3E",
              }}
            >
              <Icon n="zap" size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#F5F2EB", letterSpacing: "-0.02em", fontFamily: "monospace" }}>
              {avgTestDuration}
            </div>
            <div style={{ fontSize: 11, color: "#8C8172", marginTop: 2 }}>
              Benchmark rápido em sandbox isolada
            </div>
          </div>
        </div>

        {/* Métrica 3: Criações Feitas com IA */}
        <div
          onClick={onNavigateCreate}
          style={{
            backgroundColor: "#24201D",
            border: "1px solid #383129",
            borderRadius: 12,
            padding: "14px 16px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          title="Abrir criação orientada por entrevista IA"
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#4A4036")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#383129")}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#A39889" }}>
              Criações Feitas com IA
            </span>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                backgroundColor: "#2C2621",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D97757",
              }}
            >
              <Icon n="sparkles" size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#F5F2EB", letterSpacing: "-0.02em" }}>
              {aiCreationsCount} <span style={{ fontSize: 13, color: "#766B5E", fontWeight: 500 }}>{aiCreationsCount === 1 ? "skill criada" : "skills criadas"}</span>
            </div>
            <div style={{ fontSize: 11, color: "#8C8172", marginTop: 2 }}>
              Entrevistas & Briefings validados
            </div>
          </div>
        </div>

        {/* Métrica 4: Footprint Médio de Contexto / Tokens */}
        <div
          style={{
            backgroundColor: "#24201D",
            border: "1px solid #383129",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          title="Tamanho médio de payload adicionado ao prompt do agente"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#A39889" }}>
              Footprint de Contexto
            </span>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                backgroundColor: "#2C2621",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D4CDC3",
              }}
            >
              <Icon n="layers" size={14} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#F5F2EB", letterSpacing: "-0.02em", fontFamily: "monospace" }}>
              ~{avgTokens} <span style={{ fontSize: 12, color: "#D97757", fontWeight: 600 }}>/ skill</span>
            </div>
            <div style={{ fontSize: 11, color: "#8C8172", marginTop: 2 }}>
              Consumo leve (1.1% de 128k de janela)
            </div>
          </div>
        </div>
      </section>

      {/* Hero Banner: Xilogravura de Cordel */}
      <div
        style={{
          position: "relative",
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #3E352C",
          marginBottom: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          background: "#1E1A17",
        }}
      >
        <img
          src="/assets/cordel/hero_banner.jpg"
          alt="Xilogravura de Cordel do Sertão"
          style={{
            width: "100%",
            maxHeight: 140,
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
            background: "linear-gradient(to top, rgba(30, 26, 23, 0.96) 0%, rgba(30, 26, 23, 0.65) 60%, transparent 100%)",
            padding: "12px 18px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "#D4CDC3", fontWeight: 700 }}>
              Inspiração Nordestina • Arte de Xilogravura & Literatura de Cordel
            </div>
            <div style={{ fontSize: 13.5, color: "#F5F2EB", fontWeight: 600 }}>
              Habilidades Forjadas com a Maestria e Resiliência do Sertão
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "#A39889",
              background: "rgba(25, 21, 18, 0.75)",
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid rgba(245, 242, 235, 0.12)",
            }}
          >
            <Icon n="check-circle" size={12} />
            <span>Gravuras em Xilogravura Tradicional</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAGS DE CATEGORIAS INTERATIVAS (CODIFICAÇÃO, ANÁLISE DE DADOS, DESIGN, ESCRITA)
          ========================================================================= */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#A39889" }}>
            Filtrar por Categoria
          </span>
          <span style={{ fontSize: 11, color: "#766B5E" }}>
            {filteredSuites.length} {filteredSuites.length === 1 ? "habilidade exibida" : "habilidades exibidas"}
          </span>
        </div>

        {/* Category Tags Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 6,
            scrollbarWidth: "none",
          }}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setInstalledOnly(false);
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? "#312720" : "#211D1A",
                  color: isActive ? "#D97757" : "#D4CDC3",
                  border: `1px solid ${isActive ? "#D97757" : "#383129"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  boxShadow: isActive ? "0 2px 10px rgba(217, 119, 87, 0.2)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#2A241F";
                    e.currentTarget.style.color = "#F5F2EB";
                    e.currentTarget.style.borderColor = "#4A4036";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "#211D1A";
                    e.currentTarget.style.color = "#D4CDC3";
                    e.currentTarget.style.borderColor = "#383129";
                  }
                }}
              >
                <Icon n={cat.icon} size={13} />
                <span>{cat.label}</span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 12,
                    backgroundColor: isActive ? "#3E2B20" : "#2A241F",
                    color: isActive ? "#D97757" : "#8C8172",
                    border: `1px solid ${isActive ? "#D97757" : "#3E352C"}`,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexShrink: 0 }}>
            {/* Quick Favorites Pill */}
            <button
              type="button"
              onClick={() => setLocalFavoritesOnly(!localFavoritesOnly)}
              style={{
                padding: "6px 12px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: isFilteringFavorites ? 600 : 400,
                backgroundColor: isFilteringFavorites ? "#332619" : "#211D1A",
                color: isFilteringFavorites ? "#E09F3E" : "#A39889",
                border: `1px solid ${isFilteringFavorites ? "#E09F3E" : "#383129"}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
              }}
            >
              <Icon n="star" size={12} />
              <span>Favoritas ({favoriteCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Input Bar + Layout Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-0">
          <div
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#766B5E",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon n="search" size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar habilidades, agentes ou tags..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              backgroundColor: "#201B18",
              border: "1px solid #383129",
              borderRadius: 10,
              padding: "10px 14px 10px 40px",
              fontSize: 13.5,
              color: "#F5F2EB",
              outline: "none",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#D97757";
              e.target.style.backgroundColor = "#27211D";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#383129";
              e.target.style.backgroundColor = "#201B18";
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Limpar busca"
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#A39889",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <Icon n="x" size={14} />
            </button>
          )}
        </div>

        {/* Segmented Toggle: Lista Compacta vs Grade Expansiva */}
        <div
          role="group"
          aria-label="Alternar layout do catálogo"
          className="inline-flex items-center bg-[#201B18] border border-[#383129] rounded-[10px] p-1 gap-1 shrink-0 self-end sm:self-auto"
        >
          <button
            type="button"
            onClick={() => handleChangeLayoutMode("list")}
            aria-pressed={layoutMode === "list"}
            aria-label="Visualizar em lista compacta"
            title="Lista compacta"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
              layoutMode === "list"
                ? "bg-[#312720] text-[#D97757] border-[#D97757]/60 shadow-sm"
                : "bg-transparent text-[#A39889] hover:text-[#F5F2EB] border-transparent"
            }`}
          >
            <Icon n="list" size={14} />
            <span>Lista</span>
          </button>

          <button
            type="button"
            onClick={() => handleChangeLayoutMode("grid")}
            aria-pressed={layoutMode === "grid"}
            aria-label="Visualizar em grade expansiva"
            title="Grade expansiva"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
              layoutMode === "grid"
                ? "bg-[#312720] text-[#D97757] border-[#D97757]/60 shadow-sm"
                : "bg-transparent text-[#A39889] hover:text-[#F5F2EB] border-transparent"
            }`}
          >
            <Icon n="grid" size={14} />
            <span>Grade</span>
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
            <Icon n="star" size={14} />
            <span>Exibindo apenas habilidades favoritas ({favoriteCount})</span>
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

      {/* =========================================================================
          AGENT SUITES GRID WITH TOKEN COUNTER & RESPONSIVE CARDS
          ========================================================================= */}
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
      ) : layoutMode === "grid" ? (
        <div
          data-testid="catalog-grid-view"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filteredSuites.map((suite) => {
            const tokenProfile = calculateSkillTokenProfile(suite);

            return (
              <div
                key={suite.id}
                onClick={() => onSelectSuite(suite)}
                className="group bg-[#24201D] hover:bg-[#2C2520] border border-[#362F28] hover:border-[#4D4135] rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all shadow-sm"
              >
                {/* Expansive Cover Header */}
                <div className="relative h-28 w-full bg-[#191613] border-b border-[#362F28] overflow-hidden">
                  {suite.coverTheme?.imageUrl ? (
                    <img
                      src={suite.coverTheme.imageUrl}
                      alt={suite.name}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#D97757]">
                      <Icon n={suite.coverTheme?.icon || "layers"} size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#24201D] via-[#24201D]/35 to-transparent" />

                  {/* Category + Favorite Overlay */}
                  <div
                    className="absolute top-2.5 left-3 right-3 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#191613]/85 border border-[#483E34] text-[#D4CDC3] backdrop-blur-sm">
                      {suite.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => onToggleFavorite(suite.id)}
                      title={suite.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      aria-label={suite.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      style={{
                        background: suite.isFavorite ? "#342C25" : "rgba(25, 22, 19, 0.82)",
                        border: `1px solid ${suite.isFavorite ? "#E09F3E" : "#483E34"}`,
                        color: suite.isFavorite ? "#E09F3E" : "#D4CDC3",
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm cursor-pointer transition-colors"
                    >
                      <Icon n={suite.isFavorite ? "star-filled" : "star"} size={14} />
                    </button>
                  </div>
                </div>

                {/* Expansive Card Body */}
                <div className="p-4 flex-1 flex flex-col gap-2.5 min-w-0">
                  <div>
                    <h3 className="text-[15.5px] font-bold text-[#F5F2EB] m-0 leading-snug">
                      {suite.name}
                    </h3>
                    <div className="text-[11px] text-[#A39889] mt-0.5">
                      Por {suite.author} • {suite.usageCount} execuções
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10.5px] px-2 py-0.5 rounded bg-[#2D2620] border border-[#3E352C] text-[#D4CDC3]">
                      {suite.skills.length} sub-habilidades
                    </span>
                    <span
                      style={{
                        background: "rgba(217, 119, 87, 0.09)",
                        border: `1px solid ${tokenProfile.categoryColor}40`,
                        color: tokenProfile.categoryColor,
                      }}
                      className="text-[10.5px] px-2 py-0.5 rounded font-bold font-mono inline-flex items-center gap-1"
                      title={`Consumo estimado de contexto: ${tokenProfile.totalTokens} tokens (~${tokenProfile.percent128k}% de 128k)`}
                    >
                      <span>⚡ {tokenProfile.formatted}</span>
                    </span>
                  </div>

                  {/* Expanded Description */}
                  <p className="text-[12.5px] text-[#D4CDC3] m-0 leading-relaxed line-clamp-3">
                    {suite.description || suite.tagline}
                  </p>

                  {/* Bundled Skills Pills */}
                  {suite.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {suite.skills.slice(0, 3).map((sub) => (
                        <span
                          key={sub.id}
                          className="text-[10.5px] px-2 py-0.5 rounded-md bg-[#1E1A17] border border-[#383129] text-[#A39889] truncate max-w-full"
                        >
                          {sub.name}
                        </span>
                      ))}
                      {suite.skills.length > 3 && (
                        <span className="text-[10.5px] px-2 py-0.5 rounded-md bg-[#1E1A17] border border-[#383129] text-[#D97757] font-semibold">
                          +{suite.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div
                    className="mt-auto pt-3 border-t border-[#362F28] flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleInstall(suite.id)}
                      style={{
                        background: suite.installed ? "#32231C" : "#2A241F",
                        border: `1px solid ${suite.installed ? "#D97757" : "#423A31"}`,
                        color: suite.installed ? "#D97757" : "#F5F2EB",
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Icon n={suite.installed ? "check" : "plus"} size={12} />
                      <span>{suite.installed ? "Instalada" : "Instalar"}</span>
                    </button>

                    {suite.id === "excalidraw-diagram-generator" && onNavigateDiagramStudio && (
                      <button
                        type="button"
                        onClick={() => onNavigateDiagramStudio(suite.prompts[0])}
                        className="py-1.5 px-3 rounded-lg bg-[#D97757] hover:bg-[#E28768] border border-[#D97757] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Icon n="pen-tool" size={12} />
                        <span>Gerar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onNavigateTest(suite.id)}
                      className="py-1.5 px-3 rounded-lg bg-[#26211D] hover:bg-[#302A24] border border-[#3D352D] text-[#D4CDC3] hover:text-[#F5F2EB] text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Icon n="play" size={12} />
                      <span>Testar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          data-testid="catalog-list-view"
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          {filteredSuites.map((suite) => {
            const tokenProfile = calculateSkillTokenProfile(suite);

            return (
              <div
                key={suite.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "14px 18px",
                  borderRadius: 12,
                  backgroundColor: "#24201D",
                  border: "1px solid #362F28",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  flexWrap: "wrap",
                }}
                onClick={() => onSelectSuite(suite)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#2C2520";
                  e.currentTarget.style.borderColor = "#4D4135";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#24201D";
                  e.currentTarget.style.borderColor = "#362F28";
                }}
              >
                {/* Left: Avatar & Info */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: "1 1 240px" }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      overflow: "hidden",
                      background: suite.coverTheme?.bg || "#1E1A17",
                      border: "1px solid #3D352D",
                      flexShrink: 0,
                      boxShadow: "0 3px 10px rgba(0,0,0,0.45)",
                      position: "relative",
                    }}
                  >
                    {suite.coverTheme?.imageUrl ? (
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
                          color: suite.coverTheme?.accent || "#F5F2EB",
                        }}
                      >
                        <Icon n={suite.coverTheme?.icon || "layers"} size={22} />
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#F5F2EB",
                          margin: 0,
                        }}
                      >
                        {suite.name}
                      </h3>
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "#2D2620",
                          border: "1px solid #3E352C",
                          color: "#A39889",
                        }}
                      >
                        {suite.skills.length} sub-habilidades
                      </span>

                      {/* Token Counter Badge for each skill */}
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(217, 119, 87, 0.09)",
                          border: `1px solid ${tokenProfile.categoryColor}40`,
                          color: tokenProfile.categoryColor,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontFamily: "monospace",
                        }}
                        title={`Consumo estimado de contexto: ${tokenProfile.totalTokens} tokens (~${tokenProfile.percent128k}% de 128k)`}
                      >
                        <span>⚡ {tokenProfile.formatted}</span>
                        <span style={{ fontSize: 9.5, opacity: 0.85 }}>• {tokenProfile.categoryLabel}</span>
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: 12.5,
                        color: "#A39889",
                        margin: "3px 0 5px",
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
                        gap: 10,
                        fontSize: 11,
                        color: "#766B5E",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon n="check-circle" size={11} />
                        <span>Atualizado em {suite.updatedAt}</span>
                      </span>
                      <span>•</span>
                      <span>{suite.usageCount} execuções</span>
                    </div>
                  </div>
                </div>

                {/* Right: Favorite Toggle + Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 0,
                    marginLeft: "auto",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(suite.id)}
                    title={suite.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    style={{
                      background: suite.isFavorite ? "#342C25" : "transparent",
                      border: `1px solid ${suite.isFavorite ? "#8C8172" : "#3D352D"}`,
                      color: suite.isFavorite ? "#F5F2EB" : "#8C8172",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon n="star" size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleInstall(suite.id)}
                    style={{
                      background: suite.installed ? "#32231C" : "#2A241F",
                      border: `1px solid ${suite.installed ? "#D97757" : "#423A31"}`,
                      color: suite.installed ? "#D97757" : "#F5F2EB",
                      padding: "6px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon n={suite.installed ? "check" : "plus"} size={12} />
                    <span>{suite.installed ? "Instalada" : "Instalar"}</span>
                  </button>

                  {suite.id === "excalidraw-diagram-generator" && onNavigateDiagramStudio && (
                    <button
                      type="button"
                      onClick={() => onNavigateDiagramStudio(suite.prompts[0])}
                      style={{
                        background: "#D97757",
                        border: "1px solid #D97757",
                        color: "#FFFFFF",
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Icon n="pen-tool" size={12} />
                      <span>Gerar Diagrama</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onNavigateTest(suite.id)}
                    style={{
                      background: "#26211D",
                      border: "1px solid #3D352D",
                      color: "#D4CDC3",
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#F5F2EB";
                      e.currentTarget.style.borderColor = "#544A3F";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#D4CDC3";
                      e.currentTarget.style.borderColor = "#3D352D";
                    }}
                  >
                    <Icon n="play" size={12} />
                    <span>Testar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
