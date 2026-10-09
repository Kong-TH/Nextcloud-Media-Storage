# US-MS-02: Virtual hierarchy

Phase: 1. Status: Implemented; local Nextcloud 34.0.4 live checks passed; extended acceptance pending.

As a user, I can organize media independently of physical folders.

## Acceptance criteria

Test root/nested creation, listing/search, rename/move/delete and path resolution; reject duplicate siblings, traversal, cycles and cross-user access; test concurrent mutations; preserve physical file locations.

## Evidence

Service/controller unit checks, SQLite schema checks and 33 live HTTP checks passed. App 0.1.0 is enabled on Nextcloud 34.0.4 / Snap MySQL. Upgrade and wider deployment evidence remain pending. Track delivery in [Sprint 01](../sprint-backlogs/sprint-01.md).
