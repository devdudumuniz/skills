import { createContext, useContext, useState, ReactNode } from "react";
import {
  Role,
  ProjectOverview,
  TaskItem,
  PhaseItem,
  MilestoneItem,
  ProcessItem,
  CapabilityDomain,
  ComparativeItem,
  EvolutionData,
  FindingItem,
  FlowItem,
  ChangeItem,
  DecisionItem,
  ErrorItem,
  TimelineItem,
  WorkHours,
  ReportItem,
  QualityGate,
  AgentSkill,
  TaskStatus,
} from "../types";
import {
  initialTasks,
  initialPhases,
  initialMilestones,
  initialProcesses,
  initialCapabilities,
  initialComparative,
  initialEvolution,
  initialFindings,
  initialFlows,
  initialChanges,
  initialDecisions,
  initialErrors,
  initialTimeline,
  initialHours,
  initialReports,
  projectOverviewData,
} from "../data/initialProjectData";
import { AGENT_SKILLS } from "../data/skillsData";

interface ProjectContextType {
  role: Role;
  setRole: (r: Role) => void;
  overview: ProjectOverview;
  tasks: TaskItem[];
  phases: PhaseItem[];
  milestones: MilestoneItem[];
  processes: ProcessItem[];
  capabilities: CapabilityDomain[];
  comparative: ComparativeItem[];
  evolution: EvolutionData;
  findings: FindingItem[];
  flows: FlowItem[];
  changes: ChangeItem[];
  decisions: DecisionItem[];
  errors: ErrorItem[];
  timeline: TimelineItem[];
  hours: WorkHours;
  reports: ReportItem[];
  quality: QualityGate[];
  skills: AgentSkill[];
  addSkill: (newSkill: AgentSkill) => void;
  deleteSkill: (id: string) => void;
  toggleInstallSkill: (id: string) => void;
  activeTestSkillId: string | null;
  setActiveTestSkillId: (id: string | null) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  generateConsolidatedReport: () => Promise<string>;
  recordEvent: (action: string, taskId?: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("ADMIN");
  const [skills, setSkills] = useState<AgentSkill[]>(AGENT_SKILLS);
  const [activeTestSkillId, setActiveTestSkillId] = useState<string | null>("devops-delivery");
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [phases, setPhases] = useState<PhaseItem[]>(initialPhases);
  const [milestones] = useState<MilestoneItem[]>(initialMilestones);
  const [processes] = useState<ProcessItem[]>(initialProcesses);
  const [capabilities] = useState<CapabilityDomain[]>(initialCapabilities);
  const [comparative] = useState<ComparativeItem[]>(initialComparative);
  const [evolution] = useState<EvolutionData>(initialEvolution);
  const [findings] = useState<FindingItem[]>(initialFindings);
  const [flows] = useState<FlowItem[]>(initialFlows);
  const [changes] = useState<ChangeItem[]>(initialChanges);
  const [decisions] = useState<DecisionItem[]>(initialDecisions);
  const [errors] = useState<ErrorItem[]>(initialErrors);
  const [timeline, setTimeline] = useState<TimelineItem[]>(initialTimeline);
  const [hours] = useState<WorkHours>(initialHours);
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [overview] = useState<ProjectOverview>(projectOverviewData);

  const addSkill = (newSkill: AgentSkill) => {
    setSkills((prev) => [newSkill, ...prev]);
    recordEvent(`Nova skill criada no laboratório: ${newSkill.name} (${newSkill.id})`);
  };

  const deleteSkill = (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
    recordEvent(`Skill removida do laboratório: ${id}`);
  };

  const toggleInstallSkill = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextState = !s.installed;
          recordEvent(
            nextState
              ? `Skill adicionada às minhas habilidades: ${s.name}`
              : `Skill removida das minhas habilidades: ${s.name}`
          );
          return { ...s, installed: nextState };
        }
        return s;
      })
    );
  };

  // Sanitized findings for client view
  const visibleFindings = findings.map((f) => {
    if (role === "CLIENT_VIEWER" && f.sensitive) {
      return {
        ...f,
        title: "Item de segurança técnica em tratamento",
        description: "Detalhes reservados para a equipe de engenharia por política de segurança.",
        action: "Tratamento executado em conformidade com as diretrizes do projeto.",
      };
    }
    return f;
  });

  // Sanitized errors for client view
  const visibleErrors = errors.map((e) => {
    if (role === "CLIENT_VIEWER" && e.sensitive) {
      return {
        ...e,
        title: "Achado de segurança no repositório antigo",
        what: "Credencial antiga desativada e rotacionada pela administração.",
        where: undefined,
        source: undefined,
      };
    }
    return e;
  });

  const recordEvent = (action: string, taskId?: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    const newEvent: TimelineItem = {
      ts: new Date().toISOString(),
      action,
      task_id: taskId,
      task_title: targetTask?.title,
      phase_title: targetTask?.phase_title,
      executor: role === "ADMIN" ? "Administração" : "Agente de IA",
      result: "Registrado",
      type: "manual_log",
    };
    setTimeline((prev) => [newEvent, ...prev]);
  };

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const statusLabels: Record<TaskStatus, string> = {
      DONE: "Concluída",
      IN_PROGRESS: "Em execução",
      NEXT: "Próxima",
      PLANNED: "Planejada",
      WAITING: "Aguardando",
      BLOCKED: "Bloqueada",
    };
    const tabMap: Record<TaskStatus, TaskItem["tab"]> = {
      DONE: "concluidas",
      IN_PROGRESS: "em_execucao",
      NEXT: "proximas",
      PLANNED: "proximas",
      WAITING: "bloqueadas",
      BLOCKED: "bloqueadas",
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updated: TaskItem = {
          ...t,
          status: newStatus,
          status_label: statusLabels[newStatus],
          tab: tabMap[newStatus],
          completed_at: newStatus === "DONE" ? new Date().toISOString() : t.completed_at,
          started_at: newStatus === "IN_PROGRESS" && !t.started_at ? new Date().toISOString() : t.started_at,
          result: newStatus === "DONE" ? "Concluída com sucesso e validada" : t.result,
        };
        return updated;
      })
    );

    recordEvent(`Status da tarefa alterado para ${statusLabels[newStatus]}`, taskId);

    // Recalculate phases
    setPhases((prev) =>
      prev.map((p) => {
        if (!p.tasks.includes(taskId)) return p;
        const phaseTasks = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)).filter((t) => p.tasks.includes(t.id));
        const doneCount = phaseTasks.filter((t) => t.status === "DONE").length;
        const progress = Math.round((doneCount / p.tasks.length) * 100);
        return {
          ...p,
          tasks_done: doneCount,
          progress,
          status: progress === 100 ? "COMPLETED" : progress > 0 ? "IN_PROGRESS" : p.status,
          status_label: progress === 100 ? "Concluída" : progress > 0 ? "Em andamento" : p.status_label,
        };
      })
    );
  };

  const generateConsolidatedReport = async (): Promise<string> => {
    const newVersion = reports.length + 1;
    const newReport: ReportItem = {
      report_id: `report.consolidated.v${newVersion}`,
      title: `Relatório Consolidado de Engenharia v${newVersion}`,
      version: newVersion,
      period: {
        started_at: phases[0]?.started_at ?? new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      generated_at: new Date().toISOString(),
      generated_from_historical_evidence: true,
      audience: "admin",
      pdf_url: `#report-consolidated-v${newVersion}`,
      summary: `Relatório consolidado gerado pela administração contendo todas as ${tasks.length} tarefas, progresso de fases e auditoria de evidências.`,
      highlights: [
        `${tasks.filter((t) => t.status === "DONE").length} de ${tasks.length} tarefas concluídas.`,
        `${phases.filter((p) => p.status === "COMPLETED").length} de ${phases.length} fases entregues.`,
        "Audit trail preservado sem divergências.",
      ],
    };
    setReports((prev) => [newReport, ...prev]);
    recordEvent(`Relatório consolidado v${newVersion} gerado com sucesso`);
    return `Versão ${newVersion} gerada com sucesso.`;
  };

  return (
    <ProjectContext.Provider
      value={{
        role,
        setRole,
        overview,
        tasks,
        phases,
        milestones,
        processes,
        capabilities,
        comparative,
        evolution,
        findings: visibleFindings,
        flows,
        changes,
        decisions,
        errors: visibleErrors,
        timeline,
        hours,
        reports,
        quality: overview.quality,
        skills,
        addSkill,
        deleteSkill,
        toggleInstallSkill,
        activeTestSkillId,
        setActiveTestSkillId,
        updateTaskStatus,
        generateConsolidatedReport,
        recordEvent,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
