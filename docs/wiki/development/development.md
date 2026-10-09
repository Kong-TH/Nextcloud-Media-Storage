# Developer Guide

Read the documentation index, current sprint and architecture decisions before code changes. Keep code, comments and technical documentation in English. Establish the target Nextcloud/PHP release before selecting packages. Use frontend components compatible with that release; the latest user choice is app-scoped Material 3 with @material/web, while preserving the Nextcloud shell. Read [agent handoff](../../agent-handoff.md) first.

Expected backend tooling: Composer, target-compatible PHP, PHPUnit and Nextcloud test bootstrap. Expected frontend tooling: Node, a lockfile and compatible Vue build tooling. None has been configured yet; do not treat speculative install commands as working setup.

Contributions should be narrow, preserve unrelated staged work, include meaningful tests for behavior/security changes, and update affected requirements, contracts, sprint status and changelog. Record actual test outcomes separately from planned checks.

The owner selected AGPL-3.0-or-later and author Kongphai Wutthichaiya. Before public distribution retain third-party notices, add contribution guidelines and a security reporting policy with a real private contact, and validate packaging. Do not invent contacts.

## Current executable workflow

Backend requires PHP >=8.2; the actual test CLI is 8.4.26. The app uses Nextcloud-provided classes and no additional runtime packages. `composer.json` defines PSR-4 and a test script; Composer itself is still unavailable locally. Use `sh scripts/php-snap.sh tests/run.php`, `sh scripts/php-snap.sh tests/tokens.php`, and `sh scripts/php-snap.sh tests/schema.php` on this host. See [tests](../../../tests/README.md) for the actual integration gate.

No frontend dependencies were selected prematurely: Phase 1 has a server-rendered foundation page; Vue explorer work belongs to Phase 3.
