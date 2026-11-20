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
import { ExcalidrawStudioView } from "./views/ExcalidrawStudioView";
import { PreferencesBackupModal } from "./components/PreferencesBackupModal";
import { applyPreferencesToSuites } from "./utils/preferencesBackup";
import {
  ACCESSIBILITY_STORAGE_KEY,
  AccessibilityContrastMode,
  getAccessibilityToggleMeta,
  parseStoredAccessibilityMode,
  toggleAccessibilityMode,
} from "./utils/accessibilityTheme";
import {
  isEditableEventTarget,
  matchGlobalShortcut,
} from "./utils/keyboardShortcuts";

type MainView =
  | "catalog"
  | "suite-detail"
  | "planned"
  | "create"
  | "test"
  | "global-sync"
  | "mascots"
  | "excalidraw";

export function App() {
  const [suites, setSuites] = useState<AgentSkillSuite[]>(() => {
    try {
      const rawFavs = localStorage.getItem("deda_skills_favorites_suites") ?? localStorage.getItem("dm_skills_favorites_suites");
      const rawInstalled = localStorage.getItem("deda_skills_installed_suites") ?? localStorage.getItem("dm_skills_installed_suites");
      const rawCustom = localStorage.getItem("deda_skills_custom_suites") ?? localStorage.getItem("dm_skills_custom_suites");

      let baseList = AGENT_SUITES;
      if (rawCustom) {
        try {
          const customSuites = JSON.parse(rawCustom) as AgentSkillSuite[];
          baseList = [...customSuites, ...AGENT_SUITES.filter((s) => !customSuites.some((c) => c.id === s.id))];
        } catch (e) {
          console.error("Erro ao carregar habilidades personalizadas:", e);
        }
      }

      const favIds = rawFavs ? new Set<string>(JSON.parse(rawFavs)) : null;
      const installedIds = rawInstalled !== null ? new Set<string>(JSON.parse(rawInstalled)) : null;

      return baseList.map((s) => ({
        ...s,
        isFavorite: favIds !== null ? favIds.has(s.id) : (s.isFavorite ?? false),
        installed: installedIds !== null ? installedIds.has(s.id) : s.installed,
      }));
    } catch (e) {
      console.error("Erro ao inicializar habilidades com LocalStorage:", e);
    }
    return AGENT_SUITES;
  });

  const [currentView, setCurrentView] = useState<MainView>("catalog");
  const [selectedSuite, setSelectedSuite] = useState<AgentSkillSuite | null>(null);
  const [isFavoritesOnly, setIsFavoritesOnly] = useState<boolean>(false);
  const [plannedSkillToCreate, setPlannedSkillToCreate] = useState<PlannedSkillItem | null>(null);
  const [activeTestSkillId, setActiveTestSkillId] = useState<string>("web-design");
  const [activeTestPrompt, setActiveTestPrompt] = useState<string>("");
  const [activeDiagramPrompt, setActiveDiagramPrompt] = useState<string>("");

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Modals for deep inspection (Matching images 1 and 2)
  const [previewSkill, setPreviewSkill] = useState<AgentSkill | null>(null);
  const [detailFileSkill, setDetailFileSkill] = useState<AgentSkill | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [contrastMode, setContrastMode] = useState<AccessibilityContrastMode>(() => {
    try {
      return parseStoredAccessibilityMode(
        localStorage.getItem(ACCESSIBILITY_STORAGE_KEY) ?? localStorage.getItem("dm_skills_accessibility_contrast")
      );
    } catch {
      return "default";
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-accessibility-contrast", contrastMode);
    try {
      localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, contrastMode);
    } catch (e) {
      console.error("Erro ao persistir modo de acessibilidade:", e);
    }
  }, [contrastMode]);

  const handleToggleContrastMode = () => {
    const next = toggleAccessibilityMode(contrastMode);
    setContrastMode(next);
    showToast(
      next === "high"
        ? "Modo de Alto Contraste ativado (fundo preto, texto branco e bordas verde neon)."
        : "Tema Sertão restaurado."
    );
  };

  const handleImportPreferences = (
    installedIds: string[],
    favoriteIds: string[]
  ) => {
    setSuites((prev) => {
      const updated = applyPreferencesToSuites(prev, installedIds, favoriteIds);
      try {
        localStorage.setItem(
          "deda_skills_installed_suites",
          JSON.stringify(updated.filter((s) => s.installed).map((s) => s.id))
        );
        localStorage.setItem(
          "deda_skills_favorites_suites",
          JSON.stringify(updated.filter((s) => s.isFavorite).map((s) => s.id))
        );
      } catch (e) {
        console.error("Erro ao persistir preferências importadas no LocalStorage:", e);
      }
      return updated;
    });

    if (selectedSuite) {
      const installedSet = new Set(installedIds);
      const favoriteSet = new Set(favoriteIds);
      setSelectedSuite((prev) =>
        prev
          ? {
              ...prev,
              installed: installedSet.has(prev.id),
              isFavorite: favoriteSet.has(prev.id),
            }
          : null
      );
    }

    showToast(
      `Preferências restauradas: ${installedIds.length} instalada(s) e ${favoriteIds.length} favorita(s).`
    );
  };

  const toggleInstallSuite = (suiteId: string) => {
    setSuites((prev) => {
      const updated = prev.map((s) => {
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
      });

      try {
        const installedIds = updated.filter((s) => s.installed).map((s) => s.id);
        localStorage.setItem("deda_skills_installed_suites", JSON.stringify(installedIds));
      } catch (e) {
        console.error("Erro ao salvar habilidades instaladas no LocalStorage:", e);
      }

      return updated;
    });

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
        localStorage.setItem("deda_skills_favorites_suites", JSON.stringify(favIds));
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

  const openDiagramStudio = (promptText?: string) => {
    if (typeof promptText === "string") {
      setActiveDiagramPrompt(promptText);
    }
    setCurrentView("excalidraw");
    const query = promptText ? `?prompt=${encodeURIComponent(promptText)}` : "";
    window.location.hash = `#/diagramas${query}`;
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
      } else if (hash.startsWith("diagramas") || hash.startsWith("excalidraw")) {
        setCurrentView("excalidraw");
        setIsFavoritesOnly(false);
        const queryIdx = hash.indexOf("?");
        if (queryIdx !== -1) {
          const params = new URLSearchParams(hash.substring(queryIdx));
          const p = params.get("prompt");
          if (p) setActiveDiagramPrompt(p);
        }
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
    } else if (currentView === "excalidraw") {
      document.title = "Gerador de Diagramas Excalidraw — Deda Skills";
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

  // Gerenciador global de atalhos de teclado: Ctrl+K (Catálogo), Ctrl+D (Diagramas), Ctrl+T (Playground)
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const action = matchGlobalShortcut({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        targetIsContentEditable: isEditableEventTarget(event.target),
      });

      if (!action) return;

      event.preventDefault();
      event.stopPropagation();

      setIsMobileDrawerOpen(false);
      setPreviewSkill(null);
      setDetailFileSkill(null);
      setIsBackupModalOpen(false);

      if (action === "catalog") {
        setIsFavoritesOnly(false);
        setCurrentView("catalog");
        window.location.hash = "#/catalog";
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (action === "excalidraw") {
        setCurrentView("excalidraw");
        window.location.hash = "#/diagramas";
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (action === "test") {
        setCurrentView("test");
        window.location.hash = "#/testar";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleGlobalKeyDown, { capture: true });
  }, []);

  const installedSuites = suites.filter((s) => s.installed);
  const contrastMeta = getAccessibilityToggleMeta(contrastMode);

  // Convert suites to individual AgentSkill list for existing sub-views
  const allIndividualSkills: AgentSkill[] = suites.map((s) => suiteToAgentSkill(s));

  return (
    <div className="shell deda-skills-theme">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="hc-toast"
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#FFFDF9",
            border: "1px solid #CEB79A",
            color: "#2E190F",
            padding: "12px 20px",
            borderRadius: 10,
            boxShadow: "0 12px 28px rgba(46, 25, 15, 0.14)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13.5,
            fontWeight: 500,
          }}
        >
          <Icon n="check-circle" size={18} className="text-[#B44B25]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          MOBILE TOP APP BAR (Pattern 2 from Mobile Guidelines: Touch Friendly)
          ========================================================================= */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#F2E6D5]/95 backdrop-blur-md border-b border-[#E2D1BC] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="w-10 h-10 p-0 rounded-xl bg-[#FFFDF9] hover:bg-[#F6ECE0] text-[#2E190F] border border-[#CEB79A] flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
            aria-label="Abrir Menu de Navegação"
            title="Menu"
          >
            <Icon n="menu" size={19} />
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setCurrentView("catalog");
              window.location.hash = "#/catalog";
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#FFFDF9] border border-[#CEB79A] flex items-center justify-center shrink-0">
              <DedaLogo size={18} color="#C45730" />
            </div>
            <div>
              <div className="text-sm font-black text-[#2E190F] leading-tight">Deda Skills</div>
              <div className="text-[10px] text-[#B44B25] font-bold">Catálogo de Habilidades</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPlannedSkillToCreate(null);
              setCurrentView("create");
              window.location.hash = "#/criar";
            }}
            className="py-1.5 px-3 rounded-xl bg-[#C45730] hover:bg-[#AE4823] text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Icon n="plus" size={13} />
            <span>Criar</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MOBILE NAVIGATION DRAWER OVERLAY (Pattern 3: Touch Friendly Slide-in)
          ========================================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#2E190F]/45 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#F2E6D5] border-r border-[#E2D1BC] p-4 flex flex-col z-10 shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2D1BC] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFFDF9] border border-[#CEB79A] flex items-center justify-center shrink-0">
                  <DedaLogo size={18} color="#C45730" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#2E190F]">Deda Skills</div>
                  <div className="text-[10px] text-[#755B4B]">Navegação Mobile</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-9 h-9 rounded-xl bg-[#FFFDF9] hover:bg-[#F6ECE0] text-[#5A4032] hover:text-[#2E190F] border border-[#CEB79A] flex items-center justify-center cursor-pointer active:scale-95"
                aria-label="Fechar Menu"
              >
                <Icon n="x" size={16} />
              </button>
            </div>

            {/* Navigation links */}
            <div className="space-y-1.5 flex-1">
              <button
                type="button"
                className={`side-nav-btn ${currentView === "catalog" && !isFavoritesOnly ? "active" : ""}`}
                onClick={() => {
                  setIsFavoritesOnly(false);
                  setCurrentView("catalog");
                  window.location.hash = "#/catalog";
                  setIsMobileDrawerOpen(false);
                }}
              >
                <Icon n="layers" size={16} />
                <span>Catálogo de Habilidades ({suites.length})</span>
              </button>

              <button
                type="button"
                className={`side-nav-btn ${currentView === "mascots" ? "active" : ""}`}
                onClick={() => {
                  setCurrentView("mascots");
                  window.location.hash = "#/mascotes";
                  setIsMobileDrawerOpen(false);
                }}
              >
                <Icon n="users" size={16} />
                <div className="flex items-center justify-between w-full">
                  <span>Mascotes Assistentes</span>
                  <span className="text-[10px] bg-[#FFFDF9] px-1.5 py-0.5 rounded-full text-[#2E190F] border border-[#CEB79A] font-semibold">
                    6
                  </span>
                </div>
              </button>

              <button
                type="button"
                className={`side-nav-btn ${currentView === "create" ? "active" : ""}`}
                onClick={() => {
                  setPlannedSkillToCreate(null);
                  setCurrentView("create");
                  window.location.hash = "#/criar";
                  setIsMobileDrawerOpen(false);
                }}
              >
                <Icon n="plus" size={16} className="text-[#B44B25]" />
                <span className="text-[#B44B25] font-bold">Criar Nova Habilidade</span>
              </button>

              <button
                type="button"
                className={`side-nav-btn ${currentView === "test" ? "active" : ""}`}
                onClick={() => {
                  setCurrentView("test");
                  window.location.hash = "#/testar";
                  setIsMobileDrawerOpen(false);
                }}
              >
                <Icon n="play" size={16} />
                <span>Playground de Testes</span>
              </button>

              <button
                type="button"
                className={`side-nav-btn ${currentView === "excalidraw" ? "active" : ""}`}
                onClick={() => {
                  openDiagramStudio();
                  setIsMobileDrawerOpen(false);
                }}
              >
                <Icon n="pen-tool" size={16} />
                <span>Gerador Excalidraw</span>
              </button>

              <button
                type="button"
                className={`side-nav-btn ${currentView === "planned" ? "active" : ""}`}
                onClick={() => {
                  setCurrentView("planned");
                  window.location.hash = "#/planejadas";
                  setIsMobileDrawerOpen(false);
                }}
              >
                <Icon n="calendar" size={16} />
                <span>Próximas Skills & Roadmap</span>
              </button>

              <button
                type="button"
                className={`side-nav-btn ${currentView === "global-sync" ? "active" : ""}`}
                onClick={() => {
                  setCurrentView("global-sync");
                  window.location.hash = "#/global";
                  setIsMobileDrawerOpen(false);
                }}
              >
                <Icon n="terminal" size={16} />
                <span>Ativação Global de Skills</span>
              </button>

              <button
                type="button"
                className="side-nav-btn"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsBackupModalOpen(true);
                }}
              >
                <Icon n="download" size={16} />
                <span>Exportar / Backup JSON</span>
              </button>

              {/* Installed Section in Drawer */}
              <div className="pt-4 mt-2 border-t border-[#E2D1BC]">
                <div className="text-[11px] uppercase tracking-wider text-[#755B4B] font-bold px-2 mb-2">
                  Instalados ({installedSuites.length})
                </div>
                {installedSuites.length === 0 ? (
                  <div className="text-xs text-[#8F7564] px-2 py-1">Nenhuma skill instalada.</div>
                ) : (
                  <div className="space-y-1">
                    {installedSuites.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          openSuiteDetail(s);
                          setIsMobileDrawerOpen(false);
                        }}
                        className="w-full text-left text-xs py-1.5 px-2 rounded-lg hover:bg-[#EAE0D0] text-[#5A4032] hover:text-[#2E190F] truncate flex items-center gap-2 cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C45730]"></span>
                        <span className="truncate">{s.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-[#E2D1BC] mt-auto space-y-2.5">
              <button
                type="button"
                onClick={handleToggleContrastMode}
                aria-pressed={contrastMeta.isHighContrast}
                aria-label={contrastMeta.ariaLabel}
                className={`w-full px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  contrastMeta.isHighContrast
                    ? "bg-[#000000] border-[#00FF66] text-[#00FF66]"
                    : "bg-[#FFFDF9] border-[#CEB79A] text-[#5A4032] hover:text-[#2E190F]"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon n="eye" size={14} />
                  <span>{contrastMeta.label}</span>
                </span>
                <span className="text-[10px] opacity-85">
                  {contrastMeta.isHighContrast ? "ON" : "OFF"}
                </span>
              </button>
              <div className="text-[11px] text-[#755B4B]">Deda Skills v1.0 • Pronta</div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DESKTOP SIDEBAR (Fiel ao design ChatGPT Plugins / Personalizar & Estética Claude)
          ========================================================================= */}
      <nav className="side desktop-side" aria-label="Navegação Deda Skills">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon-wrap" style={{ background: "#FFFDF9", borderColor: "#CEB79A" }}>
            <DedaLogo size={22} color="#C45730" />
          </div>
          <div className="brand-info">
            <div className="brand-title">Deda Skills</div>
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
          title="Abrir Catálogo de Habilidades (Ctrl+K)"
        >
          <Icon n="layers" size={16} />
          <div className="flex items-center justify-between gap-2 w-full min-w-0">
            <span className="truncate">Catálogo de Habilidades ({suites.length})</span>
            <kbd className="shortcut-kbd">Ctrl+K</kbd>
          </div>
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
          <Icon n="plus" size={16} className="text-[#B44B25]" />
          <span className="text-[#B44B25] font-bold">Criar Nova Habilidade</span>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "test" ? "active" : ""}`}
          onClick={() => {
            setCurrentView("test");
            window.location.hash = "#/testar";
          }}
          title="Abrir Playground de Testes (Ctrl+T)"
        >
          <Icon n="play" size={16} />
          <div className="flex items-center justify-between gap-2 w-full min-w-0">
            <span className="truncate">Playground de Testes</span>
            <kbd className="shortcut-kbd">Ctrl+T</kbd>
          </div>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "excalidraw" ? "active" : ""}`}
          onClick={() => openDiagramStudio()}
          title="Abrir Estúdio de Diagramas Excalidraw (Ctrl+D)"
        >
          <Icon n="pen-tool" size={16} />
          <div className="flex items-center justify-between gap-2 w-full min-w-0">
            <span className="truncate">Gerador Excalidraw</span>
            <kbd className="shortcut-kbd">Ctrl+D</kbd>
          </div>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "mascots" ? "active" : ""}`}
          onClick={() => {
            setCurrentView("mascots");
            window.location.hash = "#/mascotes";
          }}
          title="Conheça os 6 mascotes assistentes: Carcará, Lobo-Guará, Tatu-Bola, Ararinha-Azul, Sagui e Onça-Pintada"
        >
          <Icon n="users" size={16} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span>Mascotes Assistentes</span>
            <span style={{ fontSize: 10, background: "#FFFDF9", padding: "1px 6px", borderRadius: 10, color: "#2E190F", border: "1px solid #CEB79A", fontWeight: 700 }}>
              6
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "global-sync" ? "active" : ""}`}
          onClick={() => {
            setCurrentView("global-sync");
            window.location.hash = "#/global";
          }}
        >
          <Icon n="terminal" size={16} />
          <span>Ativação Global de Skills</span>
        </button>

        <button
          type="button"
          className="side-nav-btn"
          onClick={() => setIsBackupModalOpen(true)}
          title="Exportar ou importar preferências de habilidades instaladas e favoritas em JSON"
        >
          <Icon n="download" size={16} />
          <span>Exportar / Backup JSON</span>
        </button>

        {/* Section: Instalados */}
        <div className="side-section-title" style={{ marginTop: 12 }}>
          Instalados ({installedSuites.length})
        </div>

        <div className="side-installed-list">
          {installedSuites.length === 0 ? (
            <div style={{ fontSize: 11.5, color: "#755B4B", padding: "6px 8px" }}>
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
          <button
            type="button"
            data-testid="accessibility-contrast-toggle"
            onClick={handleToggleContrastMode}
            aria-pressed={contrastMeta.isHighContrast}
            aria-label={contrastMeta.ariaLabel}
            className={`w-full mb-3 px-2.5 py-2 rounded-lg border text-left flex items-center justify-between gap-2 cursor-pointer transition-colors ${
              contrastMeta.isHighContrast
                ? "bg-[#000000] border-[#00FF66] text-[#00FF66]"
                : "bg-[#FFFDF9] hover:bg-[#F6ECE0] border-[#CEB79A] text-[#5A4032] hover:text-[#2E190F]"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon
                n="eye"
                size={14}
                className={contrastMeta.isHighContrast ? "text-[#00FF66] shrink-0" : "text-[#C45730] shrink-0"}
              />
              <div className="min-w-0">
                <div className="text-[11.5px] font-semibold leading-tight truncate">
                  {contrastMeta.label}
                </div>
                <div className="text-[10px] opacity-80 leading-tight truncate">
                  {contrastMeta.shortStatus}
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                contrastMeta.isHighContrast
                  ? "border-[#00FF66] text-[#00FF66] bg-[#000000]"
                  : "border-[#CEB79A] text-[#5A4032] bg-[#F2E6D5]"
              }`}
            >
              {contrastMeta.isHighContrast ? "ON" : "OFF"}
            </span>
          </button>
          <div className="side-update">
            <Icon n="check-circle" size={13} className="text-[#C45730]" />
            <span>Deda Skills v1.0 • Pronta</span>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden pb-20 md:pb-8">
        {/* Visualização 1: Detalhe do Agente / Plugin */}
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
            onOpenDiagramStudio={(promptText) => openDiagramStudio(promptText)}
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
            onNavigateDiagramStudio={(promptText) => openDiagramStudio(promptText)}
            onNavigateGlobalSync={() => {
              setCurrentView("global-sync");
              window.location.hash = "#/global";
            }}
            onNavigateMascots={() => {
              setCurrentView("mascots");
              window.location.hash = "#/mascotes";
            }}
            onOpenBackup={() => setIsBackupModalOpen(true)}
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
            onSuccess={(skillOrId) => {
              const skillObj = typeof skillOrId === "object" ? skillOrId : null;
              const skillId = typeof skillOrId === "string" ? skillOrId : skillOrId.id;
              if (skillObj) {
                const newSuite: AgentSkillSuite = {
                  id: skillObj.id,
                  name: skillObj.name,
                  author: skillObj.author || "Deda Skills AI Studio",
                  version: skillObj.version || "1.0.0",
                  updatedAt: "Hoje",
                  usageCount: "1",
                  category: (skillObj.category as AgentSkillSuite["category"]) || "programacao",
                  tagline: skillObj.description,
                  description: skillObj.description,
                  installed: true,
                  isFavorite: false,
                  prompts: skillObj.promptSuggestions || [],
                  skills: [
                    {
                      id: skillObj.id,
                      name: skillObj.name,
                      description: skillObj.description,
                      icon: skillObj.coverTheme?.icon || "code",
                      markdownPath: `skills/${skillObj.id}/SKILL.md`,
                      procedure: skillObj.procedure || [],
                      markdown: skillObj.markdown,
                    },
                  ],
                  coverTheme: skillObj.coverTheme || {
                    bg: "#24201D",
                    accent: "#D97757",
                    icon: "code",
                    subtitle: "Deda Skills • Gerada com IA",
                    imageUrl: skillObj.imageUrl || "/assets/cordel/vibecode.jpg",
                    cordelArt: skillObj.cordelArt || "/assets/cordel/vibecode.jpg",
                  },
                  imageUrl: skillObj.imageUrl || "/assets/cordel/vibecode.jpg",
                  cordelArt: skillObj.cordelArt || "/assets/cordel/vibecode.jpg",
                  files: skillObj.files,
                };
                setSuites((prev) => {
                  const updated = [newSuite, ...prev.filter((s) => s.id !== newSuite.id)];
                  try {
                    const installedIds = updated.filter((s) => s.installed).map((s) => s.id);
                    localStorage.setItem("deda_skills_installed_suites", JSON.stringify(installedIds));
                    const rawCustom = localStorage.getItem("deda_skills_custom_suites") ?? localStorage.getItem("dm_skills_custom_suites");
                    const existingCustom: AgentSkillSuite[] = rawCustom ? JSON.parse(rawCustom) : [];
                    const newCustomList = [newSuite, ...existingCustom.filter((c) => c.id !== newSuite.id)];
                    localStorage.setItem("deda_skills_custom_suites", JSON.stringify(newCustomList));
                  } catch (e) {
                    console.error("Erro ao salvar nova habilidade no LocalStorage:", e);
                  }
                  return updated;
                });
              }
              showToast("Nova habilidade forjada e adicionada ao catálogo!");
              setActiveTestSkillId(skillId);
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

        {/* Visualização 6b: Estúdio Gerador de Diagramas Excalidraw */}
        {currentView === "excalidraw" && (
          <ExcalidrawStudioView
            initialPrompt={activeDiagramPrompt}
            onBackToCatalog={() => {
              setCurrentView("catalog");
              window.location.hash = "#/catalog";
            }}
          />
        )}

        {/* Visualização 7: 6 Mascotes Assistentes (Inspirado em Cue Bot & Grok Bot) */}
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

      {/* Modal 2: Detalhes e Arquivos de Código da Habilidade */}
      <SkillFileDetailModal
        skill={detailFileSkill}
        onClose={() => setDetailFileSkill(null)}
        onBack={() => {
          if (detailFileSkill) setPreviewSkill(detailFileSkill);
          setDetailFileSkill(null);
        }}
      />

      {/* Modal 3: Exportar & Migrar Preferências (JSON) */}
      <PreferencesBackupModal
        isOpen={isBackupModalOpen}
        suites={suites}
        onClose={() => setIsBackupModalOpen(false)}
        onImportPreferences={(installedIds, favoriteIds) =>
          handleImportPreferences(installedIds, favoriteIds)
        }
        onExportSuccess={(filename) =>
          showToast(`Backup JSON exportado: ${filename}`)
        }
      />

      {/* =========================================================================
          MOBILE BOTTOM TAB BAR (Pattern 1 from Mobile Guidelines: Thumb Ergonomics)
          ========================================================================= */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-lg border-t border-[#E2D1BC] grid grid-cols-5 items-center h-16 px-1 shadow-[0_-4px_20px_rgba(46,25,15,0.08)]"
        aria-label="Navegação Rápida Mobile"
      >
        <button
          type="button"
          onClick={() => {
            setIsFavoritesOnly(false);
            setCurrentView("catalog");
            window.location.hash = "#/catalog";
          }}
          className={`flex flex-col items-center justify-center py-1 bg-transparent border-0 transition-colors cursor-pointer ${
            currentView === "catalog" ? "text-[#B44B25]" : "text-[#755B4B] hover:text-[#2E190F]"
          }`}
        >
          <Icon n="layers" size={19} />
          <span className="text-[10px] font-semibold mt-1">Catálogo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentView("mascots");
            window.location.hash = "#/mascotes";
          }}
          className={`flex flex-col items-center justify-center py-1 bg-transparent border-0 transition-colors cursor-pointer ${
            currentView === "mascots" ? "text-[#B44B25]" : "text-[#755B4B] hover:text-[#2E190F]"
          }`}
        >
          <Icon n="users" size={19} />
          <span className="text-[10px] font-semibold mt-1">Mascotes</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPlannedSkillToCreate(null);
            setCurrentView("create");
            window.location.hash = "#/criar";
          }}
          className="flex flex-col items-center justify-center -mt-4 p-0 bg-transparent border-0 cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-[#C45730] text-[#FFFFFF] flex items-center justify-center shadow-[0_4px_16px_rgba(196,87,48,0.35)] border-2 border-[#FFFDF9] active:scale-95 transition-transform">
            <Icon n="plus" size={20} />
          </div>
          <span className="text-[10px] font-bold text-[#B44B25] mt-0.5">Criar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentView("test");
            window.location.hash = "#/testar";
          }}
          className={`flex flex-col items-center justify-center py-1 bg-transparent border-0 transition-colors cursor-pointer ${
            currentView === "test" ? "text-[#B44B25]" : "text-[#755B4B] hover:text-[#2E190F]"
          }`}
        >
          <Icon n="play" size={19} />
          <span className="text-[10px] font-semibold mt-1">Testar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentView("planned");
            window.location.hash = "#/planejadas";
          }}
          className={`flex flex-col items-center justify-center py-1 bg-transparent border-0 transition-colors cursor-pointer ${
            currentView === "planned" ? "text-[#B44B25]" : "text-[#755B4B] hover:text-[#2E190F]"
          }`}
        >
          <Icon n="calendar" size={19} />
          <span className="text-[10px] font-semibold mt-1">Roadmap</span>
        </button>
      </nav>
    </div>
  );
}
