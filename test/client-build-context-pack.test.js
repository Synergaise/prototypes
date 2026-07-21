const test = require("node:test");
const assert = require("node:assert/strict");
const { createBuildContextPack } = require("../client-build-context-pack");

test("builds a structured context pack from build state and notes", () => {
  const { pack, completeness } = createBuildContextPack({
    client: { id: "c1", name: "Example Ltd", owner: "jude", stage: "active_build" },
    build: {
      id: "b1",
      name: "Ops dashboard",
      stage: "building",
      architecture: "Supabase -> n8n -> dashboard",
      field_maps: ["crm.company_name -> dashboard.account"],
      formulas: ["capacity = hours_saved * hourly_rate"],
      access_state: "granted",
      next_action: "Validate field map"
    },
    notes: [{ kind: "decision", body: "Keep HubSpot as source of truth." }],
    externalRefs: [{ system: "drive", url: "https://example.test/doc" }]
  });

  assert.equal(pack.client.name, "Example Ltd");
  assert.equal(pack.decisions[0], "Keep HubSpot as source of truth.");
  assert.deepEqual(completeness.missing, ["risks"]);
});
