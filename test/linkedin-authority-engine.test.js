const test = require('node:test');
const assert = require('node:assert/strict');
const { createBacklogItem, chooseCommentAngle } = require('../linkedin-authority-engine');

test('creates approval-gated backlog items from CRM evidence', () => {
  const item = createBacklogItem({ signal: 'capacity_leak', amountGbp: 4200, source: 'crm_note' });
  assert.equal(item.lane, 'priced capacity leak');
  assert.equal(item.approvalRequired, true);
  assert.match(item.hook, /GBP 4200/);
});

test('selects founder comment angles from post context', () => {
  assert.equal(chooseCommentAngle('workflow bottleneck thread'), 'capacity_audit_angle');
});
