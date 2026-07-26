const test = require('node:test');
const assert = require('node:assert/strict');
const { routeTask, monthlyPlanRecommendation } = require('../caesar-cost-router');

test('routes routine triage to local small runtime', () => {
  assert.equal(routeTask({ risk: 1, capabilities: ['routine_triage'] }).runtime, 'local-small');
});

test('routes coding and high-risk decisions to frontier Codex tier', () => {
  assert.equal(routeTask({ risk: 5, capabilities: ['coding'] }).runtime, 'frontier-codex');
});

test('recommends API payg when monthly API spend is materially lower', () => {
  assert.equal(monthlyPlanRecommendation({ fixedPlanGbp: 90, apiSpendGbp: 40, frontierShare: 0.2 }), 'move_to_api_payg');
});
