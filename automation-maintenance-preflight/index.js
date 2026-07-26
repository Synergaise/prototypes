const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(date, now) {
  return Math.ceil((new Date(date).getTime() - new Date(now).getTime()) / DAY_MS);
}

function inspectMaintenanceReadiness({ workflows = [], credentials = [], alertRecipients = [], cursors = [], incidents = [], now = new Date().toISOString() }) {
  const issues = [];
  const recipientByClient = new Map(alertRecipients.map((recipient) => [recipient.client_id, recipient]));

  for (const workflow of workflows) {
    if (!workflow.heartbeat_enabled) {
      issues.push({ severity: "blocker", code: "missing_heartbeat", workflow_id: workflow.id, client_id: workflow.client_id });
    }

    if (workflow.last_success_at) {
      const hoursSinceSuccess = (new Date(now).getTime() - new Date(workflow.last_success_at).getTime()) / (60 * 60 * 1000);
      if (hoursSinceSuccess > (workflow.max_silent_hours || 24)) {
        issues.push({ severity: "warning", code: "stale_heartbeat", workflow_id: workflow.id, hoursSinceSuccess: Math.round(hoursSinceSuccess) });
      }
    }

    const recipient = recipientByClient.get(workflow.client_id);
    if (!recipient || !recipient.verified || !recipient.email) {
      issues.push({ severity: "blocker", code: "missing_verified_alert_recipient", workflow_id: workflow.id, client_id: workflow.client_id });
    }
  }

  for (const credential of credentials) {
    if (!credential.expires_at) continue;
    const remainingDays = daysUntil(credential.expires_at, now);
    if (remainingDays <= (credential.renewal_window_days || 14)) {
      issues.push({ severity: remainingDays < 0 ? "blocker" : "warning", code: "credential_renewal_due", system: credential.system, remainingDays });
    }
  }

  for (const cursor of cursors) {
    if (!cursor.updated_at) {
      issues.push({ severity: "warning", code: "missing_cursor_timestamp", cursor_id: cursor.id });
      continue;
    }

    const ageHours = (new Date(now).getTime() - new Date(cursor.updated_at).getTime()) / (60 * 60 * 1000);
    if (ageHours > (cursor.max_age_hours || 48)) {
      issues.push({ severity: "warning", code: "stale_cursor", cursor_id: cursor.id, ageHours: Math.round(ageHours) });
    }
  }

  for (const incident of incidents.filter((item) => item.status !== "resolved")) {
    issues.push({ severity: "warning", code: "unresolved_incident", incident_id: incident.id, client_id: incident.client_id });
  }

  return {
    ok: issues.every((issue) => issue.severity !== "blocker"),
    issues,
    retainerSignals: summarizeRetainerSignals(issues)
  };
}

function summarizeRetainerSignals(issues) {
  return {
    workflow_health: issues.filter((issue) => ["missing_heartbeat", "stale_heartbeat"].includes(issue.code)).length,
    alerting: issues.filter((issue) => issue.code === "missing_verified_alert_recipient").length,
    renewals: issues.filter((issue) => issue.code === "credential_renewal_due").length,
    operations: issues.filter((issue) => ["stale_cursor", "missing_cursor_timestamp", "unresolved_incident"].includes(issue.code)).length
  };
}

module.exports = { inspectMaintenanceReadiness, summarizeRetainerSignals };
