export type Role = "ADMIN" | "CLIENT_VIEWER";

export type Priority = "P0" | "P1" | "P2" | "P3";

export type TaskStatus = "DONE" | "IN_PROGRESS" | "NEXT" | "PLANNED" | "WAITING" | "BLOCKED";

export interface EvidenceRef {
  ref: string;
  label: string;
  count: number;
}

export interface GateCheck {
  gate: string;
  label: string;
  status: "PASS" | "FAIL" | "PENDING" | "NOT_RECORDED";
  at?: string;
}

export interface TaskHistoryEvent {
  seq: number;
  type: string;
  actor: string;
  ts: string;
}

export interface TaskItem {
  id: string;
  title: string;
  priority: Priority;
  priority_label: string;
  kind: "dev" | "ops" | "docs" | "decision" | "security" | "input";
  executor: string;
  goal: string;
  steps?: string[];
  acceptance?: string[];
  depends_on: { id: string; title: string }[];
  raw_depends_on?: string[];
  gates: GateCheck[];
  blocked_by?: string[];
  requires_human_approval?: boolean;
  approval_reason?: string;
  status: TaskStatus;
  status_label: string;
  phase_id: string;
  phase_title?: string;
  tab: "concluidas" | "em_execucao" | "proximas" | "bloqueadas" | "todas";
  started_at?: string | null;
  completed_at?: string | null;
  result?: string;
  evidence: EvidenceRef[];
  worked?: { seconds: number; label: string; running?: boolean };
  assignee?: string;
  completed_by?: string;
  history: TaskHistoryEvent[];
}

export interface PhaseItem {
  phase_id: string;
  title: string;
  description: string;
  objective: string;
  status: "COMPLETED" | "IN_PROGRESS" | "WAITING" | "NOT_STARTED";
  status_label: string;
  progress: number;
  tasks_total: number;
  tasks_done: number;
  started_at?: string | null;
  completed_at?: string | null;
  worked?: { seconds: number; label: string };
  tasks: string[];
  task_items?: TaskItem[];
  reports?: ReportItem[];
}

export interface MilestoneItem {
  milestone_id: string;
  title: string;
  description: string;
  delivered: boolean;
  delivered_at?: string | null;
  phase: string;
  tasks: string[];
  evidence: string[];
}

export interface ProcessItem {
  process: string;
  domain?: string;
  objective: string;
  level: number; // 0..4
  status: string;
  automation: "SIM" | "PARCIAL" | "NÃO";
  priority: Priority;
  priority_label: string;
  next_milestone: string;
}

export interface CapabilityDomain {
  domain_id: string;
  label: string;
  what_it_does: string;
  input?: string;
  output?: string;
  priority?: Priority;
  priority_label?: string;
  automation: "SIM" | "PARCIAL" | "NÃO";
  level: number;
  status: string;
  next_milestone: string;
  skills_found: { label: string; skills?: string[] }[];
  platform_components: { name: string; status: string }[];
}

export interface ComparativeItem {
  category: string;
  current: string;
  new: string;
}

export interface EvolutionData {
  existed?: { items: string[] };
  identified?: { items: string[] };
  preserved?: { items: string[] };
  rebuilt?: { items: string[] };
  improved?: { items: string[] };
  missing?: { items: string[] };
  [key: string]: { items: string[] } | undefined;
}

export interface FindingItem {
  finding_id: string;
  title: string;
  category: string;
  sensitive?: boolean;
  description: string;
  impact: string;
  action: string;
  tasks: string[];
  status: string;
  situation: string;
}

export interface FlowItem {
  id: string;
  name: string;
  before: string[];
  now: string[];
  source?: string;
  tasks: { id: string; status_label: string }[];
  status: "DONE" | "IN_PROGRESS" | "WAIT" | "OPEN" | "NONE";
}

export interface ChangeItem {
  id: string;
  title: string;
  decision?: string;
  why?: string;
  impact?: string;
  source?: string;
  tasks: { id: string }[];
  status_label: string;
  tone: string;
}

export interface DecisionItem {
  id: string;
  title: string;
  why?: string;
  impact?: string;
  source?: string;
  tasks: { id: string }[];
  status_label: string;
  tone: string;
}

export interface ErrorItem {
  id: string;
  title: string;
  what: string;
  where?: string;
  sensitive?: boolean;
  source?: string;
  tasks: { id: string; status_label: string }[];
  status: "DONE" | "IN_PROGRESS" | "WAIT" | "OPEN" | "NONE";
  status_label: string;
  tone: string;
}

export interface TimelineItem {
  ts: string;
  action: string;
  task_id?: string;
  task_title?: string;
  phase_title?: string;
  executor: string;
  result: string;
  type: string;
}

export interface WorkSession {
  start: string;
  end: string;
  label: string;
  source: string;
}

export interface WorkHours {
  total_label: string;
  registered_label: string;
  reconstructed_label: string;
  tasks_label: string;
  running?: boolean;
  method: string;
  sessions: WorkSession[];
}

export interface ReportItem {
  report_id: string;
  title: string;
  version: number;
  period?: { started_at: string; completed_at: string };
  generated_at: string;
  generated_from_historical_evidence?: boolean;
  audience: "client" | "admin";
  pdf_url?: string;
  summary: string;
  highlights: string[];
}

export interface QualityGate {
  id: string;
  label: string;
  status: "PASS" | "FAIL" | "WARNING" | "NOT_RECORDED";
  status_label: string;
  at?: string;
  note?: string;
}

export interface ProjectOverview {
  project: {
    title: string;
    office: string;
    report_heading: string;
  };
  status: "IN_PROGRESS" | "COMPLETED";
  status_label: string;
  current_phase?: PhaseItem;
  last_update: string;
  labels: Record<string, string>;
  metrics: {
    progress: number;
    tasks_total: number;
    tasks_done: number;
    tasks_in_progress: number;
    tasks_next: number;
    tasks_waiting: number;
    phases_total: number;
    phases_completed: number;
    processes_count: number;
    processes_automated: number;
    processes_in_migration: number;
    tests_count: number;
    hours_worked: string;
  };
  hours: WorkHours;
  next: {
    task: TaskItem | null;
    why: string[];
    in_progress: TaskItem[];
  };
  waiting: TaskItem[];
  summary: {
    objective: string;
    modernizing: string;
    current_phase?: string;
    next_milestones: string[];
  };
  phases: PhaseItem[];
  milestones: MilestoneItem[];
  quality: QualityGate[];
  timeline: TimelineItem[];
  reports: ReportItem[];
}

export interface SkillFileNode {
  name: string;
  path: string;
  isDir?: boolean;
  children?: SkillFileNode[];
  content?: string;
  type?: "yaml" | "markdown" | "code" | "json";
}

export interface AgentSkill {
  id: string;
  name: string;
  category:
    | "devops"
    | "engineering"
    | "automation"
    | "automacao"
    | "security"
    | "diagnostics"
    | "frontend"
    | "governance"
    | "ai-agents"
    | "data"
    | "dados"
    | "programacao"
    | "negocios"
    | "design"
    | "midia"
    | "conteudo"
    | "aplicativos";
  description: string;
  path: string;
  entrypoint: string;
  package: string;
  execution_mode: "plan-first" | "iterative-tdd" | "read-only" | "non-destructive" | "append-only" | "read-only-publish" | "agent-loop";
  tags: string[];
  markdown: string;
  isOfficial: boolean;
  author: string;
  version: string;
  supportedRuntimes: string[];
  whenToUse?: string;
  whenNotToUse?: string;
  preconditions?: string;
  procedure?: string[];
  acceptanceCriteria?: string[];
  securityRules?: {
    planFirst: boolean;
    zeroExfiltration: boolean;
    explicitGates: boolean;
    deterministicPackaging: boolean;
  };
  sampleTestPrompt?: string;
  createdAt?: string;
  updatedAt?: string;
  usageCount?: string;
  installed?: boolean;
  coverTheme?: {
    bg: string;
    accent: string;
    icon: string;
    subtitle?: string;
    logo?: string;
  };
  promptSuggestions?: string[];
  files?: SkillFileNode[];
}

export interface SkillTestCase {
  id: string;
  title: string;
  inputPrompt: string;
  expectedMode: string;
  expectedGate: "auto_approve" | "human_approval_required" | "safety_block";
}

export interface SkillTestRunResult {
  skillId: string;
  status: "success" | "blocked" | "needs_approval" | "running";
  logs: { timestamp: string; step: string; detail: string; level: "info" | "warn" | "success" | "error" }[];
  plan?: string;
  evidence?: string;
  securityChecksPassed: boolean;
}

