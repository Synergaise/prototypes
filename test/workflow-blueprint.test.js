const test = require("node:test");
const assert = require("node:assert");
const { buildBlueprint } = require("../workflow-blueprint-api/index.js");

test("buildBlueprint normalises a spec into a versioned blueprint", () => {
  const bp = buildBlueprint({ name: "lead-intake", steps: [{ action: "fetch" }, { action: "score" }] });
  assert.strictEqual(bp.apiVersion, "blueprint/v0");
  assert.strictEqual(bp.name, "lead-intake");
  assert.strictEqual(bp.stepCount, 2);
  assert.strictEqual(bp.steps[0].id, "step-1");
  assert.strictEqual(bp.steps[1].action, "score");
});

test("buildBlueprint is safe on empty input", () => {
  const bp = buildBlueprint();
  assert.strictEqual(bp.name, "untitled-workflow");
  assert.strictEqual(bp.stepCount, 0);
});
