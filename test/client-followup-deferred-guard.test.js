const test = require("node:test");
const assert = require("node:assert/strict");
const {
  classifyFollowupLane,
  findDeferredSignal,
  shouldSuppressColdFollowup,
} = require("../client-followup-deferred-guard");

test("suppresses cold follow-up when proposal is deferred", () => {
  const result = shouldSuppressColdFollowup({
    metadata: { status: "proposal_deferred" },
    unanswered_nudges: 2,
  });

  assert.equal(result.suppress, true);
  assert.equal(result.reason, "proposal_deferred");
});

test("finds deferred state from recent note metadata", () => {
  const signal = findDeferredSignal({
    notes: [
      { body: "Client wants to revisit later", metadata: { resolution: "parked_until_end_2026" } },
    ],
  });

  assert.equal(signal, "parked_until_end_2026");
});

test("suppresses follow-up until future payment date", () => {
  const result = classifyFollowupLane({
    next_expected_payment_at: "2026-08-15T09:00:00.000Z",
    unanswered_nudges: 2,
  }, new Date("2026-07-28T17:00:00.000Z"));

  assert.equal(result.action, "suppress_followup");
  assert.equal(result.reason, "next_expected_payment_at");
});

test("marks cold only when no deferred state exists", () => {
  const result = classifyFollowupLane({
    unanswered_nudges: 2,
    notes: [{ body: "No reply to two nudges", metadata: { status: "active" } }],
  });

  assert.equal(result.action, "mark_cold");
  assert.equal(result.status, "followup_cold");
});

test("allows follow-up when cadence has not hit the cold threshold", () => {
  const result = classifyFollowupLane({ unanswered_nudges: 1 });

  assert.equal(result.action, "allow_followup");
  assert.equal(result.reason, "cadence_allows");
});
