const test = require("node:test");
const assert = require("node:assert/strict");
const { inspectMaintenanceReadiness } = require("../automation-maintenance-preflight");

const now = "2026-07-26T08:00:00Z";

test("blocks production readiness when heartbeat or alert recipients are missing", () => {
  const result = inspectMaintenanceReadiness({
    now,
    workflows: [{ id: "wf4", client_id: "bella", heartbeat_enabled: false }],
    alertRecipients: []
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((issue) => issue.code), ["missing_heartbeat", "missing_verified_alert_recipient"]);
});

test("flags credential renewals and stale cursors before they become client incidents", () => {
  const result = inspectMaintenanceReadiness({
    now,
    workflows: [{ id: "sona-monitor", client_id: "sona", heartbeat_enabled: true, last_success_at: "2026-07-25T22:00:00Z" }],
    alertRecipients: [{ client_id: "sona", email: "ops@example.com", verified: true }],
    credentials: [{ system: "stripe", expires_at: "2026-07-30T08:00:00Z", renewal_window_days: 7 }],
    cursors: [{ id: "career-one-quo", updated_at: "2026-07-23T07:00:00Z", max_age_hours: 48 }]
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.issues.map((issue) => issue.code), ["credential_renewal_due", "stale_cursor"]);
  assert.equal(result.retainerSignals.renewals, 1);
  assert.equal(result.retainerSignals.operations, 1);
});

test("surfaces unresolved incidents for monthly review without blocking all readiness", () => {
  const result = inspectMaintenanceReadiness({
    now,
    workflows: [{ id: "coq-monitor", client_id: "career-one-quo", heartbeat_enabled: true }],
    alertRecipients: [{ client_id: "career-one-quo", email: "ops@example.com", verified: true }],
    incidents: [{ id: "inc-1", client_id: "career-one-quo", status: "open" }]
  });

  assert.equal(result.ok, true);
  assert.equal(result.issues[0].code, "unresolved_incident");
});
