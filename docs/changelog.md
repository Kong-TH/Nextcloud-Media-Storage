# Changelog

## Unreleased — 2026-10-21

- Add five application screenshots to `assets/screenshot/` and a Screenshots section to the README.
- Record the submitted App Store certificate request (nextcloud/app-certificate-requests#1361). No signing or publication was performed. No application code changes.

## 0.8.0 — User-accepted, 2026-10-10

- Review each selected folder independently: keep its wrapper or import its contents while preserving nested folders.
- Preview bounded destinations and reject planned/existing name conflicts before confirmation; show empty/unsupported outcomes.
- Reuse source-authorized deterministic entry retries, Stop and official Material progress; incrementally disclose review rows. No schema/API changes.
- Local validation and actual-host candidate evidence are recorded in the handoff. User confirmed the deployed feature works; this is not a new automated installed-suite result.

## 0.7.1 — Prepared, 2026-10-10

- Center picker checkboxes with file icons/labels and remove dialog field margins from selection controls.
- Passed 24 focused fixture checks, 14 actual-host candidate frontend checks, six frontend test files, build and 66 archive checks. Installed 0.7.1 acceptance pending root deployment.

## 0.7.0 — Verified, 2026-10-10

- Select multiple Nextcloud files/folders across navigation; select all eligible direct children after Home.
- Preserve folder structures and source names, with a single-file virtual alias and explicit unsupported/conflict outcomes.
- Add owner-locked per-entry import identities, partial retry, Stop and official Material linear progress.
- Passed 396 browser fixture checks, six frontend test files, backend import tests and 66 archive checks. Installed 0.7.0 passed 12 focused browser and 19 HTTP checks with dedicated account cleanup. UI-16 keep/flatten choices remain planned.

## 0.6.8 — Prepared, 2026-10-10

- Align detail labels, icons and values at row centers; reset inherited Nextcloud definition-list padding within plugin metadata.
- Add strict alignment and actual host-default CSS regression checks. Installed acceptance pending deployment.

## 0.6.7 — Prepared, 2026-10-10

- Redesign object metadata as compact, aligned icon rows with readable full paths.
- Ellipsize long selected dropdown values and expose full text through hover/focus tooltips.
- Build, five frontend test files, 373 browser fixture checks and 66 release archive checks pass. Installed acceptance pending deployment.

## 0.6.6 — Prepared, 2026-10-10

- Replace native dropdowns across object sort, token filters/sort and task destination/access fields with official Material Web selects.
- Keep popovers within the plugin theme and separate option Escape from parent dialog dismissal.
- Correct async initial destination labels and retain scroll when select focus returns.
- 341 combined browser fixture checks pass; installed acceptance pending deployment.

## 0.6.5 — Prepared, 2026-10-10

- Pin Objects/count/selected/Sort and column headings together as the existing two-row header.
- Give the sticky Object details/Close header 72px minimum height and vertical breathing room.
- Build and local browser regression pass; installed verification requires deployment.

## 0.6.4 — Prepared, 2026-10-10

- Keep the existing object column header visible at the top of its scroll area.
- Keep Object details heading and Close visible while independently scrolling long details.
- Restore scope-menu focus without jumping the scrolled object list.
- Preserve layout height with theme-matched sticky surfaces and keyboard scroll clearance; local checks pass, installed acceptance pending.

## 0.6.3 — Prepared, 2026-10-10

- Merge select-all and scope dropdown into the existing Name/Type/Binding header; remove the separate selection layer.
- Align checkbox/name controls with object rows, retaining one compact header on mobile and accessible scope feedback.
- Local validation passes; installed verification pending deployment.

## 0.6.2 — Prepared, 2026-10-10

- Add loaded/all-matching select-all modes with official Material Web dropdown, mixed state and exclusions.
- Resolve all selected metadata in revision-validated batches before commands, with progress and stale-collection recovery.
- Include unloaded objects in Copy/Paste, Move, Remove and single Rename; preserve remaining IDs after partial failures.
- Keep selection ephemeral and clear it on scope/history/reload changes; retain it when sorting.
- Installed verification pending deployment; UI-15/16 remain planned.

## 0.6.1 — UI-13 prepared, 2026-10-10

- Load Objects incrementally in 25-item batches, with global database sorting and loaded/total counts.
- Add append progress/retry, keyboard Load more and revision-change reload; preserve selection/scroll during append and bounded history restoration.
- Keep legacy listings compatible; no schema migration. Local acceptance is recorded separately from pending installed tests.

## 0.6.0 — prepared, 2026-10-10

- Add authorized single-byte-range delivery, ETag/Last-Modified and conditional responses.
- Stream bounded chunks with cleanup and native concurrency slots; apply native IP/grant/issuer/bearer request quotas with retry headers.
- Add optional exact-domain advisory hotlink policy while supporting headerless authorized backends.
- Local checks pass; installed acceptance is pending. No new schema or UI changes.

## 0.5.1 — HEAD representation headers

- Use a callback HEAD response so Nextcloud does not replace Content-Length with the empty-body length; preserve authorization and avoid opening a file stream.
- Installed 0.5.0 diagnostic acceptance passed 46 checks with HEAD excluded after reproducing this defect. Full installed 0.5.1 acceptance passed 47 temporary-access HTTP checks and 130 Phase 3 regression checks; dedicated accounts/originals cleaned.

## 0.5.0 — temporary media access (superseded by 0.5.1)

- Add owner-isolated, short-lived opaque read URLs for individual media references, one-time URL return and idempotent revocation.
- Session management retains CSRF; scoped external read tokens may issue bounded grants whose access follows issuer validity and current folder scope.
- Pin bucket/file/storage/content version; authorize every anonymous GET/HEAD and stream through official Files APIs without exposing original paths or long-lived tokens.
- Add migration 000500 and owner lifecycle cleanup. Existing virtual path copying and original-file operations are unchanged.
- Local tests/build pass; installed acceptance awaits deployment. Range/validators/throttling and hotlink policy remain US-MS-07.

## 0.4.1 — upload completion and location feedback

- Fix first-upload HTTP 500 caused by closing a stream already consumed by Nextcloud; preserve idempotent retry and original files.
- Show persistent upload success with the current original path and Open folder in Nextcloud action, including reconciled completion.
- Keep success when optional location lookup fails; provide a dismiss action and compact/RTL containment.
- Bump asset version for cache refresh; no schema or API change. Installed acceptance: 26 upload/preview HTTP checks and 257 cache-enabled actual-Nextcloud browser checks passed without asset interception.

## 0.3.9 — UI-03 browser navigation (prepared)

- Plugin URL/history restores buckets, nested folders, submitted searches, sorting, details and API tokens page on Back/Forward/reload.
- Restore breadcrumbs from authenticated current parent relationships; recover missing/cross-bucket destinations with feedback.
- Keep list scroll in namespaced history state; cancel stale requests and defer navigation until pending saves complete. No persisted credentials, schema or endpoint changes.
- Plugin-scoped Escape handling prevents Nextcloud shell shortcuts from suppressing dialog cancellation.
- Installed/warm-cache acceptance awaits privileged deployment.

## 0.3.8 — neutral bucket editor actions (prepared)

- Clear contents and Delete bucket use normal text/icon colors across enabled interaction states. Default deletion remains disabled; confirmations are unchanged.
- Bump asset version for cache refresh. No schema or API change.

## 0.3.7 — virtual bucket management (prepared, not deployed)

- Replace trailing X with a Material edit icon on every bucket, including Library; reveal on hover/focus.
- One editor for rename, Clear contents and Delete bucket, with explicit destructive confirmations and draft-preserving cancellation.
- Library can be renamed and cleared; Delete is disabled and backend-protected.
- Atomic owner-scoped metadata operations preserve identity on rename/clear, original files, other buckets and token boundaries. No migration.
- Supersedes undeployed 0.3.6 removal-only preparation. Installed acceptance awaits privileged deployment.

## 0.3.6 — virtual bucket removal (prepared, not deployed)

- Trailing Material X for additional buckets, revealed on row hover/focus; keyboard/touch access and RTL preserved.
- Named confirmation, protected Library and owner/CSRF-checked atomic subtree metadata removal.
- Preserve original physical files, links elsewhere and restricted-token boundaries; recover navigation/focus and clear stale clipboard sources.
- No schema migration. Installed browser/HTTP/cache acceptance remains pending deployment.


## 0.3.5 — token dashboard (installed verification complete)

- Four responsive token status summaries, name/status filters and expiry/name sorting; permissions, boundary and last-use metadata in the list.
- Additive authenticated lifetime-policy metadata shared with issuance; bounded expiry calendar and explicit local-date help/typed-date validation.
- Material Copy token action, manual-copy fallback and 24px secret/action separation.
- Versioned assets, no token schema or permission changes. Installed acceptance follows privileged deployment.


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

## 0.3.3 — Material controls and official icon font

- Replace native command/FAB/icon-button styling with actual pinned Material Web components; responsive toolbar uses labeled or icon variants.
- Add official bounded ripples to custom navigation, menus, picker and rounded full object rows without nesting checkbox/details controls.
- Render md-icon with an official locally bundled Google Material Symbols font subset and retained license; preserve Nextcloud CSP and shell.
- Update custom-element tooltip, keyboard and Tab focus handling; preserve FAB/menu insets and the installed-version-only footer from 0.3.2.
- Build/rules pass, 71 fixture checks and 134 real-host candidate browser checks pass. Deployment and installed warm-cache verification pending; no API/schema change.

0.3.3 installed verification (2026-10-10): after the user deployed, all **138 live Nextcloud browser checks passed with cache enabled and no candidate interception** (Chrome 154.0.8037.97). Both JS/CSS asset URLs changed from the recorded installed release and served bytes match the local build. The server supplies 0.3.3 and the drawer displays only v0.3.3. Official local icons/font and actual Material ripples load under host CSP; disabled/keyboard/menu/tooltip behavior, responsive toolbar/FAB geometry, light/dark dialog states and virtual-path/reference/token regressions pass. Installed mobile/desktop screenshots were visually inspected. The dedicated fixture account was removed and the harness exited successfully. Screen-reader, real touch and full zoom/contrast validation remain deferred.

## 0.3.4 — Labeled button spacing and compact picker navigation

Remove legacy Add bucket padding/gap overrides so Material labeled-button spacing is restored. Combine picker parent/root navigation and current folder name into one row using official icon buttons; preserve chosen reference/name and return focus after browsing. Extend the local official font subset with Back/Home and hash its asset URL by content. No API/schema changes. Build and verification results are recorded in the latest explorer/handoff sections; installed deployment remains pending.

0.3.4 preparation verified (2026-10-10): production build and frontend rule checks pass. 107 built-frontend fixture checks pass with 20 CSRF-backed API requests; 170 actual-Nextcloud candidate browser checks pass using local JS/CSS/font interception and disposable DAV folders. The original installed spacing failure was reproduced (53px Add bucket width, zero padding) before correction. Rendered Add bucket and labeled toolbar spacing, one-row picker navigation, root/pending disabled state, parent/Home keyboard behavior, focus return, long names, selection/name preservation and content-hashed font URL pass. Candidate desktop, dark compact picker and nested compact screenshots were visually inspected. Installed baseline is still 0.3.3; 0.3.4 deployment and installed warm-cache/font-byte verification remain pending. No API/schema changes.

## 0.4.0 — prepared, installed acceptance pending

- Add session uploads into each account's daily Media Storage folders with content/size/permission/quota checks and persistent owner-scoped retry journal migration.
- Add official Material upload controls, measured progress, Stop reconciliation and same-file retry without duplicating committed originals/references.
- Add authenticated Nextcloud thumbnails/details and session video content delegation to DAV, retaining virtual-only management semantics.
- Source validation: 45 new backend checks, existing suites, SQLite populated upgrade, build and 213 fixture browser checks. Installed upload/preview and warm-cache acceptance remain pending. No public/signed or external-token binary delivery.
