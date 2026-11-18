import test from "node:test";
import assert from "node:assert/strict";
import {
  GLOBAL_SHORTCUTS,
  matchGlobalShortcut,
} from "./keyboardShortcuts";

test("GLOBAL_SHORTCUTS registers Ctrl+K, Ctrl+D, and Ctrl+T bindings", () => {
  const combos = GLOBAL_SHORTCUTS.map((s) => s.combo);
  assert.deepEqual(combos, ["Ctrl+K", "Ctrl+D", "Ctrl+T"]);
});

test("matchGlobalShortcut maps Ctrl and Meta combinations case-insensitively", () => {
  assert.equal(
    matchGlobalShortcut({ key: "k", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false }),
    "catalog"
  );
  assert.equal(
    matchGlobalShortcut({ key: "K", ctrlKey: false, metaKey: true, altKey: false, shiftKey: false }),
    "catalog"
  );
  assert.equal(
    matchGlobalShortcut({ key: "d", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false }),
    "excalidraw"
  );
  assert.equal(
    matchGlobalShortcut({ key: "t", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false }),
    "test"
  );
});

test("matchGlobalShortcut ignores plain keys, Alt/Shift combos, and contentEditable targets", () => {
  assert.equal(
    matchGlobalShortcut({ key: "k", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false }),
    null
  );
  assert.equal(
    matchGlobalShortcut({ key: "d", ctrlKey: true, metaKey: false, altKey: true, shiftKey: false }),
    null
  );
  assert.equal(
    matchGlobalShortcut({ key: "t", ctrlKey: true, metaKey: false, altKey: false, shiftKey: true }),
    null
  );
  assert.equal(
    matchGlobalShortcut({
      key: "k",
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      targetIsContentEditable: true,
    }),
    null
  );
});
