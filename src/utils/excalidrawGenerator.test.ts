import test from "node:test";
import assert from "node:assert/strict";
import {
  synthesizeBlueprintFromPrompt,
  compileBlueprintToExcalidraw,
  validateExcalidrawScene,
  DIAGRAM_PRESETS,
} from "./excalidrawGenerator";

test("synthesizeBlueprintFromPrompt rejects empty prompt", () => {
  assert.throws(() => synthesizeBlueprintFromPrompt("   "), /Descreva a arquitetura/);
});

test("synthesizeBlueprintFromPrompt parses explicit arrow flow cleanly", () => {
  const bp = synthesizeBlueprintFromPrompt(
    "Cliente Web -> API Gateway -> Auth Service -> PostgreSQL & Redis",
    "microservices"
  );
  assert.equal(bp.nodes.length, 5);
  assert.equal(bp.edges.length, 4);
  assert.equal(bp.nodes[0].role, "client");
  assert.equal(bp.nodes[1].role, "gateway");
  assert.equal(bp.nodes[3].role, "database");
  assert.equal(bp.nodes[4].role, "cache");
});

test("compileBlueprintToExcalidraw produces valid Excalidraw v2 JSON with symmetric bindings", () => {
  for (const preset of DIAGRAM_PRESETS) {
    const bp = synthesizeBlueprintFromPrompt(preset.prompt, preset.topology);
    const darkScene = compileBlueprintToExcalidraw(bp, "dark");
    const lightScene = compileBlueprintToExcalidraw(bp, "light");

    const darkValidation = validateExcalidrawScene(darkScene);
    const lightValidation = validateExcalidrawScene(lightScene);

    assert.equal(darkValidation.valid, true, darkValidation.errors.join("; "));
    assert.equal(lightValidation.valid, true, lightValidation.errors.join("; "));
    assert.ok(darkValidation.stats.shapes >= 4);
    assert.ok(darkValidation.stats.arrows >= 3);
    assert.ok(darkValidation.stats.boundTexts >= darkValidation.stats.shapes);
    assert.equal(darkScene.appState.theme, "dark");
    assert.equal(lightScene.appState.theme, "light");
  }
});

test("compileBlueprintToExcalidraw maintains collision-free coordinates across layered nodes", () => {
  const bp = synthesizeBlueprintFromPrompt(
    "Cliente -> Gateway -> Auth + Orders -> Kafka -> WorkerA + WorkerB -> DB",
    "architecture"
  );
  const scene = compileBlueprintToExcalidraw(bp, "dark");
  const shapes = scene.elements.filter(
    (el) => el.type === "rectangle" || el.type === "ellipse" || el.type === "diamond"
  );

  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i];
      const b = shapes[j];
      const overlapsX = a.x < b.x + b.width && a.x + a.width > b.x;
      const overlapsY = a.y < b.y + b.height && a.y + a.height > b.y;
      assert.equal(
        overlapsX && overlapsY,
        false,
        `Collision detected between ${a.id} and ${b.id}`
      );
    }
  }
});
