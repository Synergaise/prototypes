# Payment-state reconciler

Prototype guardrail for reconciling PandaDoc completion/payment signals, proposal totals, engagement payment state and captured payment events before delivery or revenue reporting treats payment as settled.

The lane is deliberately conservative: it emits finance issues for founder/accounting verification instead of advancing delivery state itself.
