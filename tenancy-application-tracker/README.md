# Tenancy application tracker

Prototype wedge for the founder-approved lettings idea: make the tenancy
application itself the source of truth instead of forcing tenants and landlords
to chase letting agents and referencing firms.

This first slice is deliberately narrow:

- models the shared application timeline seen by tenant and landlord;
- enforces the Tenant Fees Act holding-deposit cap of one week's rent;
- exposes one clear next action and owner at each stage;
- keeps blockers explicit rather than hidden in agent/reference-provider inboxes.

It is not a marketplace, payment processor, right-to-rent system, or live
referencing integration. Those stay behind later research and compliance gates.
