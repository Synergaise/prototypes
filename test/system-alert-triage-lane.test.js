const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyAlert, buildIncident, shouldEscalate, normaliseProvider } = require('../system-alert-triage-lane');

test('escalates real provider blockers', () => {
  const event = { provider: 'PandaDoc', type: 'webhook_deactivated', subject: 'Webhook disabled' };
  const classification = classifyAlert(event);
  assert.equal(classification.action, 'escalate');
  assert.equal(classification.provider, 'pandadoc');
  assert.equal(shouldEscalate(event), true);
});

test('suppresses newsletters and unknown provider noise', () => {
  assert.equal(classifyAlert({ provider: 'GitHub', type: 'newsletter' }).action, 'suppress');
  assert.equal(classifyAlert({ provider: 'Random SaaS', type: 'product_update' }).lane, 'junk');
});

test('records durable incidents for non-critical system notices', () => {
  const incident = buildIncident({ provider: 'Google Workspace', type: 'auth_warning', source_id: 'msg-1' });
  assert.equal(incident.provider, 'google_workspace');
  assert.equal(incident.status, 'open');
  assert.equal(incident.founderSurface, false);
  assert.equal(normaliseProvider('Make / n8n'), 'make_n8n');
});
