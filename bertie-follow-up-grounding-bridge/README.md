# Bertie follow-up grounding bridge

Prototype guard for owner-scoped follow-up drafting. It proves that a Bertie-owned client follow-up is only draftable when the system has Bertie's live Gmail thread access, a structured thread reference, and an active follow-up that has not already been resolved.

If a paying-client follow-up is blocked by missing owner inbox context, the check fails closed and marks it for escalation rather than drafting blind.
