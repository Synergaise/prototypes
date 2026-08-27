# QuarterChase

Prototype operations layer for UK accountancy practices managing Making Tax
Digital quarterly updates.

This slice models the part of the product that is hardest to fake in a generic
client portal: a quarter-aware triage board for app-averse landlord and CIS
clients, plus approval-ready chase drafts. It does not file anything with HMRC
and does not send messages.

## What It Does

- normalises client records into the four 2026-27 MTD quarterly deadlines;
- scores each client as red, amber, green, or filed for the next relevant
  deadline;
- produces a chase queue ordered by urgency and value at risk;
- drafts short chase messages for founder/practice review.

## Intended Gate

Use this as the design-partner prototype once the first cleared founding-cohort
payment lands. The initial buyer promise is operational clarity and approved
client chasing for the 7 November 2026 deadline, not a replacement for filing
software.
