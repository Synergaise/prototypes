const LANES = {
  capacity_leak: 'priced capacity leak',
  teardown: 'teardown-style post',
  proof: 'client proof reframed as outcome',
  anti_vendor: 'anti-vendor positioning'
};

function createBacklogItem(evidence) {
  const lane = LANES[evidence.signal] || 'recovered revenue capacity';
  return {
    lane,
    hook: buildHook(evidence),
    source: evidence.source,
    status: 'drafting',
    approvalRequired: true
  };
}

function buildHook(evidence) {
  if (evidence.amountGbp) return `This team was leaking GBP ${evidence.amountGbp} of capacity before the workflow changed.`;
  if (evidence.hoursRecovered) return `The useful AI metric is not tasks automated; it is ${evidence.hoursRecovered} hours redeployed.`;
  return 'Most AI projects fail because they start with tools instead of capacity.';
}

function chooseCommentAngle(post) {
  if (post.includes('headcount')) return 'amplify_people_not_replace';
  if (post.includes('workflow')) return 'capacity_audit_angle';
  return 'specific_outcome_question';
}

module.exports = { createBacklogItem, chooseCommentAngle };
