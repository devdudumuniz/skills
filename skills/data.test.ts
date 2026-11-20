import test from "node:test";
import assert from "node:assert/strict";
import { AGENT_SUITES } from "./data";
import { AGENT_SKILLS } from "../src/data/skillsData";

test("AGENT_SUITES contains all Deda Skills suites with unique IDs and original authorship", () => {
  const ids = AGENT_SUITES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "Suite IDs must be unique");

  const expectedNewIds = [
    "design-intelligence-studio",
    "canvas-diagram-studio",
    "architecture-diagram-engine",
    "excalidraw-diagram-generator",
    "agent-profile-builder",
  ];

  for (const id of expectedNewIds) {
    const suite = AGENT_SUITES.find((s) => s.id === id);
    assert.ok(suite, `Missing suite ${id} in AGENT_SUITES`);
    assert.equal(suite.author, "Deda Skills");
    assert.ok(suite.skills.length >= 3, `${id} should include >= 3 bundled sub-skills`);
    assert.ok(suite.imageUrl?.startsWith("/assets/cordel/"), `${id} must reference a cordel cover`);
    assert.ok(
      AGENT_SKILLS.some((sk) => sk.id === id),
      `Missing ${id} in AGENT_SKILLS for Playground compatibility`
    );
  }
});

test("New Deda Skills suites avoid external plugin/runtime lock-in paths", () => {
  const newSuites = AGENT_SUITES.filter((s) =>
    [
      "design-intelligence-studio",
      "canvas-diagram-studio",
      "architecture-diagram-engine",
      "excalidraw-diagram-generator",
      "agent-profile-builder",
    ].includes(s.id)
  );
  for (const suite of newSuites) {
    const serialized = JSON.stringify(suite);
    assert.equal(serialized.includes("CLAUDE_PLUGIN_ROOT"), false);
    assert.equal(serialized.includes(".github/skills/"), false);
  }
});
