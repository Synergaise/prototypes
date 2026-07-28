# Client follow-up deferred-state guard

Prototype guard for the client-followups lane.

Problem: a client can reply with a legitimate deferral, budget pause, no-reply-needed
state, or future payment date, but the next follow-up cron may still treat the lane as
silent and mark it cold after two unanswered nudges.

This module classifies the lane before the cold guard runs:

- suppress follow-up when recent state says parked/deferred/no reply needed;
- suppress follow-up when a future expected payment date exists;
- mark cold only when there is no deferred state and the unanswered-nudge count reaches
  the guard threshold;
- otherwise allow normal follow-up cadence.

First target case: Knight Bain, where budget-deferred / parked context should have
suppressed a false `followup_cold` note.

The prototype only returns classification. It does not send emails, alter client stages,
or move money.
