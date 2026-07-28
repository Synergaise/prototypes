const EMPTY_BUILD_REASONS = new Set([
  "missing_build_record",
  "no_grounded_thread",
  "automated_only_context",
]);

function normaliseStage(stage = "") {
  return String(stage).trim().toLowerCase();
}

function isActiveClient(client = {}) {
  const stage = normaliseStage(client.stage || client.current_stage);
  return stage === "active_build" || stage === "building" || stage === "in_delivery";
}

function hasGroundedThread(context = {}) {
  return Boolean(context.thread_id || context.gmail_thread_id || context.client_thread_id);
}

function hasHumanContext(context = {}) {
  const sources = Array.isArray(context.context_sources) ? context.context_sources : [];
  return sources.some((source) => {
    const kind = String(source.kind || source.type || "").toLowerCase();
    return kind === "client_email" || kind === "founder_note" || kind === "call_transcript";
  });
}

function detectBuildStateIssue({ client = {}, build = null, context = {} }) {
  if (!isActiveClient(client)) {
    return { severity: "skip", reason: "client_not_active_build" };
  }

  if (!build) {
    return { severity: "blocker", reason: "missing_build_record" };
  }

  if (!hasGroundedThread(context) && !hasGroundedThread(build)) {
    return { severity: "review", reason: "no_grounded_thread" };
  }

  if (!hasHumanContext(context) && context.automated_only === true) {
    return { severity: "review", reason: "automated_only_context" };
  }

  return { severity: "complete", reason: "state_sufficient" };
}

function createFounderReviewPacket({ client = {}, build = null, context = {}, issue }) {
  const stateIssue = issue || detectBuildStateIssue({ client, build, context });
  if (!EMPTY_BUILD_REASONS.has(stateIssue.reason)) {
    return null;
  }

  return {
    client_id: client.id,
    client_name: client.name,
    owner: client.owner || "unknown",
    severity: stateIssue.severity,
    reason: stateIssue.reason,
    current_scope: build?.summary || context.current_scope || "unknown",
    last_real_client_touch: context.last_real_client_touch || null,
    open_issues: Array.isArray(context.open_issues) ? context.open_issues : [],
    next_action: context.next_action || build?.next_action || "Founder review needed",
  };
}

function auditActiveBuilds(rows = []) {
  return rows
    .map((row) => {
      const issue = detectBuildStateIssue(row);
      return {
        client_id: row.client?.id,
        client_name: row.client?.name,
        severity: issue.severity,
        reason: issue.reason,
        review_packet: createFounderReviewPacket({ ...row, issue }),
      };
    })
    .filter((item) => item.severity !== "skip");
}

module.exports = {
  auditActiveBuilds,
  createFounderReviewPacket,
  detectBuildStateIssue,
  hasGroundedThread,
  isActiveClient,
};
