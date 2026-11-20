import { AgentSkillSuite } from "../../skills/types";
import { calculateSkillTokenProfile } from "./tokenUtils";

export type ShareCardTheme = "light" | "dark";

export interface ShareCardPayload {
  id: string;
  name: string;
  author: string;
  version: string;
  categoryLabel: string;
  tagline: string;
  description: string;
  usageCount: string;
  updatedAt: string;
  coverImageUrl?: string;
  coverIcon: string;
  coverSubtitle?: string;
  subSkills: string[];
  totalSubSkills: number;
  extraSubSkillsCount: number;
  tokensFormatted: string;
  tokenCategoryLabel: string;
  percent128k: number;
  filename: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  programacao: "Programação",
  dados: "Dados & SQL",
  automacao: "Automação",
  negocios: "Negócios",
  design: "Design & UI",
  midia: "Mídia & Criativo",
  conteudo: "Conteúdo",
  aplicativos: "Aplicativos",
  devops: "DevOps",
  security: "Segurança",
  governance: "Governança",
};

export function formatCategoryLabel(category: string): string {
  const normalized = category.trim().toLowerCase();
  if (CATEGORY_LABELS[normalized]) {
    return CATEGORY_LABELS[normalized];
  }
  if (!normalized) {
    return "Habilidade";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function truncateText(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  if (maxLength <= 1) {
    return "…";
  }
  const sliced = clean.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const boundary = lastSpace > Math.floor(maxLength * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  return `${boundary.replace(/[.,;:!?-]+$/, "").trim()}…`;
}

export function getShareCardFilename(suiteId: string, theme: ShareCardTheme = "light"): string {
  const safeSlug =
    suiteId
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "skill";

  const suffix = theme === "dark" ? "-escuro" : "";
  return `deda-skills-${safeSlug}${suffix}.png`;
}

export function buildShareCardPayload(
  suite: AgentSkillSuite,
  theme: ShareCardTheme = "light"
): ShareCardPayload {
  const tokenProfile = calculateSkillTokenProfile(suite);
  const maxShownSkills = 4;
  const subSkills = suite.skills.slice(0, maxShownSkills).map((skill) => skill.name);
  const extraSubSkillsCount = Math.max(0, suite.skills.length - maxShownSkills);

  return {
    id: suite.id,
    name: suite.name,
    author: suite.author || "Deda Skills",
    version: suite.version || "1.0.0",
    categoryLabel: formatCategoryLabel(suite.category),
    tagline: truncateText(suite.tagline || suite.description, 120),
    description: truncateText(suite.description || suite.tagline, 210),
    usageCount: suite.usageCount || "1k+",
    updatedAt: suite.updatedAt || "2026",
    coverImageUrl: suite.coverTheme?.imageUrl || suite.imageUrl,
    coverIcon: suite.coverTheme?.icon || "layers",
    coverSubtitle: suite.coverTheme?.subtitle,
    subSkills,
    totalSubSkills: suite.skills.length,
    extraSubSkillsCount,
    tokensFormatted: tokenProfile.formatted,
    tokenCategoryLabel: tokenProfile.categoryLabel,
    percent128k: tokenProfile.percent128k,
    filename: getShareCardFilename(suite.id, theme),
  };
}
