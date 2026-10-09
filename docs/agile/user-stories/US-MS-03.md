# US-MS-03: Filesystem bindings

Phase: 1. Status: Implemented; local Nextcloud 34.0.4 live checks passed; extended acceptance pending.

As a user, I can reference accessible Nextcloud media and recover broken bindings.

## Acceptance criteria

Resolve within authorized owner/storage context; reject missing, ambiguous and unauthorized files; explicitly rebind; allow multiple references; verify reference deletion never deletes physical media.

## Evidence

Service/controller unit checks, SQLite schema checks and 33 live HTTP checks passed. App 0.1.0 is enabled on Nextcloud 34.0.4 / Snap MySQL. Upgrade and wider deployment evidence remain pending. Track delivery in [Sprint 01](../sprint-backlogs/sprint-01.md).
