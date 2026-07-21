const test = require("node:test");
const assert = require("node:assert/strict");
const { inspectPipeline } = require("../opportunity-pipeline-integrity");

test("fails closed when list_opportunities breaks", () => {
  const result = inspectPipeline({ readErrors: [{ source: "list_opportunities", message: "gateway [object Object]" }] });

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].severity, "blocker");
});

test("flags mined prospects leaking into active client rows", () => {
  const result = inspectPipeline({ clients: [{ id: "c1", origin: "public_web_lead_mining", stage: "active_build" }] });

  assert.equal(result.issues[0].code, "prospect_polluting_clients");
});
