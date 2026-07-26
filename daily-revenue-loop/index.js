const DEFAULT_SIGNALS = ['quiet_proposal', 'stalled_build', 'approval_waiting', 'pricing_gap', 'proof_point'];

function planRevenueLoop(snapshot) {
  const signals = snapshot.signals || [];
  const moves = [];

  if (signals.includes('quiet_proposal')) moves.push({ type: 'draft_follow_up', gate: 'gmail_draft' });
  if (signals.includes('proof_point')) moves.push({ type: 'draft_authority_asset', gate: 'approval_queue' });
  if (signals.includes('pricing_gap')) moves.push({ type: 'propose_packaging_change', gate: 'founder_decision' });
  if (signals.includes('stalled_build')) moves.push({ type: 'remove_build_blocker', gate: 'internal_only' });

  return {
    cadence: snapshot.weekday ? 'run_today' : 'skip_weekend',
    inspectedSignals: signals.filter(signal => DEFAULT_SIGNALS.includes(signal)),
    moves,
    founderSurface: moves.filter(move => move.gate === 'founder_decision')
  };
}

function shouldSurface(move) {
  return ['founder_decision', 'approval_queue'].includes(move.gate);
}

module.exports = { planRevenueLoop, shouldSurface };
