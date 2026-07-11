# Caesar AI runtime cost router

Prototype scaffold for routing Caesar work across local, cheap cloud, and frontier model tiers.

## Intent

Keep the Mac mini as the always-on orchestrator, send routine low-risk work to cheaper runtimes, and reserve expensive Codex/frontier calls for coding, strategic reasoning, and high-value decisions.

## Decision shape

- classify each task by risk, required quality, context sensitivity, and expected token cost;
- choose the cheapest runtime that satisfies the quality gate;
- record estimated and actual monthly spend by model tier;
- require an escalation path when the cheap tier fails quality checks;
- produce a monthly keep-or-cancel recommendation for fixed plans versus API usage.

This PR is a reviewable starting point, not a live router.