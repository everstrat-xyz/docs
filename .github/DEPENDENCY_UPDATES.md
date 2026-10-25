# Dependency updates and audits

## Version updates

Dependabot checks the root Bun project every day at 09:00 in Europe/Warsaw,
including weekends. New releases must be at least seven days old before they are
eligible for a version update. Updates are separate pull requests, with at most
five open Bun version-update pull requests.

GitHub Actions are checked on Mondays at 09:30 with a seven-day cooldown and a
limit of two open version-update pull requests. Action references are pinned to
full commit SHAs; keep the version comments synchronized when updating them.

Review each pull request and run the relevant lint, type, test, and build checks
before merging. The audit workflow checks advisories; it does not replace those
compatibility checks. No workflow enables auto-merge.

## Security coverage

The dependency graph, Dependabot alerts, and Dependabot security updates are
enabled in repository settings. Keep them enabled; they are separate from
`dependabot.yml`.

Bun supports Dependabot version updates, but GitHub currently does not support
security updates for the Bun ecosystem or native dependency-graph ingestion of
`bun.lock`. Alerts based on `package.json` do not provide complete coverage of the
locked dependency tree. The Bun audit job checks that tree separately.

The dependency audit workflow runs on dependency-related pull requests, relevant
pushes to `main`, manually, and hourly at minute 17 UTC. Scheduled runs start
after the workflow is merged into the default branch and may be delayed by
GitHub. Audits include development dependencies and fail on known vulnerabilities
of any severity or registry/network errors. They read lockfiles without installing
project dependencies or running their lifecycle scripts.

Run the same checks locally:

```sh
bun audit --audit-level=low
```

Inspect failed runs in Actions and configure GitHub Actions failure notifications
for the maintainers who should receive them. Dependabot alert notifications are
configured separately in GitHub notification settings.

## Responding to findings

Check the advisory, affected locked versions, and available fixes. Update the
dependency or its parent and any blocking `overrides`, regenerate the affected
lockfile, and rerun the audit and compatibility checks. A confirmed urgent Bun
security fix must be handled manually rather than waiting for the cooldown.
Do not silently bypass findings with `continue-on-error` or production-only scans.

Audits rely on known registry advisories. A clean report and an older release do
not guarantee the absence of malicious code. This setup does not add a second
root lockfile or automatically change dependency versions.

## References

- [Dependabot ecosystem support](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories)
- [Dependency graph ecosystem support](https://docs.github.com/en/code-security/reference/supply-chain-security/dependency-graph-supported-package-ecosystems)
- [Dependabot options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
- [Bun audit](https://bun.sh/docs/pm/cli/audit)
