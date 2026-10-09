# Project Overview — Nextcloud Media Storage

Updated: 2026-10-09

## Product and scope

One native Nextcloud application, ID `mediastorage`, provides a virtual image/video hierarchy independent of physical files. Nextcloud remains the storage, identity, and database provider. Multiple virtual references may point to one physical file.

External backends will use scoped bearer tokens. Browsers will use a backend proxy or resource-specific temporary URLs. All media is private by default. Hotlink checks are advisory browser protections, never authentication.

## Current state

Phase 1 backend code now exists: app bootstrap/routes, session-protected controller endpoints, portable migration, virtual hierarchy, owner-context file binding/recovery, strict-double tests, SQLite schema checks and a live integration harness. The explorer, upload workflow, API tokens, signed URLs and media delivery are not implemented.

The local Snap test instance is initialized: Nextcloud 34.0.4, PHP 8.4.26, SELinux enforcing. 69 service/controller checks and the schema suite pass. The app is enabled as version 0.2.0; 70 live HTTP checks passed against the actual Nextcloud database/filesystem and the 0.1-to-0.2 upgrade succeeded. The wider compatibility matrix remains pending.

## Delivery phases

1. App foundation: version verification, app bootstrapping, migrations, virtual hierarchy, filesystem integration, core tests.
2. Secure API: token lifecycle, scopes, owner isolation, secure operations and security tests.
3. Explorer: navigation, upload, binding/recovery, preview, URL copying and token UI.
4. Delivery: signed URLs, advisory hotlink protection, abuse controls, range streaming and private caching.
5. Release: integration/database matrix, security review, packaging and contribution policies.

## Decisions still needed

Use Nextcloud 34.0.4 as the initial target; confirm app enablement and live integration. Choose dependency versions against that release. Author is Kongphai Wutthichaiya and the owner selected AGPL-3.0-or-later; retain third-party notices before distribution. Establish a private vulnerability reporting channel before release.

## Completion rule

Each feature needs implementation, meaningful tests, documented limitations, and status updates. No version or database support is claimed until tested on the corresponding environment.

## Test environment update — 2026-10-09

Nextcloud Snap revision 54326 is installed and contains Nextcloud 34.0.4. SELinux is enforcing. Public filesystem/bootstrap/migration interfaces were inspected in installed source. App enablement, PHP runtime, database, and instance initialization remain unverified; see [compatibility evidence](software/06-compatibility-and-testing.md).

## Project author

The owner confirmed the app author as **Kongphai Wutthichaiya**. The owner subsequently selected AGPL-3.0-or-later to align with Nextcloud; the full licence is included in the repository.

## Live Phase 1 verification

The user ran the prepared root deployment script successfully: `mediastorage 0.1.0 enabled`. The live HTTP suite then passed 33 checks using dedicated non-admin accounts. It exercised actual app queries, filesystem bindings, authentication/CSRF and concurrent operations on the Snap MySQL instance. The suite removed its virtual references, physical fixtures and test accounts; empty owner roots may remain.

## Phase 2 source — awaiting live upgrade

Version 0.2.0 source implements token lifecycle, scoped bearer JSON APIs and user metadata lifecycle cleanup. Local tests: 69 Phase 1 checks plus 61 new token/security checks; SQLite incremental upgrade passed. The deployed instance remains verified at 0.1.0 until root redeployment. The Vue explorer, upload workflow, binary streaming and signed URLs are future phases.

## Phase 2 live completion

App 0.2.0 deployed successfully. The combined HTTP suite passed 70 checks on Nextcloud 34.0.4 / Snap MySQL, including token lifecycle and user-ID recreation isolation. Local checks total 130 plus migration/schema checks. The next roadmap phase is the Vue virtual file explorer and upload/binding/token-management UI. This verification does not make the app production ready; media delivery, abuse controls and the release matrix remain future work.
