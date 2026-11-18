/**
 * Deda Skills - Token & Context Window Estimator
 * Utilitário para estimar contagem de tokens, tamanho de payload e impacto
 * na janela de contexto de Agentes de IA (Claude Code, OpenAI Codex, Gemini, Hermes, OpenCode).
 */

export interface SkillTokenProfile {
  totalTokens: number;
  formatted: string;
  charCount: number;
  byteSize: number;
  formattedBytes: string;
  category: "leve" | "otimizado" | "denso";
  categoryLabel: string;
  categoryColor: string;
  percent128k: number;
  percentClaude200k: number;
}

/**
 * Estima a quantidade de tokens para texto em português/inglês com código e markdown.
 * Em média, 1 token corresponde a ~3.8 a 4 caracteres para este tipo de conteúdo.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return Math.ceil(trimmed.length / 3.8);
}

/**
 * Formata a quantidade de tokens para exibição amigável (ex: 850 tokens, 1.4k tokens).
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    const kVal = (tokens / 1000).toFixed(1).replace(/\.0$/, "");
    return `${kVal}k tokens`;
  }
  return `${tokens} tokens`;
}

/**
 * Calcula o perfil completo de consumo de contexto de uma habilidade ou suíte.
 */
export function calculateSkillTokenProfile(skillOrSuite: any): SkillTokenProfile {
  if (!skillOrSuite) {
    return {
      totalTokens: 0,
      formatted: "0 tokens",
      charCount: 0,
      byteSize: 0,
      formattedBytes: "0 B",
      category: "leve",
      categoryLabel: "Leve",
      categoryColor: "#D97757",
      percent128k: 0,
      percentClaude200k: 0,
    };
  }

  let combinedText = "";

  if (typeof skillOrSuite.markdown === "string") {
    combinedText += skillOrSuite.markdown + "\n";
  }
  if (typeof skillOrSuite.description === "string") {
    combinedText += skillOrSuite.description + "\n";
  }
  if (typeof skillOrSuite.tagline === "string") {
    combinedText += skillOrSuite.tagline + "\n";
  }
  if (typeof skillOrSuite.whenToUse === "string") {
    combinedText += skillOrSuite.whenToUse + "\n";
  }
  if (typeof skillOrSuite.whenNotToUse === "string") {
    combinedText += skillOrSuite.whenNotToUse + "\n";
  }
  if (typeof skillOrSuite.preconditions === "string") {
    combinedText += skillOrSuite.preconditions + "\n";
  }
  if (Array.isArray(skillOrSuite.procedure)) {
    combinedText += skillOrSuite.procedure.join("\n") + "\n";
  }
  if (Array.isArray(skillOrSuite.prompts)) {
    combinedText += skillOrSuite.prompts.join("\n") + "\n";
  }
  if (Array.isArray(skillOrSuite.acceptanceCriteria)) {
    combinedText += skillOrSuite.acceptanceCriteria.join("\n") + "\n";
  }
  if (Array.isArray(skillOrSuite.skills)) {
    skillOrSuite.skills.forEach((s: any) => {
      combinedText += (s.name || "") + " " + (s.description || "") + " " + (s.markdown || "") + "\n";
      if (Array.isArray(s.procedure)) combinedText += s.procedure.join("\n") + "\n";
    });
  }
  if (Array.isArray(skillOrSuite.files)) {
    skillOrSuite.files.forEach((f: any) => {
      if (f.content) combinedText += f.content + "\n";
    });
  }

  // Base de segurança para itens que só têm dados essenciais
  if (combinedText.trim().length < 60) {
    combinedText += `${skillOrSuite.name || ""} ${skillOrSuite.description || ""} Standard Agent Skill Specification v1.0 Plan-First Deterministic Packaging`;
  }

  const charCount = combinedText.length;
  const byteSize = new Blob([combinedText]).size || charCount;
  const totalTokens = estimateTokens(combinedText);
  const formatted = formatTokens(totalTokens);

  // Percentual da janela padrão de 128k (GPT-4o, Gemini Flash padrão)
  const percent128k = Math.max(0.05, Number(((totalTokens / 131072) * 100).toFixed(2)));
  // Percentual de 200k (Claude 3.5 Sonnet)
  const percentClaude200k = Math.max(0.05, Number(((totalTokens / 200000) * 100).toFixed(2)));

  let category: "leve" | "otimizado" | "denso" = "leve";
  let categoryLabel = "Leve & Rápido";
  let categoryColor = "#D97757"; // Terracota Claude do Sertão

  if (totalTokens > 3200) {
    category = "denso";
    categoryLabel = "Denso / Completo";
    categoryColor = "#FFB800"; // Âmbar
  } else if (totalTokens > 1200) {
    category = "otimizado";
    categoryLabel = "Otimizado";
    categoryColor = "#E28768"; // Terracota suave do Sertão
  }

  const formattedBytes = byteSize >= 1024 ? `${(byteSize / 1024).toFixed(1)} KB` : `${byteSize} B`;

  return {
    totalTokens,
    formatted,
    charCount,
    byteSize,
    formattedBytes,
    category,
    categoryLabel,
    categoryColor,
    percent128k,
    percentClaude200k,
  };
}
