const PROVIDERS = new Set(['pandadoc', 'google_workspace', 'stripe', 'supabase', 'make', 'n8n', 'github', 'openclaw', 'gateway']);
const BLOCKER_TYPES = new Set(['auth_expired', 'webhook_deactivated', 'payment_blocked', 'security_alert', 'deadline_risk']);
const SUPPRESSED_TYPES = new Set(['newsletter', 'product_update', 'marketing', 'billing_receipt']);

function classifyAlert(event = {}) {
  const provider = normaliseProvider(event.provider);
  if (!PROVIDERS.has(provider)) {
    return { lane: 'junk', action: 'suppress', provider, reason: 'unknown_provider' };
  }
  if (SUPPRESSED_TYPES.has(event.type)) {
    return { lane: 'system', action: 'suppress', provider, reason: 'low_value_notice' };
  }
  if (BLOCKER_TYPES.has(event.type) || event.severity === 'critical') {
    return { lane: 'system', action: 'escalate', provider, reason: event.type || 'critical' };
  }
  return { lane: 'system', action: 'record_incident', provider, reason: event.type || 'needs_review' };
}

function buildIncident(event = {}, classification = classifyAlert(event)) {
  return {
    provider: classification.provider,
    type: event.type || 'unknown',
    severity: event.severity || (classification.action === 'escalate' ? 'critical' : 'warning'),
    subject: event.subject || 'System alert',
    sourceId: event.source_id || null,
    founderSurface: classification.action === 'escalate',
    status: classification.action === 'suppress' ? 'suppressed' : 'open'
  };
}

function shouldEscalate(event) {
  return classifyAlert(event).action === 'escalate';
}

function normaliseProvider(provider = '') {
  return String(provider).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

module.exports = { classifyAlert, buildIncident, shouldEscalate, normaliseProvider };
