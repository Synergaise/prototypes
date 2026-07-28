const test = require("node:test");
const assert = require("node:assert/strict");
const {
  auditActiveBuilds,
  createFounderReviewPacket,
  detectBuildStateIssue,
  isActiveClient,
} = require("../active-build-state-auditor");

test("detects active clients with no build record as blockers", () => {
  const issue = detectBuildStateIssue({
    client: { id: "c1", name: "CleanSYSTEM", stage: "active_build", owner: "jude" },
    build: null,
    context: { last_real_client_touch: "2026-07-27" },
  });

  assert.deepEqual(issue, { severity: "blocker", reason: "missing_build_record" });
});

test("creates founder-review packets for thin active-build state", () => {
  const packet = createFounderReviewPacket({
    client: { id: "c1", name: "CleanSYSTEM", stage: "active_build", owner: "jude" },
    build: null,
    context: {
      current_scope: "CST/CPC delivery",
      last_real_client_touch: "2026-07-27",
      open_issues: ["Missing canonical build record"],
      next_action: "Create or reconcile build record",
    },
  });

  assert.equal(packet.client_name, "CleanSYSTEM");
  assert.equal(packet.severity, "blocker");
  assert.equal(packet.reason, "missing_build_record");
  assert.equal(packet.next_action, "Create or reconcile build record");
});

test("keeps sufficiently grounded active builds complete", () => {
  const issue = detectBuildStateIssue({
    client: { id: "c2", name: "ELC", current_stage: "active_build" },
    build: { id: "b1", summary: "Dashboard", client_thread_id: "thread-1" },
    context: {
      context_sources: [{ kind: "client_email" }],
    },
  });

  assert.deepEqual(issue, { severity: "complete", reason: "state_sufficient" });
});

test("audits only active-build clients", () => {
  const rows = auditActiveBuilds([
    { client: { id: "c1", name: "Active", stage: "active_build" }, build: null },
    { client: { id: "c2", name: "Lead", stage: "proposal_sent" }, build: null },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].client_name, "Active");
});

test("recognises active build stages", () => {
  assert.equal(isActiveClient({ current_stage: "active_build" }), true);
  assert.equal(isActiveClient({ stage: "proposal_sent" }), false);
});
