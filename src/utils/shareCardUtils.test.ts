import test from "node:test";
import assert from "node:assert/strict";
import {
  buildShareCardPayload,
  formatCategoryLabel,
  getShareCardFilename,
  truncateText,
} from "./shareCardUtils";
import { AGENT_SUITES } from "../../skills/data";

test("formatCategoryLabel maps known categories to Portuguese labels and capitalizes fallback", () => {
  assert.equal(formatCategoryLabel("programacao"), "Programação");
  assert.equal(formatCategoryLabel("security"), "Segurança");
  assert.equal(formatCategoryLabel("design"), "Design & UI");
  assert.equal(formatCategoryLabel("custom"), "Custom");
  assert.equal(formatCategoryLabel(""), "Habilidade");
});

test("truncateText preserves short text and trims cleanly at word boundaries", () => {
  assert.equal(truncateText("Texto curto", 50), "Texto curto");
  const longText =
    "Especifica agentes especializados com identidade, modelo local, permissoes deny-by-default no servidor e memoria isolada.";
  const truncated = truncateText(longText, 64);
  assert.ok(truncated.length <= 64);
  assert.ok(truncated.endsWith("…"));
  assert.equal(truncated.includes("permissoes"), false);
});

test("getShareCardFilename produces safe kebab-case PNG filenames for light and dark themes", () => {
  assert.equal(
    getShareCardFilename("agent-profile-builder", "light"),
    "deda-skills-agent-profile-builder.png"
  );
  assert.equal(
    getShareCardFilename("Agent Profile / Ação!", "dark"),
    "deda-skills-agent-profile-acao-escuro.png"
  );
  assert.equal(getShareCardFilename("   ", "light"), "deda-skills-skill.png");
});

test("buildShareCardPayload extracts key skill metrics, sub-skills cap, and cover metadata", () => {
  const suite = AGENT_SUITES.find((item) => item.id === "agent-profile-builder");
  assert.ok(suite, "agent-profile-builder must exist in AGENT_SUITES");

  const payload = buildShareCardPayload(suite, "light");
  assert.equal(payload.id, "agent-profile-builder");
  assert.equal(payload.name, "Agent Profile Builder");
  assert.equal(payload.categoryLabel, "Programação");
  assert.equal(payload.totalSubSkills, suite.skills.length);
  assert.ok(payload.subSkills.length <= 4);
  assert.equal(payload.coverImageUrl, "/assets/cordel/agent_profile_builder.jpg");
  assert.ok(payload.tokensFormatted.includes("tokens"));
  assert.equal(payload.filename, "deda-skills-agent-profile-builder.png");
});
