const test = require('node:test');
const assert = require('node:assert/strict');
const { scanOpportunities, requiresFounderSurface, dedupeCandidates } = require('../proactive-opportunity-scanner');

test('keeps only confident opportunities and assigns gates', () => {
  const results = scanOpportunities([
    { title: 'Retainer packaging', category: 'pricing', confidence: 0.9, reason: 'repeated proposal friction' },
    { title: 'Weak signal', category: 'operations', confidence: 0.4, reason: 'single occurrence' }
  ]);
  assert.equal(results.length, 1);
  assert.equal(results[0].gate, 'founder_decision');
  assert.equal(results[0].founderNoise, true);
});

test('dedupes repeated category/title pairs', () => {
  assert.equal(dedupeCandidates([
    { title: 'Build tracker', category: 'operations' },
    { title: 'build tracker', category: 'operations' }
  ]).length, 1);
  assert.equal(requiresFounderSurface('operations'), false);
});
