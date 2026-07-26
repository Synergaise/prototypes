function findThreadReference({ client = {}, build = {} }) {
  return (
    client.client_thread_id ||
    client.gmail_thread_id ||
    build.client_thread_id ||
    build.gmail_thread_id ||
    null
  );
}

function isActivePayingFollowUp(client, followUp) {
  const payingStages = ["active_build", "delivery", "retainer", "paid_discovery"];
  return Boolean(followUp && followUp.pending && payingStages.includes(client.stage));
}

function assessFollowUpGrounding({ client = {}, build = {}, inboxAccess = {}, followUp = {} }) {
  const owner = client.owner || build.owner;
  const threadId = findThreadReference({ client, build });
  const ownerInbox = owner ? inboxAccess[owner] || {} : {};
  const issues = [];

  if (!owner) {
    issues.push({ code: "missing_owner", severity: "blocker" });
  }

  if (owner && !ownerInbox.live_check) {
    issues.push({ code: "missing_owner_live_check", severity: "blocker", owner });
  }

  if (owner && !ownerInbox.can_draft) {
    issues.push({ code: "missing_owner_draft_access", severity: "blocker", owner });
  }

  if (!threadId) {
    issues.push({ code: "missing_client_thread_id", severity: "blocker" });
  }

  if (followUp.latest_founder_reply_at && followUp.latest_founder_reply_at >= followUp.latest_client_message_at) {
    issues.push({ code: "already_handled", severity: "info" });
  }

  const blockerCodes = new Set(issues.filter((issue) => issue.severity === "blocker").map((issue) => issue.code));
  const blockedByInboxContext = blockerCodes.has("missing_owner_live_check") || blockerCodes.has("missing_client_thread_id");
  const shouldEscalate = blockedByInboxContext && isActivePayingFollowUp(client, followUp);

  return {
    canDraft: issues.every((issue) => issue.severity !== "blocker") && !issues.some((issue) => issue.code === "already_handled"),
    shouldEscalate,
    threadId,
    owner,
    issues
  };
}

module.exports = { assessFollowUpGrounding, findThreadReference };
