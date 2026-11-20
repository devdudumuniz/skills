import test from "node:test";
import assert from "node:assert/strict";
import {
  CREATE_SKILL_PROGRESS_STEPS,
  getSaveProgressStep,
  slugifySkillName,
  validateCreateSkillForm,
} from "./createSkillValidation";

test("validateCreateSkillForm flags empty required fields with clear Portuguese messages", () => {
  const result = validateCreateSkillForm({
    name: "",
    id: "",
    description: "",
    author: "",
    version: "",
  });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.name?.includes("obrigatório"));
  assert.ok(result.errors.id?.includes("obrigatório"));
  assert.ok(result.errors.description?.includes("obrigatória"));
  assert.ok(result.errors.author?.includes("autor"));
  assert.ok(result.errors.version?.includes("versão"));
  assert.equal(result.requiredCompleted, 0);
  assert.equal(result.completionPercent, 0);
});

test("validateCreateSkillForm enforces minimum lengths, kebab-case slug, and semver version", () => {
  const result = validateCreateSkillForm({
    name: "IA",
    id: "Slug Inválido!",
    description: "Muito curta",
    author: "Eduardo Muniz",
    version: "v1",
  });

  assert.equal(result.isValid, false);
  assert.ok(result.errors.name?.includes("3 caracteres"));
  assert.ok(result.errors.id?.includes("letras minúsculas"));
  assert.ok(result.errors.description?.includes("15 caracteres"));
  assert.equal(result.errors.author, undefined);
  assert.ok(result.errors.version?.includes("X.Y.Z"));
  assert.equal(result.requiredCompleted, 1);
});

test("validateCreateSkillForm passes for a complete and well-formed skill", () => {
  const result = validateCreateSkillForm({
    name: "Analisador de Arquitetura",
    id: "analisador-de-arquitetura",
    description: "Inspeciona dependências, arquitetura e riscos de segurança sem alterar código.",
    author: "Eduardo Muniz",
    version: "1.0.0",
  });

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.missingRequiredLabels, []);
  assert.equal(result.requiredCompleted, result.requiredTotal);
  assert.equal(result.completionPercent, 100);
});

test("slugifySkillName normalizes accents and punctuation into kebab-case", () => {
  assert.equal(slugifySkillName("Auditoria & Segurança API"), "auditoria-seguranca-api");
  assert.equal(slugifySkillName("  Criação de Testes  "), "criacao-de-testes");
});

test("save progress steps progress monotonically from 32% to 100% and clamp safely", () => {
  assert.equal(CREATE_SKILL_PROGRESS_STEPS.length, 3);
  assert.equal(getSaveProgressStep(-1).percent, 32);
  assert.equal(getSaveProgressStep(0).percent, 32);
  assert.equal(getSaveProgressStep(1).percent, 72);
  assert.equal(getSaveProgressStep(2).percent, 100);
  assert.equal(getSaveProgressStep(99).percent, 100);
});
