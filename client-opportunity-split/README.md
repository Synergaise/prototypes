# Client opportunity split

Prototype scaffold for separating real clients from unapproved lead-mining targets in the Agency OS.

## Boundary

- clients: contracted, active, past, or otherwise commercially accepted customers;
- opportunities: inbound prospects, outbound prospects, mined targets, or unapproved leads;
- public web lead-mining rows migrate into opportunities unless there is an accepted engagement.

The split preserves source, direction, approval/outreach status, owner, confidence, next action, and conversion path so mined targets stop polluting client views.
