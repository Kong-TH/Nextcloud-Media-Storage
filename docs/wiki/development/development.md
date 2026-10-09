# Developer Guide

Read the documentation index, current sprint and architecture decisions before code changes. Keep code, comments and technical documentation in English. Establish the target Nextcloud/PHP release before selecting packages. Use official frontend components compatible with that release.

Expected backend tooling: Composer, target-compatible PHP, PHPUnit and Nextcloud test bootstrap. Expected frontend tooling: Node, a lockfile and compatible Vue build tooling. None has been configured yet; do not treat speculative install commands as working setup.

Contributions should be narrow, preserve unrelated staged work, include meaningful tests for behavior/security changes, and update affected requirements, contracts, sprint status and changelog. Record actual test outcomes separately from planned checks.

Before public distribution choose a license with the owner, add contribution guidelines and a security reporting policy with a real private contact, and validate packaging. Do not invent ownership or contacts. No license grant is established by these docs.

## Current executable workflow

Backend requires PHP >=8.2; the actual test CLI is 8.4.26. The app uses Nextcloud-provided classes and no additional runtime packages. `composer.json` defines PSR-4 and a test script; Composer itself is still unavailable locally. Use `sh scripts/php-snap.sh tests/run.php` and `sh scripts/php-snap.sh tests/schema.php` on this host. See [tests](../../../tests/README.md) for the actual integration gate.

No frontend dependencies were selected prematurely: Phase 1 has a server-rendered foundation page; Vue explorer work belongs to Phase 3.
