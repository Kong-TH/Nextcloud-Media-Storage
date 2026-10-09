# Changelog

## 2026-10-09 — Documentation baseline

Read the local implementation prompt and reference project's documentation structure. Created index, overview, agile backlog/planning/stories, software designs, operations manuals and development/requirements wiki before code.

Recorded absent PHP/Composer and unavailable Docker daemon access. Target Nextcloud release remains unknown. No implementation, migration execution, app enablement or runtime tests are claimed.

## 2026-10-09 — Installed target documentation

Confirmed installed Nextcloud 34.0.4 (Snap revision 54326), inspected public API source, and verified SELinux enforcing state. Updated compatibility, overview, Sprint 01 and troubleshooting docs. Runtime status remains unavailable because sudo requires a password; localhost port 80 did not accept a connection. No app implementation or runtime tests are claimed.

## 2026-10-09 — Phase 1 backend and executable checks

Initialized local Nextcloud 34.0.4 via supported web setup using Snap MySQL autoconfig. Verified installed status through HTTP and authorized occ. Executed PHP 8.4.26 through the bundled base loader.

Implemented app bootstrap/routes, authenticated management controllers, virtual hierarchy, owner-scoped persistence, Filesystem API binding/recovery, portable migration and foundation page. Added metadata configurator, Snap deployment script, 69 passing service/controller checks, SQLite migration schema/constraint/rollback checks and a deferred live integration harness. Template structure validates against installed Nextcloud metadata schema with fixture values.

App installation/enablement and live integration remain pending. Author/licence are not invented; appinfo/info.xml will be generated from the template after the owner supplies them. No external token, upload, Vue explorer or media delivery controls are claimed.

## Author attribution

Set the app metadata template author to Kongphai Wutthichaiya, as explicitly provided by the owner. Licence selection remains pending.

## Licence selection and installable metadata

The owner selected AGPL-3.0-or-later to align with Nextcloud. Added the full licence text, Composer licence and source SPDX notices. Generated appinfo/info.xml using author Kongphai Wutthichaiya and verified the installed Nextcloud metadata schema. Updated deployment packaging to include LICENSE.

## Live Phase 1 integration

User deployed/enabled mediastorage 0.1.0 successfully. Added and executed a reusable Python HTTP suite: 33 checks passed against Nextcloud 34.0.4 / Snap MySQL using non-admin sessions and real Filesystem/DAV fixtures. Verified cross-owner boundaries, CSRF/anonymous denials, concurrent duplicates/moves and physical-file preservation. Updated current compatibility and acceptance evidence. Earlier-version migration upgrades, other deployments and user-deletion lifecycle cleanup remain unverified/unimplemented.

## 0.2.0 — Secure API foundation (source, live upgrade pending)

Added scoped bearer credentials with one-time secrets, secure verifiers, expiry, revocation, rotation overlap and last use. Added session token management and narrowly isolated external endpoints with owner/folder/source/destination authorization under transaction locks. Restricted credentials cannot bind guessed physical IDs or alter their boundary. Added user-created/deleted listeners to purge only the exact owner's app rows and protect recreated UIDs.

Added incremental token schema, 61 passing local token/scope/lifecycle checks, populated SQLite schema upgrade checks and opt-in Phase 2 live HTTP acceptance. Fixed deployment sequencing to disable this app before copying and re-enable so pending migrations execute. Existing 69 checks pass; no 0.2.0 live upgrade/integration is claimed yet.

## 0.2.0 — Live upgrade and acceptance passed

User successfully upgraded mediastorage from 0.1.0 to 0.2.0. Executed the combined Phase 1/2 HTTP suite: 70 checks passed against Nextcloud 34.0.4 / Snap MySQL. Verified real token issue/expiry/revocation/rotation, scope/folder boundaries, session/CSRF isolation, last-used/no-store behavior, actual filesystem bindings and deletion/recreation isolation without affecting another owner. Test fixtures cleaned up. Updated current docs to distinguish this evidence from untested providers, lifecycle races and later-phase features.

## 2026-10-09 — Material skills and continuation handoff

Added nine project Material skills: button, extended FAB, card, dialog, divider, list, loading indicator, navigation drawer and navigation rail. All passed skill-structure validation; this does not claim runtime verification of UI assets. Recorded source gaps and distinctions between Expressive design and baseline web APIs.

Recorded the user's app-only Material UI direction and drawer-based bucket navigation. Bucket separation is a new requirement; virtual versus S3/MinIO semantics remain open. Added agent entry point, portable handoff, and planned Sprint 03 with migration/security/UI acceptance gates. Corrected stale current-state and licence guidance while retaining clearly historical checkpoints. No new application runtime code or tests were executed for this documentation update.

## 0.3.0 — Virtual buckets and production explorer

User confirmed virtual buckets and approved the responsive prototype for real implementation. Added incremental bucket persistence preserving the existing default root, session bucket APIs, bounded atomic metadata Copy, scoped-token bucket boundaries and owner cleanup. Added a locally bundled Vue/Material explorer for buckets/folders, existing-file DAV binding/rebind, reference actions, responsive drawer/search/toolbar/tooltips and token management. Original Nextcloud files remain unchanged. Upload, previews and binary delivery are deferred.

User installed 0.3.0 on initialized Nextcloud 34.0.4 / Snap MySQL; 91 live HTTP and 30 installed-frontend browser checks passed. Real host inspection identified drawer-close, closed-dialog visibility and content-height integration issues; corrected candidate assets passed 46 live browser checks. The user redeployed the final correction; all 46 checks passed again against installed assets with cache disabled and no interception. Local tests pass: 69 baseline + 23 bucket/copy, 66 token checks, populated SQLite migration checks, frontend rules and production build.

## 2026-10-10 — Dialog placement, green interaction states and file links

Explicitly centered native dialogs against Nextcloud's margin reset and mapped Material system roles to the plugin's green palette for hover/focus/pressed states. Kept heading colors app-scoped in both themes. Added Copy Nextcloud link beside Rebind for available bindings, with a stable authenticated native viewer URL and manual-copy fallback on clipboard failure. No public share, bearer credential, streaming route or schema change.

User deployed the revision. 96 actual-host browser checks passed against installed assets with cache disabled and no interception; build/frontend rules and 32 built-frontend HTTP-fixture regressions also passed. Native link authentication and physical-file preservation remain verified.

## 2026-10-10 — Correct Copy to use plugin virtual paths

User clarified that Copy means the plugin's path. Removed the native Nextcloud viewer-link helper and replaced the action with Copy virtual path, copying the exact server-derived bucket-relative virtual_path. Details shows bucket context separately; missing physical bindings do not invalidate virtual metadata paths. Clipboard success/failure and manual-copy fallback remain. Rename and Move are verified to update copied plugin paths independently of original filenames. Plugin media-URL delivery remains deferred. Candidate assets passed 96 actual-host browser checks. After user deployment, all 96 passed against installed assets with cache disabled and no interception.

## 0.3.1 — Invalidate cached frontend assets

Incremented release metadata after repeated same-version deployments left old browser UI. Confirmed actual installed JS/CSS matched the latest build, while Nextcloud's version-derived URLs were unchanged. Added a cache-enabled upgrade regression that requires new asset URLs and matching served bytes before exercising dialog/theme/path actions. No schema migration or host cache settings change. Build/rules/schema checks pass. User deployed 0.3.1; 99 browser checks passed against installed assets with cache enabled, including changed JS/CSS URLs and served-build byte equality. No restart or global cache clearing.

## 0.3.2 — Installed version in drawer footer

Removed both footer slogan lines. The drawer now shows only the installed plugin version supplied by IAppManager through PageController/template data to Vue. Incremented app/npm release metadata for asset cache invalidation. Production build, PHP syntax checks and 33 built-frontend HTTP-fixture checks passed. Installed verification pending user deployment. No schema/API change.
