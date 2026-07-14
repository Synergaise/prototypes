# System alert triage lane

Prototype scaffold for classifying non-client operational notices before they reach founders.

## Providers

PandaDoc, Google Workspace, Stripe, Supabase, Make/n8n, GitHub, and OpenClaw/Gateway alerts are handled as system events, not client correspondence.

The lane records durable incidents for provider, auth, security, payment, and contract automation blockers; suppresses newsletters and routine notices; and escalates only true blockers such as webhook deactivation or auth coverage failure.
