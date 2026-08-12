const test = require('node:test');
const assert = require('node:assert/strict');
const {
  classifyAlert,
  buildIncident,
  shouldEscalate,
  normaliseProvider,
  hasExplicitSecuritySignal
} = require('../system-alert-triage-lane');

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

test('security/auth signals override junk suppression', () => {
  const upworkUnknownDevice = classifyAlert({
    source_system: 'upwork',
    type: 'product_update',
    subject: 'Unknown device signed in to your Upwork account'
  });
  assert.equal(upworkUnknownDevice.action, 'escalate');
  assert.equal(upworkUnknownDevice.provider, 'upwork');

  const googleHeader = classifyAlert({
    provider: 'Google Workspace',
    type: 'marketing',
    raw_headers: { security_alert: true },
    subject: 'Weekly update'
  });
  assert.equal(googleHeader.action, 'escalate');
  assert.equal(hasExplicitSecuritySignal({ raw_headers: { security_alert: 'true' } }), true);
});
