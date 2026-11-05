import { useState, useEffect } from "react";
import { useProject } from "./context/ProjectContext";
import { Icon } from "./components/Icons";
import { SkillsStoreView } from "./views/SkillsStoreView";
import { CreateSkillView } from "./views/CreateSkillView";
import { SkillTestPlayground } from "./views/SkillTestPlayground";
import { SkillPreviewModal } from "./components/SkillPreviewModal";
import { SkillFileDetailModal } from "./components/SkillFileDetailModal";
import { OverviewView } from "./views/OverviewView";
import { PlanningView } from "./views/PlanningView";
import { TasksView } from "./views/TasksView";
import { ProcessesView } from "./views/ProcessesView";
import { BeforeAfterView } from "./views/BeforeAfterView";
import { EvolutionView } from "./views/EvolutionView";
import { HistoryView } from "./views/HistoryView";
import { ReportsView } from "./views/ReportsView";
import { ReportModal } from "./components/ReportModal";
import { PlannedSkillsView, PlannedSkillItem } from "./views/PlannedSkillsView";
import { fmt } from "./components/UIPrimitives";
import { AgentSkill, ReportItem } from "./types";

type MainView = "skills-lab" | "planned-skills" | "create-skill" | "test-playground" | "status-portal-demo";

const PORTAL_TABS = [
  { id: "visao", label: "Visão geral", icon: "home" as const },
  { id: "planejamento", label: "Fases e planejamento", icon: "list" as const },
  { id: "tarefas", label: "Tarefas", icon: "check-square" as const },
  { id: "processos", label: "Processos e capacidades", icon: "layers" as const },
  { id: "antes-agora", label: "Antes × agora", icon: "swap" as const },
  { id: "evolucao", label: "Evolução e achados", icon: "trend" as const },
  { id: "historico", label: "Histórico", icon: "history" as const },
  { id: "relatorios", label: "Relatórios", icon: "file" as const },
];

export function App() {
  const {
    role,
    setRole,
    overview,
    skills,
    toggleInstallSkill,
    activeTestSkillId,
    setActiveTestSkillId,
  } = useProject();

  const [currentView, setCurrentView] = useState<MainView>("skills-lab");
  const [plannedSkillToCreate, setPlannedSkillToCreate] = useState<PlannedSkillItem | null>(null);
  
  // Modals matching images 2 and 3
  const [previewSkill, setPreviewSkill] = useState<AgentSkill | null>(null);
  const [detailFileSkill, setDetailFileSkill] = useState<AgentSkill | null>(null);

  const [portalTab, setPortalTab] = useState<string>("visao");
  const [tabExtra, setTabExtra] = useState<Record<string, string>>({});
  const [activeReport, setActiveReport] = useState<ReportItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync hash with views
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (hash.startsWith("criar")) {
        setCurrentView("create-skill");
      } else if (hash.startsWith("planejadas") || hash.startsWith("proximas")) {
        setCurrentView("planned-skills");
      } else if (hash.startsWith("testar")) {
        setCurrentView("test-playground");
        const queryIdx = hash.indexOf("?");
        if (queryIdx !== -1) {
          const params = new URLSearchParams(hash.substring(queryIdx));
          const skId = params.get("skill");
          if (skId) setActiveTestSkillId(skId);
        }
      } else if (hash.startsWith("demo-status-portal")) {
        setCurrentView("status-portal-demo");
        const queryIdx = hash.indexOf("?");
        if (queryIdx !== -1) {
          const params = new URLSearchParams(hash.substring(queryIdx));
          const t = params.get("tab");
          if (t) setPortalTab(t);
        }
      } else {
        setCurrentView("skills-lab");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [setActiveTestSkillId]);

  useEffect(() => {
    if (currentView === "create-skill") {
      document.title = "Criar Nova Habilidade — Laboratório de Skills";
    } else if (currentView === "planned-skills") {
      document.title = "Próximas Skills & Contribuição — Roadmap de Agentes";
    } else if (currentView === "test-playground") {
      document.title = "Playground de Testes — Laboratório de Skills";
    } else if (currentView === "status-portal-demo") {
      document.title = `${overview.project.title} — Demonstração da Skill Status Portal`;
    } else {
      document.title = "Laboratório de Habilidades para Agentes de IA";
    }
  }, [currentView, overview.project.title]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const navigateToView = (view: MainView, hashParams = "") => {
    setCurrentView(view);
    const hash =
      view === "create-skill"
        ? "#/criar"
        : view === "planned-skills"
        ? "#/planejadas"
        : view === "test-playground"
        ? `#/testar${hashParams ? `?${hashParams}` : ""}`
        : view === "status-portal-demo"
        ? `#/demo-status-portal${hashParams ? `?${hashParams}` : ""}`
        : "#/skills";

    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigatePortalTab = (tab: string, extra: Record<string, string> = {}) => {
    setPortalTab(tab);
    setTabExtra(extra);
    const qs = new URLSearchParams({ tab, ...extra }).toString();
    window.location.hash = `#/demo-status-portal?${qs}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="shell client portal-theme">
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

      {/* Sidebar de Navegação */}
      <nav className="side" aria-label="Navegação do Laboratório">
        <div className="brand brand-portal">
          <Icon n="beaker" size={26} />
          <div>
            Laboratório de Skills
            <span>Hub & Estúdio de Agentes de IA</span>
          </div>
        </div>

        <div className="side-section-title">Laboratório</div>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "skills-lab" ? "active" : ""}`}
          onClick={() => navigateToView("skills-lab")}
        >
          <Icon n="layers" size={16} />
          <span>Explorar Habilidades ({skills.length})</span>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "planned-skills" ? "active" : ""}`}
          onClick={() => navigateToView("planned-skills")}
        >
          <Icon n="calendar" size={16} />
          <span>Próximas Skills & Roadmap</span>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "create-skill" ? "active" : ""}`}
          onClick={() => {
            setPlannedSkillToCreate(null);
            navigateToView("create-skill");
          }}
        >
          <Icon n="gear" size={16} />
          <span>Criar Nova Habilidade</span>
        </button>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "test-playground" ? "active" : ""}`}
          onClick={() => navigateToView("test-playground")}
        >
          <Icon n="play" size={16} />
          <span>Playground de Testes</span>
        </button>

        <div className="side-section-title" style={{ marginTop: 14 }}>
          Demonstração de Skill
        </div>

        <button
          type="button"
          className={`side-nav-btn ${currentView === "status-portal-demo" ? "active" : ""}`}
          onClick={() => navigateToView("status-portal-demo")}
          title="Ver o Status Portal em execução como exemplo vivo de uma skill"
        >
          <Icon n="chart" size={16} />
          <span>Demo: Status Portal</span>
        </button>

        {/* Perfil / Role Toggle (visível quando na demo) */}
        {currentView === "status-portal-demo" && (
          <div style={{ marginTop: 10, padding: "0 8px" }}>
            <div className="faint" style={{ fontSize: 11, marginBottom: 4 }}>
              Papel na Demo do Portal:
            </div>
            <div className="role-toggle-bar" style={{ margin: 0 }}>
              <button
                type="button"
                className={`role-btn ${role === "CLIENT_VIEWER" ? "active" : ""}`}
                onClick={() => setRole("CLIENT_VIEWER")}
              >
                Cliente
              </button>
              <button
                type="button"
                className={`role-btn ${role === "ADMIN" ? "active" : ""}`}
                onClick={() => setRole("ADMIN")}
              >
                Admin
              </button>
            </div>
          </div>
        )}

        <p className="side-note">
          {currentView === "status-portal-demo"
            ? "Exibindo a demonstração da skill status-portal com backlog e timeline de projeto real."
            : "Laboratório aberto para engenharia, catálogo, teste e publicação de habilidades para Agentes autônomos."}
        </p>

        <div className="side-foot">
          <div className="side-update">
            <Icon n="clock" size={14} />
            <span>
              Laboratório Atualizado
              <br />
              <b>{fmt(overview.last_update)}</b>
            </span>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main style={{ minHeight: "100vh", backgroundColor: "#151515" }}>
        {/* Visualização Principal: Loja e Catálogo de Habilidades (Matching image_6bbb1f03.png) */}
        {currentView === "skills-lab" && (
          <SkillsStoreView
            skills={skills}
            onSelectSkill={(skill) => setPreviewSkill(skill)}
            onToggleInstall={(skillId) => {
              toggleInstallSkill(skillId);
              const target = skills.find((s) => s.id === skillId);
              if (target) {
                showToast(
                  target.installed
                    ? `Skill '${target.name}' removida das suas habilidades.`
                    : `Skill '${target.name}' adicionada com sucesso!`
                );
              }
            }}
            onNavigateCreate={() => {
              setPlannedSkillToCreate(null);
              navigateToView("create-skill");
            }}
            onNavigatePlanned={() => navigateToView("planned-skills")}
            onNavigateTest={(skillId) => {
              if (skillId) setActiveTestSkillId(skillId);
              navigateToView("test-playground", skillId ? `skill=${skillId}` : "");
            }}
            onOpenStatusPortalDemo={() => navigateToView("status-portal-demo")}
          />
        )}

        {/* Visualização: Próximas Skills & Contribuição (Roadmap) */}
        {currentView === "planned-skills" && (
          <PlannedSkillsView
            onSelectPlannedSkill={(planned) => {
              setPlannedSkillToCreate(planned);
              navigateToView("create-skill");
            }}
            onBackToLab={() => navigateToView("skills-lab")}
          />
        )}

        {/* Visualização: Formulário de Criação de Habilidade */}
        {currentView === "create-skill" && (
          <CreateSkillView
            initialData={plannedSkillToCreate}
            onSuccess={(newSkillId) => {
              showToast("Nova habilidade salva com sucesso no laboratório!");
              setActiveTestSkillId(newSkillId);
              setPlannedSkillToCreate(null);
              navigateToView("skills-lab");
            }}
            onCancel={() => {
              setPlannedSkillToCreate(null);
              navigateToView("skills-lab");
            }}
          />
        )}

        {/* Visualização: Playground de Testes */}
        {currentView === "test-playground" && (
          <SkillTestPlayground initialSkillId={activeTestSkillId} />
        )}

        {/* Visualização: Demo Interativa da Skill Status Portal */}
        {currentView === "status-portal-demo" && (
          <div className="portal portal-theme" style={{ padding: "20px 24px" }}>
            {/* Banner explicativo de que isto é a demo da skill */}
            <div
              style={{
                background: "#202020",
                border: "1px solid #545454",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="badge info">Demonstração da Skill</span>
                <span style={{ fontSize: 13, color: "var(--ink)" }}>
                  Você está visualizando a demonstração ao vivo da skill <b>status-portal</b> (Acompanhamento Executivo de Projeto).
                </span>
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => navigateToView("skills-lab")}
                style={{ fontSize: 12, padding: "4px 10px" }}
              >
                Voltar ao Catálogo de Skills
              </button>
            </div>

            {/* Abas do Acompanhamento do Projeto */}
            <nav className="tabs" aria-label="Seções do acompanhamento">
              {PORTAL_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={portalTab === t.id ? "tab active" : "tab"}
                  aria-current={portalTab === t.id ? "page" : undefined}
                  onClick={() => navigatePortalTab(t.id)}
                >
                  <Icon n={t.icon} size={15} />
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Renderização da Aba Selecionada */}
            {portalTab === "visao" && (
              <OverviewView
                onNavigate={navigatePortalTab}
                onOpenReport={(r) => setActiveReport(r)}
              />
            )}

            {portalTab === "planejamento" && (
              <PlanningView onNavigate={navigatePortalTab} />
            )}

            {portalTab === "tarefas" && (
              <TasksView
                initialTab={tabExtra.tarefas ?? "todas"}
                focusTaskId={tabExtra.task}
              />
            )}

            {portalTab === "processos" && <ProcessesView />}

            {portalTab === "antes-agora" && <BeforeAfterView />}

            {portalTab === "evolucao" && <EvolutionView />}

            {portalTab === "historico" && <HistoryView />}

            {portalTab === "relatorios" && (
              <ReportsView onOpenReport={(r) => setActiveReport(r)} />
            )}
          </div>
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
        onToggleInstall={(skillId) => {
          toggleInstallSkill(skillId);
          // Update previewSkill instance state so button toggles live
          setPreviewSkill((prev) => (prev && prev.id === skillId ? { ...prev, installed: !prev.installed } : prev));
          const target = skills.find((s) => s.id === skillId);
          if (target) {
            showToast(
              target.installed
                ? `Skill removida das suas habilidades.`
                : `Skill adicionada às suas habilidades!`
            );
          }
        }}
        onTestPrompt={(skillId, prompt) => {
          setActiveTestSkillId(skillId);
          setPreviewSkill(null);
          navigateToView("test-playground", `skill=${skillId}&prompt=${encodeURIComponent(prompt)}`);
        }}
      />

      {/* Modal 2: Detalhes e Arquivos de Código da Habilidade (Matching image_355289d7.png) */}
      <SkillFileDetailModal
        skill={detailFileSkill}
        onClose={() => setDetailFileSkill(null)}
        onBack={() => {
          setPreviewSkill(detailFileSkill);
          setDetailFileSkill(null);
        }}
      />

      {/* Modal de Relatório Executivo */}
      <ReportModal
        report={activeReport}
        onClose={() => setActiveReport(null)}
      />
    </div>
  );
}
