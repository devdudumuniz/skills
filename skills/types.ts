export interface BundledSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  markdownPath?: string;
  procedure?: string[];
  markdown?: string;
}

export interface SkillFileNode {
  name: string;
  path: string;
  isDir?: boolean;
  children?: SkillFileNode[];
  content?: string;
  type?: "yaml" | "markdown" | "code" | "json";
}

export interface AgentSkillSuite {
  id: string;
  name: string;
  author: string;
  version: string;
  updatedAt: string;
  usageCount: string;
  category:
    | "programacao"
    | "dados"
    | "automacao"
    | "negocios"
    | "design"
    | "midia"
    | "conteudo"
    | "aplicativos"
    | "devops"
    | "security"
    | "governance";
  tagline: string;
  description: string;
  installed: boolean;
  isFavorite: boolean;
  prompts: string[];
  skills: BundledSkill[];
  coverTheme: {
    bg: string;
    accent: string;
    icon: string;
    subtitle?: string;
    logo?: string;
    imageUrl?: string;
    cordelArt?: string | { themeName: string; elements: string[]; caption: string; };
  };
  imageUrl?: string;
  cordelArt?: string | { themeName: string; elements: string[]; caption: string; };
  files?: SkillFileNode[];
}

export interface AgentSkill {
  id: string;
  name: string;
  category: string;
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
  isFavorite?: boolean;
  coverTheme?: {
    bg: string;
    accent: string;
    icon: string;
    subtitle?: string;
    logo?: string;
    imageUrl?: string;
    cordelArt?: string | { themeName: string; elements: string[]; caption: string; };
  };
  imageUrl?: string;
  cordelArt?: string | { themeName: string; elements: string[]; caption: string; };
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
