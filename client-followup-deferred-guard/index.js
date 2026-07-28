const DEFERRED_STATUS_KEYS = new Set([
  "parked_until_end_2026",
  "proposal_deferred",
  "no_reply_needed",
  "payment_waiting",
  "budget_deferred",
]);

function normalise(value = "") {
  return String(value).trim().toLowerCase();
}

function collectSignals(record = {}) {
  const metadata = record.metadata || {};
  const build = record.build || {};
  const engagement = record.engagement || {};
  const notes = Array.isArray(record.notes) ? record.notes : [];

  const values = [
    metadata.status,
    metadata.followup_status,
    metadata.resolution,
    build.stage,
    build.status,
    engagement.status,
    engagement.followup_status,
    ...notes.map((note) => note.metadata?.status || note.metadata?.resolution || note.tag),
  ];

  return values.map(normalise).filter(Boolean);
}

function hasFuturePayment(record = {}, now = new Date()) {
  const value = record.next_expected_payment_at || record.engagement?.next_expected_payment_at;
  if (!value) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date > now;
}

function findDeferredSignal(record = {}, now = new Date()) {
  const explicit = collectSignals(record).find((signal) => DEFERRED_STATUS_KEYS.has(signal));
  if (explicit) return explicit;
  if (hasFuturePayment(record, now)) return "next_expected_payment_at";
  return null;
}

function shouldSuppressColdFollowup(record = {}, now = new Date()) {
  const deferredSignal = findDeferredSignal(record, now);
  if (deferredSignal) {
    return {
      suppress: true,
      reason: deferredSignal,
      next_review_at: record.revisit_at || record.parked_until || record.next_expected_payment_at || null,
    };
  }

  return {
    suppress: false,
    reason: "no_deferred_state",
    next_review_at: null,
  };
}

function classifyFollowupLane(record = {}, now = new Date()) {
  const guard = shouldSuppressColdFollowup(record, now);
  if (guard.suppress) {
    return {
      action: "suppress_followup",
      status: "deferred",
      reason: guard.reason,
      next_review_at: guard.next_review_at,
    };
  }

  if ((record.unanswered_nudges || 0) >= 2) {
    return {
      action: "mark_cold",
      status: "followup_cold",
      reason: "two_unanswered_nudges",
      next_review_at: null,
    };
  }

  return {
    action: "allow_followup",
    status: "active",
    reason: "cadence_allows",
    next_review_at: null,
  };
}

module.exports = {
  classifyFollowupLane,
  collectSignals,
  findDeferredSignal,
  hasFuturePayment,
  shouldSuppressColdFollowup,
};
