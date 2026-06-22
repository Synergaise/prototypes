// Workflow Blueprint API — prototype scaffold.
// buildBlueprint(spec) -> a normalised, reusable workflow blueprint.
function buildBlueprint(spec = {}) {
  const name = String(spec.name || "untitled-workflow").trim();
  const steps = Array.isArray(spec.steps) ? spec.steps : [];
  return {
    apiVersion: "blueprint/v0",
    name,
    steps: steps.map((s, i) => ({
      id: s.id || `step-${i + 1}`,
      action: String(s.action || "noop"),
      inputs: s.inputs && typeof s.inputs === "object" ? s.inputs : {},
    })),
    stepCount: steps.length,
  };
}

module.exports = { buildBlueprint };
