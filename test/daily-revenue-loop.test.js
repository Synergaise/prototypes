const test = require('node:test');
const assert = require('node:assert/strict');
const { planRevenueLoop, shouldSurface } = require('../daily-revenue-loop');

test('plans gated revenue moves from business signals', () => {
  const plan = planRevenueLoop({ weekday: true, signals: ['quiet_proposal', 'pricing_gap'] });
  assert.equal(plan.cadence, 'run_today');
  assert.deepEqual(plan.moves.map(move => move.type), ['draft_follow_up', 'propose_packaging_change']);
  assert.equal(plan.founderSurface.length, 1);
});

test('keeps internal-only moves out of the founder surface', () => {
  assert.equal(shouldSurface({ gate: 'internal_only' }), false);
  assert.equal(shouldSurface({ gate: 'approval_queue' }), true);
});
