const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyAgencyRecord, toOpportunity, migrateLeadMiningRows, inferDirection } = require('../client-opportunity-split');

test('keeps contracted and active customers in clients', () => {
  assert.equal(classifyAgencyRecord({ stage: 'current', source: 'public_web_lead_mining' }), 'client');
  assert.equal(classifyAgencyRecord({ accepted_engagement: true, approval_status: 'unapproved' }), 'client');
});

test('moves lead-mining and unapproved records into opportunities', () => {
  assert.equal(classifyAgencyRecord({ source: 'public_web_lead_mining', approval_status: 'unapproved' }), 'opportunity');
  const opportunity = toOpportunity({ name: 'Acme', source: 'public_web_lead_mining', owner: 'jude', confidence: 0.82 });
  assert.equal(opportunity.direction, 'outbound');
  assert.equal(opportunity.nextAction, 'review');
});

test('migration preserves original id and target lane', () => {
  const migrated = migrateLeadMiningRows([{ id: 'lead-1', name: 'Target Co', source: 'public_web_lead_mining' }]);
  assert.equal(migrated[0].originalId, 'lead-1');
  assert.equal(migrated[0].target, 'opportunity');
  assert.equal(inferDirection('referral'), 'inbound');
});
