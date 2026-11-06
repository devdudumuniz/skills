import { useState, useEffect } from "react";
import { AGENT_SUITES, suiteToAgentSkill } from "../skills/data";
import { AgentSkillSuite, AgentSkill, BundledSkill } from "../skills/types";
import { Icon } from "./components/Icons";
import { DedaLogo } from "./components/DedaLogo";
import { SkillStoreView } from "../skills/components/SkillStoreView";
import { AgentSuiteDetailView } from "../skills/components/AgentSuiteDetailView";
import { CreateSkillView } from "./views/CreateSkillView";
import { SkillTestPlayground } from "./views/SkillTestPlayground";
import { SkillPreviewModal } from "./components/SkillPreviewModal";
import { SkillFileDetailModal } from "./components/SkillFileDetailModal";
import { PlannedSkillsView, PlannedSkillItem } from "./views/PlannedSkillsView";
import { GlobalAgentSyncView } from "./views/GlobalAgentSyncView";
import { MascotAgentsView } from "./views/MascotAgentsView";

type MainView = "catalog" | "suite-detail" | "planned" | "create" | "test" | "global-sync" | "mascots";

export function App() {
  const [suites, setSuites] = useState<AgentSkillSuite[]>(() => {
    try {
      const rawFavs = localStorage.getItem("dm_skills_favorites_suites");
      if (rawFavs) {
        const favIds = new Set<string>(JSON.parse(rawFavs));
        return AGENT_SUITES.map((s) => ({
          ...s,
          isFavorite: favIds.has(s.id),
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return AGENT_SUITES;
  });

  const [currentView, setCurrentView] = useState<MainView>("catalog");
  const [selectedSuite, setSelectedSuite] = useState<AgentSkillSuite | null>(null);
  const [isFavoritesOnly, setIsFavoritesOnly] = useState<boolean>(false);
  const [plannedSkillToCreate, setPlannedSkillToCreate] = useState<PlannedSkillItem | null>(null);
  const [activeTestSkillId, setActiveTestSkillId] = useState<string>("web-design");
  const [activeTestPrompt, setActiveTestPrompt] = useState<string>("");

  // Modals for deep inspection (Matching images 1 and 2)
  const [previewSkill, setPreviewSkill] = useState<AgentSkill | null>(null);
  const [detailFileSkill, setDetailFileSkill] = useState<AgentSkill | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleInstallSuite = (suiteId: string) => {
    setSuites((prev) =>
      prev.map((s) => {
        if (s.id === suiteId) {
          const next = !s.installed;
          showToast(
            next
              ? `Habilidade '${s.name}' adicionada às suas habilidades!`
              : `Habilidade '${s.name}' removida.`
          );
          return { ...s, installed: next };
        }
        return s;
      })
    );
    if (selectedSuite && selectedSuite.id === suiteId) {
      setSelectedSuite((prev) => (prev ? { ...prev, installed: !prev.installed } : null));
    }
  };

  const toggleFavoriteSuite = (suiteId: string) => {
    setSuites((prev) => {
      const updated = prev.map((s) => {
        if (s.id === suiteId) {
          const next = !s.isFavorite;
          showToast(
            next
              ? `Habilidade '${s.name}' salva nos favoritos!`
              : `Habilidade '${s.name}' removida dos favoritos.`
          );
          return { ...s, isFavorite: next };
        }
        return s;
      });
      try {
        const favIds = updated.filter((s) => s.isFavorite).map((s) => s.id);
        localStorage.setItem("dm_skills_favorites_suites", JSON.stringify(favIds));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    if (selectedSuite && selectedSuite.id === suiteId) {
      setSelectedSuite((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const openSuiteDetail = (suite: AgentSkillSuite) => {
    setSelectedSuite(suite);
    setCurrentView("suite-detail");
    window.location.hash = `#/suite/${suite.id}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openTestPrompt = (suiteId: string, promptText: string) => {
    setActiveTestSkillId(suiteId);
    setActiveTestPrompt(promptText);
    setCurrentView("test");
    window.location.hash = `#/testar?skill=${encodeURIComponent(suiteId)}&prompt=${encodeURIComponent(promptText)}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInspectFiles = (suite: AgentSkillSuite, skill?: BundledSkill) => {
    const baseSkill = suiteToAgentSkill(suite);
    if (skill) {
      setDetailFileSkill({
        ...baseSkill,
        name: `${suite.name}: ${skill.name}`,
        description: skill.description,
        procedure: skill.procedure,
      });
    } else {
      setDetailFileSkill(baseSkill);
    }
  };

  // Sync hash with views
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (hash.startsWith("suite/")) {
        const suiteId = hash.replace("suite/", "").split("?")[0];
        const match = suites.find((s) => s.id === suiteId);
        if (match) {
          setSelectedSuite(match);
          setCurrentView("suite-detail");
          setIsFavoritesOnly(false);
          return;
        }
      }

      if (hash.startsWith("criar")) {
        setCurrentView("create");
        setIsFavoritesOnly(false);
      } else if (hash.startsWith("planejadas") || hash.startsWith("proximas")) {
        setCurrentView("planned");
        setIsFavoritesOnly(false);
      } else if (hash.startsWith("global") || hash.startsWith("sincronizar") || hash.startsWith("agentes")) {
        setCurrentView("global-sync");
        setIsFavoritesOnly(false);
      } else if (hash.startsWith("mascotes") || hash.startsWith("mascote") || hash.startsWith("assistentes")) {
        setCurrentView("mascots");
        setIsFavoritesOnly(false);
      } else if (hash.startsWith("favoritas") || hash.startsWith("favoritos")) {
        setCurrentView("catalog");
        setIsFavoritesOnly(true);
      } else if (hash.startsWith("testar")) {
        setCurrentView("test");
        setIsFavoritesOnly(false);
        const queryIdx = hash.indexOf("?");
        if (queryIdx !== -1) {
          const params = new URLSearchParams(hash.substring(queryIdx));
          const skId = params.get("skill");
          const p = params.get("prompt");
          if (skId) setActiveTestSkillId(skId);
          if (p) setActiveTestPrompt(p);
        }
      } else {
        setCurrentView("catalog");
        setIsFavoritesOnly(hash.includes("favoritas=true"));
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [suites]);

  // Document Title
  useEffect(() => {
    if (currentView === "suite-detail" && selectedSuite) {
      document.title = `${selectedSuite.name} — Deda Skills`;
    } else if (currentView === "create") {
      document.title = "Criar Nova Habilidade — Deda Skills";
    } else if (currentView === "planned") {
      document.title = "Próximas Skills & Roadmap — Deda Skills";
    } else if (currentView === "test") {
      document.title = "Playground de Testes — Deda Skills";
    } else if (currentView === "global-sync") {
      document.title = "Ativação Global de Skills — Deda Skills";
    } else if (currentView === "mascots") {
      document.title = "Mascotes Assistentes — Deda Skills";
    } else if (isFavoritesOnly) {
      document.title = "Habilidades Favoritas — Deda Skills";
    } else {
      document.title = "Deda Skills — Catálogo & Estúdio de Habilidades de IA";
    }
  }, [currentView, selectedSuite, isFavoritesOnly]);

  const installedSuites = suites.filter((s) => s.installed);
  const favoriteCount = suites.filter((s) => s.isFavorite).length;

  // Convert suites to individual AgentSkill list for existing sub-views
  const allIndividualSkills: AgentSkill[] = suites.map((s) => suiteToAgentSkill(s));

  return (
    <div className="shell dm-skills-theme">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#202020",
            border: "1px solid #545454",
            color: "#EAEAEA",
            padding: "12px 20px",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.8)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13.5,
          }}
        >
          <Icon n="check-circle" size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar de Navegação (Fiel ao design ChatGPT Plugins / Personalizar) */}
      <nav className="side" aria-label="Navegação Deda Skills">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon-wrap" style={{ background: "#202020", borderColor: "#3d3d3d" }}>
            <DedaLogo size={22} color="#EAEAEA" />
          </div>
          <div className="brand-info">
            <div className="brand-title">Deda Skills</div>
            <div className="brand-subtitle">Catálogo & Estúdio de Agentes</div>
          </div>
        </div>

        {/* Section: Personalizar */}
        <div className="side-section-title">Personalizar</div>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "catalog" && !isFavoritesOnly ? "active" : ""}`}
          onClick={() => {
            setIsFavoritesOnly(false);
            setCurrentView("catalog");
            window.location.hash = "#/catalog";
          }}
        >
          <Icon n="layers" size={16} />
          <span>Catálogo de Habilidades ({suites.length})</span>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "catalog" && isFavoritesOnly ? "active" : ""}`}
          onClick={() => {
            setIsFavoritesOnly(true);
            setCurrentView("catalog");
            window.location.hash = "#/favoritas";
          }}
        >
          <Icon n="star" size={16} />
          <span>Favoritas ({favoriteCount})</span>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "planned" ? "active" : ""}`}
          onClick={() => {
            setCurrentView("planned");
            window.location.hash = "#/planejadas";
          }}
        >
          <Icon n="calendar" size={16} />
          <span>Próximas Skills & Roadmap</span>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "create" ? "active" : ""}`}
          onClick={() => {
            setPlannedSkillToCreate(null);
            setCurrentView("create");
            window.location.hash = "#/criar";
          }}
        >
          <Icon n="plus" size={16} />
          <span>Criar Nova Habilidade</span>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "test" ? "active" : ""}`}
          onClick={() => {
            setCurrentView("test");
            window.location.hash = "#/testar";
          }}
        >
          <Icon n="play" size={16} />
          <span>Playground de Testes</span>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "mascots" ? "active" : ""}`}
          onClick={() => {
            setCurrentView("mascots");
            window.location.hash = "#/mascotes";
          }}
          title="Conheça os 4 mascotes assistentes: Carcará, Lobo-Guará, Tatu-Bola e Ararinha-Azul"
        >
          <Icon n="users" size={16} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span>Mascotes Assistentes</span>
            <span style={{ fontSize: 10, background: "#2e2e2e", padding: "1px 6px", borderRadius: 10, color: "#EAEAEA", border: "1px solid #3d3d3d" }}>
              4
            </span>
          </div>
        </button>

        <div className="side-section-title" style={{ marginTop: 10 }}>
          Agentes & Sistema
        </div>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "global-sync" ? "active" : ""}`}
          onClick={() => {
            setCurrentView("global-sync");
            window.location.hash = "#/global";
          }}
          title="Ativar todas as skills globalmente para Claude Code, Codex, Manus e outros agentes"
        >
          <Icon n="terminal" size={16} />
          <span>Ativação Global de Skills</span>
        </button>

        {/* Section: Instalados (Matching user's ChatGPT Plugins screenshot) */}
        <div className="side-section-title" style={{ marginTop: 12 }}>
          Instalados ({installedSuites.length})
        </div>

        <div className="side-installed-list">
          {installedSuites.length === 0 ? (
            <div style={{ fontSize: 11.5, color: "#767676", padding: "6px 8px" }}>
              Nenhum agente instalado ainda.
            </div>
          ) : (
            installedSuites.map((suite) => {
              const isCurrent = currentView === "suite-detail" && selectedSuite?.id === suite.id;
              return (
                <button
                  key={suite.id}
                  type="button"
                  className={`side-installed-item ${isCurrent ? "active" : ""}`}
                  onClick={() => openSuiteDetail(suite)}
                  title={suite.name}
                >
                  <div className="side-installed-avatar" style={{ overflow: "hidden" }}>
                    {suite.coverTheme.imageUrl ? (
                      <img
                        src={suite.coverTheme.imageUrl}
                        alt={suite.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: "contrast(115%)",
                        }}
                      />
                    ) : (
                      <Icon n={suite.coverTheme.icon || "layers"} size={13} />
                    )}
                  </div>
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {suite.name}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Side Footer */}
        <div className="side-foot">
          <p className="side-note">
            Repositório oficial Deda Skills: catálogo, testes, empacotamento e ativação global de habilidades para Agentes autônomos.
          </p>
          <div className="side-update">
            <Icon n="check-circle" size={13} />
            <span>Deda Skills v2.4 • Pronta</span>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main>
        {/* Visualização 1: Detalhe do Agente / Plugin (Matching screencapture-chatgpt-plugins...) */}
        {currentView === "suite-detail" && selectedSuite && (
          <AgentSuiteDetailView
            suite={selectedSuite}
            onBackToCatalog={() => {
              setCurrentView("catalog");
              window.location.hash = "#/catalog";
            }}
            onToggleInstall={toggleInstallSuite}
            onToggleFavorite={toggleFavoriteSuite}
            onTestPrompt={(suiteId, promptText) => openTestPrompt(suiteId, promptText)}
            onInspectSkillFiles={(suite, skill) => handleInspectFiles(suite, skill)}
          />
        )}

        {/* Visualização 2: Loja e Catálogo de Habilidades (Matching image_6bbb1f03.png) */}
        {currentView === "catalog" && (
          <SkillStoreView
            suites={suites}
            onlyFavorites={isFavoritesOnly}
            onClearFavoritesFilter={() => {
              setIsFavoritesOnly(false);
              window.location.hash = "#/catalog";
            }}
            onToggleFavorite={toggleFavoriteSuite}
            onToggleInstall={toggleInstallSuite}
            onSelectSuite={openSuiteDetail}
            onNavigateCreate={() => {
              setPlannedSkillToCreate(null);
              setCurrentView("create");
              window.location.hash = "#/criar";
            }}
            onNavigatePlanned={() => {
              setCurrentView("planned");
              window.location.hash = "#/planejadas";
            }}
            onNavigateTest={(suiteId) => {
              if (suiteId) setActiveTestSkillId(suiteId);
              setCurrentView("test");
              window.location.hash = `#/testar${suiteId ? `?skill=${suiteId}` : ""}`;
            }}
            onNavigateGlobalSync={() => {
              setCurrentView("global-sync");
              window.location.hash = "#/global";
            }}
            onNavigateMascots={() => {
              setCurrentView("mascots");
              window.location.hash = "#/mascotes";
            }}
          />
        )}

        {/* Visualização 3: Próximas Skills & Contribuição (Roadmap) */}
        {currentView === "planned" && (
          <PlannedSkillsView
            onSelectPlannedSkill={(planned) => {
              setPlannedSkillToCreate(planned);
              setCurrentView("create");
              window.location.hash = "#/criar";
            }}
            onBackToLab={() => {
              setCurrentView("catalog");
              window.location.hash = "#/catalog";
            }}
          />
        )}

        {/* Visualização 4: Ativação Global de Skills para Todos os Agentes */}
        {currentView === "global-sync" && (
          <GlobalAgentSyncView
            skills={allIndividualSkills}
            onSelectSkill={(skill) => setPreviewSkill(skill)}
            onBackToCatalog={() => {
              setCurrentView("catalog");
              window.location.hash = "#/catalog";
            }}
          />
        )}

        {/* Visualização 5: Formulário de Criação de Habilidade */}
        {currentView === "create" && (
          <CreateSkillView
            initialData={plannedSkillToCreate}
            onSuccess={(newSkillId) => {
              showToast("Nova habilidade criada com sucesso no catálogo!");
              setActiveTestSkillId(newSkillId);
              setPlannedSkillToCreate(null);
              setCurrentView("catalog");
              window.location.hash = "#/catalog";
            }}
            onCancel={() => {
              setPlannedSkillToCreate(null);
              setCurrentView("catalog");
              window.location.hash = "#/catalog";
            }}
          />
        )}

        {/* Visualização 6: Playground de Testes */}
        {currentView === "test" && (
          <SkillTestPlayground
            initialSkillId={activeTestSkillId}
            initialPrompt={activeTestPrompt}
          />
        )}

        {/* Visualização 7: 4 Mascotes Assistentes (Inspirado em Cue Bot & Grok Bot) */}
        {currentView === "mascots" && (
          <MascotAgentsView
            onTestPrompt={(skillId, prompt) => openTestPrompt(skillId, prompt)}
            onNavigateGlobalSync={() => {
              setCurrentView("global-sync");
              window.location.hash = "#/global";
            }}
            onBackToCatalog={() => {
              setCurrentView("catalog");
              window.location.hash = "#/catalog";
            }}
          />
        )}
      </main>

      {/* Modal 1: Prévia da Habilidade (Matching image_c938581a.png) */}
      <SkillPreviewModal
        skill={previewSkill}
        onClose={() => setPreviewSkill(null)}
        onOpenDetails={(skill) => {
          setDetailFileSkill(skill);
          setPreviewSkill(null);
        }}
        onToggleFavorite={(skillId) => {
          toggleFavoriteSuite(skillId);
          setPreviewSkill((prev) => (prev && prev.id === skillId ? { ...prev, isFavorite: !prev.isFavorite } : prev));
        }}
        onToggleInstall={(skillId) => {
          toggleInstallSuite(skillId);
          setPreviewSkill((prev) => (prev && prev.id === skillId ? { ...prev, installed: !prev.installed } : prev));
        }}
        onTestPrompt={(skillId, prompt) => {
          setPreviewSkill(null);
          openTestPrompt(skillId, prompt);
        }}
      />

      {/* Modal 2: Detalhes e Arquivos de Código da Habilidade (Matching image_355289d7.png) */}
      <SkillFileDetailModal
        skill={detailFileSkill}
        onClose={() => setDetailFileSkill(null)}
        onBack={() => {
          if (detailFileSkill) setPreviewSkill(detailFileSkill);
          setDetailFileSkill(null);
        }}
      />
    </div>
  );
}
