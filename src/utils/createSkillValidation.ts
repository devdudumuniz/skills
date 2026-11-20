export type CreateSkillField = "name" | "id" | "description" | "author" | "version";

export interface CreateSkillFormValues {
  name: string;
  id: string;
  description: string;
  author: string;
  version: string;
}

export type CreateSkillFieldErrors = Partial<Record<CreateSkillField, string>>;

export interface CreateSkillValidationResult {
  isValid: boolean;
  errors: CreateSkillFieldErrors;
  missingRequiredLabels: string[];
  requiredCompleted: number;
  requiredTotal: number;
  completionPercent: number;
}

export interface SaveProgressStep {
  id: string;
  label: string;
  detail: string;
  percent: number;
}

export const CREATE_SKILL_PROGRESS_STEPS: SaveProgressStep[] = [
  {
    id: "validate",
    label: "Validando especificação SKILL.md",
    detail: "Verificando frontmatter YAML, gatilhos e limites de segurança...",
    percent: 32,
  },
  {
    id: "package",
    label: "Gerando arte de xilogravura & pacote .skill",
    detail: "Montando capa 3D, árvore de arquivos e metadados universais...",
    percent: 72,
  },
  {
    id: "persist",
    label: "Salvando habilidade no Deda Skills",
    detail: "Registrando no catálogo local e preparando para o Playground...",
    percent: 100,
  },
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export function slugifySkillName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateCreateSkillForm(
  values: CreateSkillFormValues
): CreateSkillValidationResult {
  const errors: CreateSkillFieldErrors = {};
  const missingRequiredLabels: string[] = [];

  const trimmedName = values.name.trim();
  const trimmedId = values.id.trim();
  const trimmedDescription = values.description.trim();
  const trimmedAuthor = values.author.trim();
  const trimmedVersion = values.version.trim();

  // Nome da habilidade (obrigatório)
  if (!trimmedName) {
    errors.name = "O nome da habilidade é obrigatório.";
    missingRequiredLabels.push("Nome");
  } else if (trimmedName.length < 3) {
    errors.name = "Informe pelo menos 3 caracteres para o nome da habilidade.";
    missingRequiredLabels.push("Nome");
  }

  // Identificador / Slug (obrigatório)
  if (!trimmedId) {
    errors.id = "O identificador (slug) é obrigatório.";
    missingRequiredLabels.push("Identificador (Slug)");
  } else if (trimmedId.length < 2) {
    errors.id = "O slug deve ter pelo menos 2 caracteres.";
    missingRequiredLabels.push("Identificador (Slug)");
  } else if (!SLUG_PATTERN.test(trimmedId)) {
    errors.id = "Use apenas letras minúsculas, números e hífens (ex: auditoria-api).";
    missingRequiredLabels.push("Identificador (Slug)");
  }

  // Descrição da competência (obrigatória)
  if (!trimmedDescription) {
    errors.description = "A descrição da competência é obrigatória.";
    missingRequiredLabels.push("Descrição");
  } else if (trimmedDescription.length < 15) {
    errors.description = `Descreva melhor a competência (mínimo de 15 caracteres; atual: ${trimmedDescription.length}).`;
    missingRequiredLabels.push("Descrição");
  }

  // Autor (obrigatório)
  if (!trimmedAuthor) {
    errors.author = "Informe o autor ou organização responsável.";
    missingRequiredLabels.push("Autor");
  }

  // Versão (obrigatória no padrão semver)
  if (!trimmedVersion) {
    errors.version = "Informe a versão inicial (ex: 1.0.0).";
    missingRequiredLabels.push("Versão");
  } else if (!SEMVER_PATTERN.test(trimmedVersion)) {
    errors.version = "Use o formato semântico X.Y.Z (ex: 1.0.0).";
    missingRequiredLabels.push("Versão");
  }

  const requiredTotal = 5;
  const requiredCompleted = requiredTotal - missingRequiredLabels.length;
  const completionPercent = Math.round((requiredCompleted / requiredTotal) * 100);

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    missingRequiredLabels,
    requiredCompleted,
    requiredTotal,
    completionPercent,
  };
}

export function getSaveProgressStep(stepIndex: number): SaveProgressStep {
  if (stepIndex <= 0) return CREATE_SKILL_PROGRESS_STEPS[0];
  if (stepIndex >= CREATE_SKILL_PROGRESS_STEPS.length - 1) {
    return CREATE_SKILL_PROGRESS_STEPS[CREATE_SKILL_PROGRESS_STEPS.length - 1];
  }
  return CREATE_SKILL_PROGRESS_STEPS[stepIndex];
}
