function inspectPipeline({ clients = [], opportunities = [], readErrors = [] }) {
  const issues = [];

  for (const error of readErrors) {
    if (error.source === "list_opportunities") {
      issues.push({
        severity: "blocker",
        code: "opportunity_read_failed",
        message: "Opportunity pipeline read failed; growth automation must fail closed.",
        detail: error.message || "unknown error"
      });
    }
  }

  for (const client of clients) {
    const looksLikeProspect = client.origin === "public_web_lead_mining" || client.lifecycle === "prospect";
    const activeClient = ["active_build", "proposal_sent", "delivery", "client"].includes(client.stage);

    if (looksLikeProspect && activeClient) {
      issues.push({
        severity: "warning",
        code: "prospect_polluting_clients",
        client_id: client.id,
        suggested_action: "Move this row to opportunities or mark it non-client before client reports use it."
      });
    }
  }

  const duplicateOpportunityIds = opportunities
    .map((opportunity) => opportunity.external_id)
    .filter(Boolean)
    .filter((id, index, all) => all.indexOf(id) !== index);

  for (const externalId of new Set(duplicateOpportunityIds)) {
    issues.push({
      severity: "warning",
      code: "duplicate_opportunity_external_id",
      external_id: externalId
    });
  }

  return { ok: issues.length === 0, issues };
}

module.exports = { inspectPipeline };
