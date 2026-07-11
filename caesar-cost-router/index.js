const ROUTES = [
  {
    runtime: 'local-small',
    maxRisk: 1,
    handles: ['classification', 'summarisation', 'routine_triage'],
    maxMonthlyCostGbp: 10
  },
  {
    runtime: 'cheap-cloud',
    maxRisk: 2,
    handles: ['drafting', 'extraction', 'light_reasoning'],
    maxMonthlyCostGbp: 40
  },
  {
    runtime: 'frontier-codex',
    maxRisk: 5,
    handles: ['coding', 'strategy', 'high_value_decision'],
    maxMonthlyCostGbp: 90
  }
];

function routeTask(task) {
  const requested = new Set(task.capabilities || []);
  const candidates = ROUTES.filter(route => {
    const riskOk = (task.risk || 1) <= route.maxRisk;
    const capabilityOk = [...requested].every(capability => route.handles.includes(capability));
    return riskOk && capabilityOk;
  });

  const selected = candidates[0] || ROUTES[ROUTES.length - 1];
  return {
    runtime: selected.runtime,
    qualityGate: selected.runtime === 'frontier-codex' ? 'human_review_or_ci' : 'spot_check_and_retry',
    costBucket: selected.maxMonthlyCostGbp
  };
}

function monthlyPlanRecommendation({ fixedPlanGbp, apiSpendGbp, frontierShare }) {
  if (frontierShare >= 0.35 && fixedPlanGbp <= apiSpendGbp * 1.15) return 'keep_fixed_plan';
  if (apiSpendGbp < fixedPlanGbp * 0.75) return 'move_to_api_payg';
  return 'review_next_month';
}

module.exports = { routeTask, monthlyPlanRecommendation };
