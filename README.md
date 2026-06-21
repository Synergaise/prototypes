# prototypes

Synergaise prototype sandbox, on the gated client-build rail (mirrors pipeline-pilot).

Caesar opens PRs against `main`; CI (incl. a mandatory gitleaks secret-scan) must pass;
a human merges. Caesar can never push to `main` or merge — branch protection + an MCP
`merge_pull_request` deny.
