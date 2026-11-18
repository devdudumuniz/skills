import test from "node:test";
import assert from "node:assert/strict";
import {
  getAccessibilityToggleMeta,
  parseStoredAccessibilityMode,
  toggleAccessibilityMode,
} from "./accessibilityTheme";

test("parseStoredAccessibilityMode defaults safely unless strictly 'high'", () => {
  assert.equal(parseStoredAccessibilityMode("high"), "high");
  assert.equal(parseStoredAccessibilityMode("default"), "default");
  assert.equal(parseStoredAccessibilityMode(null), "default");
  assert.equal(parseStoredAccessibilityMode("unknown"), "default");
});

test("toggleAccessibilityMode switches cleanly between default and high", () => {
  assert.equal(toggleAccessibilityMode("default"), "high");
  assert.equal(toggleAccessibilityMode("high"), "default");
});

test("getAccessibilityToggleMeta provides clear accessible labels", () => {
  const offMeta = getAccessibilityToggleMeta("default");
  assert.equal(offMeta.isHighContrast, false);
  assert.match(offMeta.label, /Alto Contraste/i);

  const onMeta = getAccessibilityToggleMeta("high");
  assert.equal(onMeta.isHighContrast, true);
  assert.match(onMeta.label, /Ativo/i);
});
