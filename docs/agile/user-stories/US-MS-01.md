# US-MS-01: Native app foundation

Phase: 1. Status: Implemented; local Nextcloud 34.0.4 live checks passed; extended acceptance pending.

As an administrator, I can enable a native app compatible with my installed Nextcloud release.

## Acceptance criteria

Verify installed release and public interfaces; create valid metadata, bootstrap, authenticated page and migrations; test app enablement, migration install/upgrade and isolation from core tables.

## Evidence

Service/controller unit checks, SQLite schema checks and 33 live HTTP checks passed. App 0.1.0 is enabled on Nextcloud 34.0.4 / Snap MySQL. Upgrade and wider deployment evidence remain pending. Track delivery in [Sprint 01](../sprint-backlogs/sprint-01.md).
