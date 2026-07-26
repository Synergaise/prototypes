const OUTPUT_GATES = {
  lead: 'propose_idea',
  operations: 'crm_note',
  authority: 'draft_asset',
  pricing: 'founder_decision',
  bottleneck: 'internal_fix'
};

function scanOpportunities(events) {
  return events
    .filter(event => event.confidence >= 0.7)
    .map(event => ({
      title: event.title,
      category: event.category,
      gate: OUTPUT_GATES[event.category] || 'crm_note',
      reason: event.reason,
      founderNoise: requiresFounderSurface(event.category)
    }));
}

function requiresFounderSurface(category) {
  return category === 'pricing' || category === 'lead';
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  return candidates.filter(candidate => {
    const key = `${candidate.category}:${candidate.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { scanOpportunities, requiresFounderSurface, dedupeCandidates };
