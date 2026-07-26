const test = require("node:test");
const assert = require("node:assert/strict");
const { assessFollowUpGrounding, findThreadReference } = require("../bertie-follow-up-grounding-bridge");

test("allows Bertie-owned drafts only with live check, draft access and thread id", () => {
  const result = assessFollowUpGrounding({
    client: { owner: "bertie", stage: "active_build", client_thread_id: "thread-1" },
    inboxAccess: { bertie: { live_check: true, can_draft: true } },
    followUp: { pending: true, latest_client_message_at: "2026-07-25T10:00:00Z" }
  });

  assert.equal(result.canDraft, true);
  assert.equal(result.threadId, "thread-1");
});

test("fails closed and escalates active paying follow-ups without Bertie inbox context", () => {
  const result = assessFollowUpGrounding({
    client: { owner: "bertie", stage: "active_build" },
    inboxAccess: { bertie: { live_check: false, can_draft: false } },
    followUp: { pending: true, latest_client_message_at: "2026-07-25T10:00:00Z" }
  });

  assert.equal(result.canDraft, false);
  assert.equal(result.shouldEscalate, true);
  assert.deepEqual(result.issues.map((issue) => issue.code), [
    "missing_owner_live_check",
    "missing_owner_draft_access",
    "missing_client_thread_id"
  ]);
});

test("does not draft a redundant follow-up when a founder has already replied", () => {
  const result = assessFollowUpGrounding({
    client: { owner: "bertie", stage: "active_build", gmail_thread_id: "thread-2" },
    inboxAccess: { bertie: { live_check: true, can_draft: true } },
    followUp: {
      pending: true,
      latest_client_message_at: "2026-07-25T10:00:00Z",
      latest_founder_reply_at: "2026-07-25T10:15:00Z"
    }
  });

  assert.equal(result.canDraft, false);
  assert.equal(result.shouldEscalate, false);
});

test("reads structured thread references from client before build fallback", () => {
  assert.equal(findThreadReference({ client: { client_thread_id: "client-thread" }, build: { gmail_thread_id: "build-thread" } }), "client-thread");
});
