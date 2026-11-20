import test from "node:test";
import assert from "node:assert/strict";
import { resolvePlaygroundSkillId } from "./skillTestMapping";
import { AGENT_SKILLS } from "../data/skillsData";

test("resolvePlaygroundSkillId preserves exact matches when present", () => {
  const ids = AGENT_SKILLS.map((s) => s.id);
  assert.equal(resolvePlaygroundSkillId("devops-delivery", ids), "devops-delivery");
  assert.equal(resolvePlaygroundSkillId("excalidraw-diagram-generator", ids), "excalidraw-diagram-generator");
});

test("resolvePlaygroundSkillId maps composite suite IDs to matching playground skills", () => {
  const ids = AGENT_SKILLS.map((s) => s.id);
  assert.equal(resolvePlaygroundSkillId("web-design", ids), "exact-ui-extraction-transfer");
  assert.equal(resolvePlaygroundSkillId("security-diagnostics", ids), "security-baseline");
  assert.equal(resolvePlaygroundSkillId("creative-production", ids), "html-video-production");
  assert.equal(resolvePlaygroundSkillId("vibecode-engineering", ids), "vibecode-builder");
  assert.equal(resolvePlaygroundSkillId("status-governance", ids), "status-portal");
  assert.equal(resolvePlaygroundSkillId("copywriting-marketing", ids), "marketing-copywriter");
});

test("resolvePlaygroundSkillId falls back safely on unknown or empty IDs", () => {
  const ids = AGENT_SKILLS.map((s) => s.id);
  assert.equal(resolvePlaygroundSkillId("non-existent-skill", ids), "devops-delivery");
  assert.equal(resolvePlaygroundSkillId("", ids), "devops-delivery");
  assert.equal(resolvePlaygroundSkillId(null, ["custom-only"]), "custom-only");
});
