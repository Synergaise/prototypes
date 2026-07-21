# Opportunity Pipeline Integrity

Prototype health check for the client/opportunity split.

It fails closed when opportunity reads break, flags prospect rows that have leaked into active clients, and emits repair actions that can be logged without silently mutating the pipeline.
