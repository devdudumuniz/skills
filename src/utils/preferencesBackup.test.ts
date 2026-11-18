import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPreferencesBackup,
  serializePreferencesBackup,
  parsePreferencesBackup,
  applyPreferencesToSuites,
  getBackupFilename,
  PREFERENCES_BACKUP_SCHEMA,
} from "./preferencesBackup";
import type { AgentSkillSuite } from "../../skills/types";

function makeSuite(
  id: string,
  installed: boolean,
  isFavorite: boolean
): AgentSkillSuite {
  return {
    id,
    name: `Suite ${id}`,
    author: "Deda Skills",
    version: "1.0.0",
    updatedAt: "2026-11-16",
    usageCount: "1",
    category: "programacao",
    tagline: "Tagline",
    description: "Description",
    installed,
    isFavorite,
    prompts: [],
    skills: [],
    coverTheme: {
      bg: "#24201D",
      accent: "#D97757",
      icon: "code",
      subtitle: "Sub",
    },
  };
}

test("buildPreferencesBackup collects installed and favorite IDs accurately", () => {
  const suites = [
    makeSuite("web-design", true, true),
    makeSuite("devops", true, false),
    makeSuite("security", false, true),
    makeSuite("copywriter", false, false),
  ];

  const backup = buildPreferencesBackup(suites, "2026-11-16T10:00:00.000Z");

  assert.equal(backup.schema, PREFERENCES_BACKUP_SCHEMA);
  assert.equal(backup.version, "1.0.0");
  assert.equal(backup.exportedAt, "2026-11-16T10:00:00.000Z");
  assert.deepEqual(backup.preferences.installedSkillIds, ["web-design", "devops"]);
  assert.deepEqual(backup.preferences.favoriteSkillIds, ["web-design", "security"]);
  assert.equal(backup.summary.installedCount, 2);
  assert.equal(backup.summary.favoriteCount, 2);
  assert.equal(backup.summary.totalCatalogCount, 4);
});

test("serializePreferencesBackup and parsePreferencesBackup roundtrip cleanly", () => {
  const suites = [
    makeSuite("web-design", true, false),
    makeSuite("devops", false, true),
  ];
  const json = serializePreferencesBackup(
    buildPreferencesBackup(suites, "2026-11-16T10:00:00.000Z")
  );
  const validIds = new Set(["web-design", "devops"]);
  const parsed = parsePreferencesBackup(json, validIds);

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.deepEqual(parsed.installedIds, ["web-design"]);
    assert.deepEqual(parsed.favoriteIds, ["devops"]);
    assert.deepEqual(parsed.ignoredIds, []);
    assert.equal(parsed.exportedAt, "2026-11-16T10:00:00.000Z");
  }
});

test("parsePreferencesBackup filters unknown IDs and reports them", () => {
  const json = JSON.stringify({
    schema: PREFERENCES_BACKUP_SCHEMA,
    version: "1.0.0",
    preferences: {
      installedSkillIds: ["web-design", "removed-skill"],
      favoriteSkillIds: ["unknown-fav", "devops"],
    },
  });
  const validIds = new Set(["web-design", "devops"]);
  const parsed = parsePreferencesBackup(json, validIds);

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.deepEqual(parsed.installedIds, ["web-design"]);
    assert.deepEqual(parsed.favoriteIds, ["devops"]);
    assert.deepEqual(parsed.ignoredIds, ["removed-skill", "unknown-fav"]);
  }
});

test("parsePreferencesBackup rejects malformed JSON and invalid schemas", () => {
  assert.equal(parsePreferencesBackup("").ok, false);
  assert.equal(parsePreferencesBackup("{invalid json").ok, false);
  assert.equal(parsePreferencesBackup("[]").ok, false);
  assert.equal(
    parsePreferencesBackup(
      JSON.stringify({ schema: "wrong-schema", preferences: {} })
    ).ok,
    false
  );
  assert.equal(
    parsePreferencesBackup(
      JSON.stringify({
        schema: PREFERENCES_BACKUP_SCHEMA,
        preferences: { installedSkillIds: "not-an-array", favoriteSkillIds: [] },
      })
    ).ok,
    false
  );
});

test("applyPreferencesToSuites updates installed and isFavorite flags immutably", () => {
  const original = [
    makeSuite("web-design", true, true),
    makeSuite("devops", false, false),
  ];

  const updated = applyPreferencesToSuites(original, ["devops"], ["devops"]);

  assert.equal(original[0].installed, true);
  assert.equal(updated[0].installed, false);
  assert.equal(updated[0].isFavorite, false);
  assert.equal(updated[1].installed, true);
  assert.equal(updated[1].isFavorite, true);
});

test("getBackupFilename formats deterministic date string", () => {
  const filename = getBackupFilename(new Date(2026, 10, 16));
  assert.equal(filename, "deda-skills-preferences-2026-11-16.json");
});
