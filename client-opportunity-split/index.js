const CLIENT_STAGES = new Set(['contracted', 'current', 'active', 'past', 'archived']);
const OPPORTUNITY_SOURCES = new Set(['public_web_lead_mining', 'cold_outbound', 'inbound', 'referral', 'manual_research']);

function classifyAgencyRecord(record = {}) {
  if (record.accepted_engagement || CLIENT_STAGES.has(record.stage)) {
    return 'client';
  }
  if (OPPORTUNITY_SOURCES.has(record.source) || record.approval_status !== 'approved') {
    return 'opportunity';
  }
  return record.has_contract ? 'client' : 'opportunity';
}

function toOpportunity(record = {}) {
  return {
    name: record.name || 'Untitled opportunity',
    source: record.source || 'unknown',
    direction: record.direction || inferDirection(record.source),
    approvalStatus: record.approval_status || 'unapproved',
    outreachStatus: record.outreach_status || 'not_started',
    owner: record.owner || null,
    confidence: record.confidence || 0,
    nextAction: record.next_action || 'review',
    conversionPath: record.conversion_path || 'approve_to_client'
  };
}

function migrateLeadMiningRows(rows = []) {
  return rows.map(row => ({
    originalId: row.id,
    target: classifyAgencyRecord(row),
    payload: classifyAgencyRecord(row) === 'client' ? row : toOpportunity(row)
  }));
}

function inferDirection(source) {
  return source === 'inbound' || source === 'referral' ? 'inbound' : 'outbound';
}

module.exports = { classifyAgencyRecord, toOpportunity, migrateLeadMiningRows, inferDirection };
