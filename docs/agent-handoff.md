# Agent handoff — 2026-10-09

## Start here

The app is `mediastorage` 0.2.0. Phase 1 and Phase 2 backend work is implemented and live-tested. Phase 3 production explorer/upload UI has not started; a standalone responsive design study and implementation backlog now exist. This handoff and Sprint 03 supersede earlier historical paragraphs that say tokens or the live upgrade are pending.

Read the documentation index, [Sprint 03](agile/sprint-backlogs/sprint-03.md), architecture decisions, schema, API contract, security design, and tests/README.md. The original `.chat/prompt1.md` is ignored by Git and may not exist on another machine; the tracked docs plus this handoff carry the continuation context. Do not require the original Downloads knowledge folders or screenshot to apply the tracked skills.

## Latest user decisions

- Author: Kongphai Wutthichaiya. Licence: AGPL-3.0-or-later; retain third-party notices.
- The plugin's own area should feel friendly and easy to use through Google Material Design 3. Preserve Nextcloud's header, global navigation, and other host styling.
- Use Vue compatible with the target Nextcloud release. `@material/web` is the intended component direction; actual frontend dependencies/build integration are not installed yet. Check versions and real browser integration before claiming support.
- The user supplied navigation rail/drawer skills and prefers `md3-navigation-drawer` for bucket navigation, similar in structure to MinIO. Do not replace it with a rail merely because one is available.
- The reference layout has a left bucket list/filter/create action, main search, bucket heading and actions, breadcrumb, and object listing. It is a functional layout reference; the desired visual treatment is Material rather than an exact MinIO dark-theme copy.
- Buckets are a newly requested requirement in addition to folders. No bucket schema, migration, API, or production UI is implemented. The standalone study includes sample-only bucket creation.

## Responsive UI design study

The user requested mobile/desktop design using MinIO-like organization with Material styling. See [responsive plugin design](design/responsive-plugin.md), [interactive sample](design/prototype/index.html), [UI task backlog](agile/ui-tasks.md) and [study validation](design/validation.md). The proposal uses a standard drawer from 840px available app width, compact modal navigation below that, rows on narrow panes and optional desktop details from 1200px. Breakpoints use the plugin container, not device labels. The sample is standalone, uses in-memory data and changes no production template/API/storage. Preserve this distinction when reporting progress.

Use the Add FAB to open Add from Nextcloud or New folder; uploads/delivery remain unimplemented. Bucket destinations in the study are proposed only. Production can begin with the existing owner-root Library while bucket semantics are unresolved. Chrome study checks passed; actual Nextcloud integration, screen-reader, touch and full zoom/contrast validation remain pending.

## Latest action revision — documentation updated before code

The user requests a creation FAB combining Add from Nextcloud and New folder, contextual md3-toolbar for Move/Copy/Paste/Remove links and single-reference Rename, md3-tooltip hover/focus feedback without dismissing open menus, and approximately +3px small desktop text. See [reference action specification](design/reference-actions.md). These commands affect plugin metadata only; many independently named links may share one physical Nextcloud file. Dedicated source-reference Copy/Paste is not implemented and requires a validated backend contract. Existing move/rename/remove semantics remain virtual-only.

The user corrected the skill name and confirmed `.agents/skills/md3-extended-fab/`; use that skill with md3-menu for the creation menu. The standalone prototype now implements this action revision on sample data. In-memory reference-model tests and 71 Chrome/CDP UI checks passed; snapshots are refreshed. Production source/template/API behavior is unchanged, and backend Copy/Paste remains pending. See design/validation.md for exact evidence and limitations.

## Latest layout revision

The standalone study uses one title/search header, nested-only breadcrumbs, symmetric content insets and a bottom action band. See [layout refinement](design/layout-refinement.md), recorded before code changes.

Current user decision: hide Add FAB whenever selection or clipboard context displays the toolbar, on **every width**. This supersedes earlier compact stacking/menu-over-toolbar requests. The separate 56px trailing X clears selection and clipboard together, closes overlays and restores Add focus. Toolbar and X share the existing bottom action band without reducing list height or adding compact scroll-end padding. Mobile keeps equal 24px group insets and adaptive command packing (five commands fit at 390px); overflow contains only hidden commands. Actual footer space, resize/font/group changes and focus/menu stability are measured. FAB insets remain 29px desktop and 24px compact when visible.

The + Add button beside Buckets opens a sample-only bucket dialog with empty/duplicate validation and focus restoration. Sample destinations reset on reload; production storage semantics/persistence remain unresolved. Current study: 332 Chrome checks passed, including all-width FAB/toolbar exclusion, selection-only/clipboard-only/combined cancellation, both Add entries after cancellation, nine viewports, short heights, adaptive packing, keyboard, tooltip/menu, RTL and reduced motion. Snapshots were refreshed and mobile visually inspected. Production integration remains pending.

Latest menu correction: intrinsic width prevents fixed-position menus from changing size after placement. FAB menu trailing edges now align with FAB (RTL included), preserving the 29px desktop inset and compact geometry; very narrow menus clamp inside the viewport. Initial/repeated opens and live resize are measured. Current standalone evidence is **365 Chrome checks passed**, with desktop/mobile menu snapshots visually inspected. See design/validation.md; production integration remains pending.

## Bucket question still open

The user has not answered whether buckets are virtual namespaces inside this plugin or real S3/MinIO buckets. The existing product uses Nextcloud storage and must not duplicate its storage engine. The proposed default is **owner → virtual bucket → virtual folders → file references**, with a separate root per bucket, but this is a proposal, not an accepted architecture.

Resolve the meaning before implementing bucket persistence/storage. Continue independent work such as the frontend build, design tokens, or a clearly labeled UI prototype while awaiting that answer. Do not silently add S3 infrastructure or describe virtual buckets as real object-storage buckets.

For virtual buckets, document naming/uniqueness, stable IDs, default bucket and populated 0.2 upgrade mapping, cross-bucket moves/bindings, removal semantics, API compatibility, path/URL qualification, token boundary behavior, owner cleanup, and transaction/concurrency rules before implementation. Folder-scoped tokens must not gain access because a node moves between bucket boundaries. Bucket/root IDs remain owner-scoped; removal must preserve physical files.

## Verified baseline and limits

Historical execution on this host: Nextcloud 34.0.4, Snap revision 54326, PHP 8.4.26, SELinux enforcing, Snap-configured MySQL (exact server version not queried). App upgrade 0.1.0 → 0.2.0 succeeded.

- `sh scripts/php-snap.sh tests/run.php`: 69 checks.
- `sh scripts/php-snap.sh tests/tokens.php`: 61 checks.
- `sh scripts/php-snap.sh tests/schema.php`: passed, including populated SQLite schema upgrade and re-entry.
- `MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PHASE=2 python3 tests/http_integration.py`: 70 live HTTP checks.
- All nine tracked Material skills passed `quick_validate.py`; this is documentation validation, not rendering/build verification of supplied navigation assets.

Existing backend: owner-isolated virtual hierarchy, Nextcloud file binding/rebind, virtual-only deletion, secure scoped token issue/list/revoke/rotate, bearer-only external metadata APIs, and owner-deletion/recreation cleanup. Browser management uses session authentication and CSRF. Restricted bearer scopes and physical File ID boundaries are already enforced.

Not implemented: bucket model; Vue explorer; upload transport; previews/player integration; token dashboard; signed media URLs; media streaming/ranges; rate limiting; hotlink policy UI. `media:upload` is reserved, not an available upload endpoint. Metadata resolution is not binary delivery. Other actual database/server deployments and wider lifecycle races remain unverified.

## Next implementation sequence

1. Resolve and document bucket semantics, then update schema/API/security/upgrade design and backlog before bucket code.
2. Establish reproducible Vue + Material Web frontend build and app asset loading compatible with Nextcloud 34. Verify CSP and locally bundled assets; no core edits or blanket document CSS reset.
3. Build an app-scoped theme and drawer/object-browser shell. Desktop drawer and compact modal drawer need keyboard/focus/RTL checks; use available plugin width rather than assuming the entire browser belongs to the app.
4. Implement approved bucket backend with incremental migration and regression checks, then connect bucket and folder navigation/CRUD to real session endpoints.
5. Add existing-file binding/recovery and token-management UI. Display new secrets once, never persist/log them in browser storage; keep external credentials out of browser calls.
6. Implement upload through supported Nextcloud Filesystem APIs with size/MIME/permission validation, followed by preview integration against real host APIs.
7. Add copyable media access only when its delivery path exists. Do not fabricate a working public or signed URL before Phase 4; label available metadata/path actions accurately.

For each slice, keep docs synchronized and record meaningful observed checks. Work incrementally; do not call the full explorer complete after building the shell.

## Skills available in the repository

`md3-button`, `md3-extended-fab`, `md3-card`, `md3-dialog`, `md3-divider`, `md3-list`, `md3-loading-indicator`, `md3-menu`, `md3-radio`, `md3-search`, `md3-switch`, `md3-text-field`, `md3-toolbar`, `md3-tooltip`, `md3-navigation-drawer`, `md3-navigation-rail`.

Each newly created component skill includes do/don't guidance and source limits. Cards need semantic custom HTML/CSS unless installed APIs prove otherwise. Extended FAB uses `md-fab` with `label`. Expressive loading morphs need custom work or an explicitly labeled baseline progress fallback. Some downloaded pages were duplicated/mislabeled/empty; provenance files record these gaps. The drawer skill has a contradictory width/padding arithmetic sentence; verify source measurements rather than blindly copying it. Library APIs/tokens must be verified against the installed version.

Menu preparation: `md3-menu` was added after studying all four supplied menu captures and cross-checking Material Web and WAI-ARIA. It distinguishes baseline web support from Expressive design, covers do/don't rules and accessibility, and records missing token details. This is skill preparation only; no menu UI or frontend build is implemented.

Radio preparation: `md3-radio` covers single-choice groups, default versus unanswered state, density, keyboard/form behavior and the Material Web label warning. The supplied apparent Overview is a duplicate Specs capture; provenance records this gap. Skill validation passed; no radio UI or browser integration was executed.

Search preparation: `md3-search` covers contained/divided styles, docked/full-screen layouts, focus/announcements, async query state and actual name-search scope. All four supplied Search captures were studied; Web availability is marked unavailable, so implementation requires custom composition rather than invented md-search APIs. Skill validation passed; no search UI or browser integration was executed.

Switch preparation: `md3-switch` covers independent binary settings, track/handle/target sizes, stable labels, keyboard/form behavior and async persistence. Supplied -3/-4 captures both contain Accessibility; Guidelines content remains unavailable. Material Web label and event-documentation caveats are recorded. Skill validation passed; no switch UI or browser integration was executed.

Text-field preparation: `md3-text-field` covers filled/outlined variants, persistent labels, helper/error regions, textareas, readonly fields, affixes, counters and accessible validation. All four supplied pages were studied. References record Material Web external-label limitations, image-source issues and the project UTF-8 byte limits. Skill validation passed; no text-field UI or browser integration was executed.

Toolbar preparation: `md3-toolbar` covers docked/floating Expressive designs, action hierarchy, responsive overflow, geometry, FAB pairing and composite keyboard focus. All four supplied pages were studied and relevant specification images inspected. References record web placement exceptions, Material/APG keyboard differences and the unavailable web component. Skill validation passed; no toolbar UI or browser integration was executed.

Tooltip preparation: `md3-tooltip` covers plain/rich variants, geometry, placement, transient/persistent behavior and accessible hover/focus dismissal. All four supplied pages and both measurement images were studied. References distinguish noninteractive tooltip semantics from interactive rich popups, record the exit-delay interpretation and unavailable web component. Skill validation passed; no tooltip UI or browser integration was executed.

## Environment and secrets

On this host the app URL is `http://127.0.0.1/index.php/apps/mediastorage/`. It is local test infrastructure, not a portable hosted URL. `/tmp/mediastorage-nextcloud-admin.json` held disposable test credentials; it is untracked, machine-local, and may disappear after reboot. Do not copy secrets into docs/Git or assume this file exists on another machine. Obtain authorized test credentials on the destination environment if necessary.

`php-snap.sh` uses the Snap PHP/base loader for local checks; it does not recreate the confined service environment. The PHP CLI live harness remains unexecuted; live evidence comes from Python HTTP tests. Live tests create/delete disposable fixture accounts/files; use the explicit disposable flag only against an authorized test instance.

Root deployment on this host: `sudo sh scripts/deploy-snap.sh`. The script disables the app, copies package files, then enables it to run migrations. Current sudo permissions may allow inspection only; do not assume passwordless deployment or request that the whole coding agent run as root. Discover the destination runtime afresh on another machine.

## Git continuation

Phase 1: `81a917e`. Phase 2: `f57a04c`. Material skills: `4441b57`. Branch: `main`. Remote: `https://git.kohtnas.com/publicgroup/nextcloud-media-storage.git`.

The user authorized committing and pushing the handoff and skills on 2026-10-09. Consult Git log/status for the final handoff commit and synchronization; do not reuse that authorization as an unconditional instruction to push future work. Inspect local changes before continuing and preserve unrelated edits.


Latest row feedback correction: the primary action extends through row whitespace and hover/press/keyboard focus feedback spans the whole row. Keep sibling checkbox/info actions independent and preserve dimensions/insets. Current standalone evidence: **383 Chrome checks passed**, including desktop/mobile, RTL/dark theme and existing regressions. Mobile row feedback screenshot visually inspected; production integration remains pending.
