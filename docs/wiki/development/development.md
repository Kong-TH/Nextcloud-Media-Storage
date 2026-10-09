# Developer Guide

Read the documentation index, current sprint and architecture decisions before code changes. Keep code, comments and technical documentation in English. Establish the target Nextcloud/PHP release before selecting packages. Use official frontend components compatible with that release.

Expected backend tooling: Composer, target-compatible PHP, PHPUnit and Nextcloud test bootstrap. Expected frontend tooling: Node, a lockfile and compatible Vue build tooling. None has been configured yet; do not treat speculative install commands as working setup.

Contributions should be narrow, preserve unrelated staged work, include meaningful tests for behavior/security changes, and update affected requirements, contracts, sprint status and changelog. Record actual test outcomes separately from planned checks.

Before public distribution choose a license with the owner, add contribution guidelines and a security reporting policy with a real private contact, and validate packaging. Do not invent ownership or contacts. No license grant is established by these docs.
