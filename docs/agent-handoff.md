## US-MS-08 exact-archive acceptance — 2026-10-10

User authorized committing US-MS-07 and proceeding to US-MS-08. Commit 938bd57 records US-MS-07 acceptance without push. Exact 0.8.0 archive installation, populated 0.2.0 upgrade and paired maintenance-mode SQLite backup/restore are now verified in disposable official-image containers. The release harness passed 197 checks; child suites passed 76 access HTTP, 31 streaming/policy HTTP and 19 native-player browser checks on the restored exact archive. Every installed archive member and served JS/CSS matches. Local packaging passed 66 checks, six frontend test files pass and npm audit reported zero advisories. No production PHP/schema/API/frontend change and no Snap redeployment are required by this slice.

Actual added target: Nextcloud 34.0.4 / PHP 8.5.11 / SQLite. Primary Snap target remains Nextcloud 34.0.4 / PHP 8.4.26 / MySQL. Local Nginx forwarding preserves range/conditional/error status and configured Apache/Nginx access logs omit known secrets. Original files, old nodes/bindings/tokens and grant authorization survive paired restore. Containers/anonymous volumes and private backup/credentials were removed successfully. Official image OPcache revalidation is 60 seconds; restart web workers after code replacement before acceptance. SELinux remains enabled; use Docker copy rather than denied host bind mounts for fixture configuration.

Read [the exact artifact report](release/0.8.0-readiness.md) before release. US-MS-08 remains open for actual production TLS/proxy/trusted-IP/error/tracing logs, load/memory/stalled-storage/crash behavior, production MySQL backup/restore, the chosen support matrix and manual UI-10 gates. Other database/version combinations are unclaimed. Screen-reader testing remains excluded. No signing/publication/push was performed.

## US-MS-07 installed acceptance — 2026-10-10

US-MS-07 is verified on installed Media Storage 0.8.0 / Nextcloud 34.0.4 / PHP 8.4.26 / Snap MySQL. No production code, schema, API or asset changes were needed for this acceptance slice.

- `tests/access_http.py`: **76 live checks**, including exact ranges, conditional precedence, HEAD, revoked metadata denial and the default native grant quota (120 HEAD requests, then 429 with Retry-After).
- `tests/streaming_http.py`: **31 live checks**, including a 64 MiB source with exact distant bytes, actual TCP-backpressured concurrent streams, per-grant/IP/issuer limits, cancellation/rejection lock cleanup, per-grant ETag isolation, configured hotlink allow/deny, invalid-policy failure and owner/original preservation.
- `MEDIASTORAGE_TEST_STREAMING_ONLY=yes node tests/frontend/live.mjs`: **19 installed browser checks**, including the displayed/server version check and anonymous native MP4/WebM metadata, exact ranges, HEAD/304, playback and seek. The harness clears cookies and uses a neutral same-origin page, disposing of app session-expiry navigation; it does not substitute the session DAV bridge or intercept candidate assets.
- `sh scripts/php-snap.sh tests/streaming.php`: **61 local streaming/protection checks**, plus 64 access and 76 token checks.
- `MEDIASTORAGE_TEST_PHASE=3 python3 tests/http_integration.py`: **130 live regression checks**; dedicated account/original cleanup completed.

All live harnesses exited successfully and removed their dedicated accounts/originals. The policy suite restored all five changed app settings, including absence of previously unset keys. These results establish the recorded direct local target, not a proxy/CDN/load or database/version matrix, memory benchmark, crash-recovery certification or independent security review. Those remain US-MS-08 gates. UI-10 physical mobile/keyboard, actual browser zoom and full-state contrast remain open; screen-reader testing remains excluded by user decision.

## UI-16 user acceptance and commit authorization — 2026-10-10

User confirms the deployed UI-16 works and authorizes committing 0.8.0. This records user acceptance after the deployment request, not an automated installed-byte or full installed-suite result. UI-01–16 feature implementation is complete; UI-10 physical mobile/keyboard, actual browser zoom and full-state contrast acceptance remains open (screen-reader testing excluded by user). Next technical work is US-MS-07 installed streaming/protection acceptance, followed by US-MS-08 exact-archive installation/upgrade, compatibility matrix, security/proxy/load review and backup/restore verification. Publishing/signing is a separate pending release action; no push is authorized by this checkpoint.

## UI-16 — Per-folder import review, prepared 0.8.0, 2026-10-10

User authorized committing UI-15/alignment and continuing to UI-16; checkpoint 7fe4612 was created without push. UI-16 replaces the picker body in the same dialog with independent official Material select fields for effective source roots. Keep folder preserves the wrapper; Import contents here removes only that wrapper and preserves nested folders. Selected descendants follow their ancestor once. Prepare builds a bounded plan and shows destinations, unsupported/empty outcomes and exact counts before confirmation. Back/Edit choices are available before writes; after writing starts only same-operation Retry/Close can change the lifecycle. Stop retains confirmed references and waits for an in-flight write. The task remains memory-only, explicitly disclosed; Close/reload cannot resume it. Originals are unchanged.

Duplicate planned sibling names and existing destination names are checked before writes, using revision-validated 25-row destination pages (maximum 10000 destination entries), then rechecked on confirmation. Per-entry authorization/atomic conflict checks remain authoritative under races. Existing 1000 scanned source / 128-level / 2 MiB listing bounds remain. Review/preview initially render 25 rows with scroll and button disclosure. No schema or endpoint changes.

Validation: build, six frontend test files (ten-file roots, all keep/contents combinations, nested-only/empty/unsupported folders, overlap, duplicate names, exact/over source and depth bounds, revision changes and partial continuation), 19 PHP import checks plus 69 baseline checks, and 66 archive checks pass. Combined fixture regression passed 441 checks (1040 CSRF-backed fixture requests) before the final heading-color correction; the final focused fixture suite passed 69 checks, and 26 actual-host candidate checks passed after correcting the host heading-color override. Dedicated Nextcloud test account cleanup completed; desktop/light and 320 px dark/RTL screenshots were visually inspected. Installed 0.8.0 acceptance requires privileged deployment. Physical mobile, full zoom/contrast and wider release gates are not claimed. No UI-16 commit/push.

## User checkpoint — 2026-10-10

User confirms picker alignment is correct after the 0.7.1 deployment request and authorizes committing UI-15/alignment before implementing UI-16. This is user-observed alignment acceptance, not a new automated installed-byte check. No push requested.

## Picker checkbox alignment — prepared 0.7.1, 2026-10-10

User reported checkboxes sitting above their file rows. Generic plugin dialog label/input rules overrode the selection label grid and added asymmetric 8px/24px input margins, expanding rows and displacing their centers. Restore grid centering and zero label padding/margins and checkbox margins only within multi-source picker rows; preserve independent navigation and selection targets. No API/schema/architecture changes. Regression assertion failed on 0.7.0 before the fix. Build, six frontend test files, 24 focused browser fixture checks and 66 archive checks pass. Candidate frontend on actual Nextcloud passed 14 focused checks with dedicated account cleanup, including checkbox/button center offsets below 1px at 1440/390/320 px; desktop/light and compact/dark/RTL screenshots were visually inspected. Candidate asset interception does not establish installed 0.7.1: root deployment remains pending. No commit/push.

## UI-15 — Multi-source Nextcloud picker, verified 0.7.0

Authorized after checkpoint d9f2d18 (UI-13/14 and UI refinements through 0.6.8). Implemented independent source checkboxes, select-all after Home, selection across folders and a single-file virtual alias field. Multi-item imports retain source names, preserve folder structures and include selected descendants only once. Unsupported descendants are counted; conflicting names are never overwritten. Sequential source-authorized writes use owner-locked request/source identities so lost-response retries reuse existing references. Official Material linear progress covers bounded enumeration and confirmed writes; Stop stops future writes and retains already saved metadata. No physical originals are moved/deleted and no schema migration is required. A task is limited to 1000 source entries (including unsupported entries), 128 levels, and 2 MiB per WebDAV listing. Local task state does not survive reload; UI-16 review/flatten choices and larger-operation lifecycle remain next, not implemented by UI-15.

Verified installed 0.7.0 after user deployment: 12 focused browser checks without asset interception and 19 HTTP checks passed, including real database concurrent replay, owner isolation, CSRF, nested references and preservation of original bytes/path. Dedicated test accounts and originals were removed. Installed desktop and 320 px dark/RTL screenshots were visually inspected. Local validation passed: 396 combined browser fixture checks, six frontend test files, 19 import checks on top of 69 baseline service checks, build and 66 release archive checks. Explorer, upload, paging, token, access, streaming and schema regressions also passed locally; MySQL/PostgreSQL schema checks cover SQL generation, not execution. UI-16 remains next. No commit/push.

## Object detail row alignment — 2026-10-10

Prepared 0.6.8 fixes the user-reported label/value offset. The compact grid used baseline alignment across a flex label containing an icon and a plain value, placing values about 6px lower. Align both 24px lines at the row center. Nextcloud core also supplies 12px definition-list/term/value padding; explicitly reset that padding within plugin metadata and allow labels to wrap. Regression fixtures adopt the actual host defaults, verify a control receives them, require label/value center offsets below 1px, and verify zero metadata padding. No API/schema changes. Validation passes: production build, five frontend test files, 11 focused detail fixture checks, 376 combined browser fixture checks (832 CSRF-backed requests), and 66 archive checks. Nine focused checks also pass on actual Nextcloud using candidate frontend asset interception and a disposable account that was removed successfully; desktop/light and compact/dark/RTL host screenshots were visually inspected. This verifies host CSS integration with the candidate, not deployment of 0.6.8. Privileged deployment and installed-byte acceptance remain pending.

## Detail metadata and long selection labels — 2026-10-10

Prepared 0.6.7 follows user screenshots: Object details uses aligned icon definition-list rows, compact scalar values and wrapped full paths, with the existing preview/sticky Close header and actions. All five Material selects keep selected values on one line with ellipsis. A version-specific Vue directive adds selected-label ellipsis and nested-field flex sizing to the official select shadow roots because Material Web 2.5.0 exposes no label CSS part; option labels and accessible display text remain complete. Resize/update/selection lifecycle measures actual overflow and supplies the existing app tooltip only when truncated, for hover/focus. Tooltips stay suppressed while the select listbox is open so Escape closes the listbox directly. No native title, remote icon, API/schema or shell changes. Validation: production build, five frontend test files, 373 combined built-frontend browser fixture checks (832 CSRF-backed requests), and 66 release archive checks pass. Desktop/light and compact/dark/RTL detail and ellipsis-tooltip screenshots were visually inspected. Installed Nextcloud acceptance remains pending root deployment; no commit/push.

## Consistent Material selection fields — 2026-10-10

Prepared 0.6.6 replaces all five production native selects with official @material/web 2.5.0 md-outlined-select/md-select-option: object sort, token status, token sort, Move destination and token access boundary. Preserve models, scopes, API authorization and field labels. Use top-layer popover positioning inside scrollports/native dialogs, plugin typography/color tokens and responsive widths. Escape from an open option list must not dismiss the enclosing task/details; a closed field still permits normal parent Escape. Existing scope selection retains its official md-menu. No schema/API or host-shell changes. Final local validation: build, five frontend suites, 61 focused / 341 combined browser fixture checks (828 CSRF-backed requests in the combined run), and 66 archive checks pass. Covers pointer/keyboard selection, Escape preserving parent dialogs, closed-field dismissal, async initial labels, scope enforcement UI, disabled busy state, sticky scroll preservation, viewport 320/390/1440, dark/light and RTL. Final screenshots visually inspected. Installed 0.6.6 acceptance pending root deployment; no commit/push.

## Two-row sticky header refinement — 2026-10-10

Prepared 0.6.5 follows the user request to pin the existing Objects/count/selected/Sort row together with the column header. Both existing rows share one opaque sticky wrapper; no additional visible row. Progress/errors remain outside that wrapper. Object details/Close now has a 72px minimum height and 12px vertical padding, with keyboard scroll clearance adjusted for both headers. Scope-menu focus restoration continues to preserve scroll. No API/schema or Nextcloud shell changes. Build, five frontend suites, 42 focused / 279 combined browser fixture checks and 66 archive checks pass. Desktop/light and compact/dark/RTL screenshots visually inspected. Tests verify both summary and columns remain pinned together, scroll stays unchanged after scope-menu closure, and the 72px detail header keeps Close clickable at the end. Installed verification requires root deployment.

## Sticky headers — 2026-10-10

User requests sticky checkbox/Name/Type/Binding and OBJECT DETAILS/Close headers. Prepared **0.6.4** uses scoped CSS sticky inside each independent scrollport, opaque theme-matched backgrounds and local z-index. Compensate existing scrollport padding (objects 16px, details 28px) so headers pin to the actual top, with keyboard scroll clearance. No extra rows, API/schema or Nextcloud shell changes; no commit/push. Build, five frontend suites, **279 combined fixture browser checks** and 66 archive checks pass. All 42 focused checks also pass, including scope-menu focus restoration without scrolling the sticky anchor back to its flow position. Desktop/light and compact/dark/RTL screenshots visually inspected. Installed 0.6.4 verification awaits root deployment. The user's latest screenshot shows v0.6.3; this is user-provided deployment evidence, not a fresh installed API/browser run.

## UI-14 header correction — 2026-10-10

User supplied a screenshot showing v0.6.2 and rejected the extra selection-control layer. Prepared **0.6.3** moves select-all into the checkbox column and the scope arrow immediately before Name in the existing column-header row. Removed the standalone selection row/visible scope label; scope remains in accessible label, tooltip and checked menu choice. Mobile retains the single compact header with Type/Binding hidden. Row columns/insets and selection behavior are unchanged. No commit/push. Build, five frontend suites, **268 combined fixture browser checks** and 66 archive checks pass. **32 focused browser fixture checks** also pass, including details-open single-header geometry. Desktop/details and mobile screenshots visually inspected; installed 0.6.3 verification awaits privileged deployment. Earlier 0.6.2 evidence remains historical, not a 0.6.3 installed result.

## UI-14 continuation — 2026-10-10

User authorized the next task, UI-14. Prepared source/build version is now **0.6.2**, including uncommitted UI-13 and UI-14 work after 39625cc; no push. UI-14 adds Loaded / All matching selection modes using official Material Web menu items, checked/mixed state and exclusions. All matching captures a lightweight parent/search/revision descriptor; commands resolve bounded pages and perform a final revision check before clipboard/writes. Copy/Paste/Move/Remove/Rename retain unloaded metadata. Context changes clear selection; sort preserves it. Existing per-object endpoints reauthorize and partial completion retains remaining IDs. No schema or new endpoint. See bulk-selection-and-import.md for the contract. UI-15/16 remain planned. Final local validation passes: **265 built-frontend browser fixture checks** (825 CSRF-backed fixture requests), five frontend suites, 30 actual SQLite QueryBuilder paging checks, 69 strict-double service checks, schema validation and 66 archive checks. Mobile RTL/dark screenshot inspected; official check/select_all font subset refreshed and ligatures verified. Keyboard regression exposed option activation using close-menu rather than click; fixed and full rerun passed. Installed 0.6.2 acceptance requires privileged Snap deployment. Do not treat the earlier 0.6.1 request as confirmed deployment.

## Previous UI-13 work — 2026-10-10

Latest user instruction: commit the pending packaging/backlog work, then implement **UI-13**. Commit `39625cc` records the prior changes; no push. UI-13 is now implemented in prepared source/build **0.6.1**: 25-object batches, global server sort/count, conservative root revision invalidation, bounded batch hydration, append progress/retry, keyboard fallback and bounded history restoration. UI-14–16 remain planned; do not implement them without a new instruction. See [requirements](design/bulk-selection-and-import.md) and the latest [UI task status](agile/ui-tasks.md).

UI-13 evidence: **30 SQL/service checks** using installed Nextcloud QueryBuilder + actual SQLite queries; **238 built-frontend browser fixture checks**, four frontend model suites, unchanged backend regressions/schema and **66 archive checks** pass. A browser regression found that explicit Reload objects restored old scroll and loaded multiple pages; the fix resets scroll/selection for that action while history retains deep-scroll restoration. Mobile screenshot inspected. These are local/fixture results, not installed 0.6.1 evidence. The user has been asked to deploy 0.6.1 via the Snap script because root/sudo password is required. Next: run `MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/paging_http.py`, then installed browser acceptance, after confirmed deployment. The access HTTP harness now matches the package version so US-MS-07 can be validated on 0.6.1. UI-13 changes are uncommitted after 39625cc.

Committed US-MS-07 as `bfd532c` following the user's request; no push. US-MS-07 source baseline was **0.6.0**, with 61 streaming/protection + 64 access + 76 token local checks. After the user reported rebuilding, a fresh authenticated installed-page probe reported **0.6.0**. Deployment version is now observed; installed acceptance suites for 0.6.0 remain pending, including native player, parallel streams and configured policy checks. The page-version probe alone does not establish those results.

Continued independent **US-MS-08 packaging** work: `npm run package` produces `dist/mediastorage-0.6.0.tar.gz` plus checksum, a deterministic allowlisted archive with source/output fingerprint and internal manifest. `python3 tests/package_release.py` passed **66 checks**; frontend build passes. Packaging requires Python 3 standard library in addition to Node/npm. The packaging slice was committed in 39625cc before starting UI-13. Read [Sprint 04](agile/sprint-backlogs/sprint-04.md) and [Sprint 05](agile/sprint-backlogs/sprint-05.md); exact-archive installation, compatibility/security/proxy/restore and manual UI gates remain open. No release was published. Do not mark US-MS-07/08 complete from local checks.

The following sections retain the earlier installed baseline and historical decisions; the status above supersedes source-version/next-task statements below.

# Agent handoff — 2026-10-09

**Latest verified installed release: 0.5.1.** On 2026-10-10 the full temporary access HTTP suite passed **47 checks**, including anonymous exact-byte GET, HEAD with correct representation length/no body, expiry/revocation, scope/issuer/resource changes and owner recreation. The existing Phase 3 HTTP suite passed **130 checks** on the same installed release. Both suites cleaned their dedicated accounts/originals. Previous 0.4.1 browser evidence (305 checks) is historical; no 0.5.1 browser suite was run because this story changes delivery APIs, not UI behavior.

**Current source/build: 0.5.1, installed; US-MS-06 complete on the local target.** Session/CSRF and scoped-bearer temporary URL issuance/revocation, pinned per-resource GET/HEAD delivery, migration 000500 and owner cleanup are implemented and live-verified. Local evidence: 64 temporary access checks plus 76 token checks, 69 baseline + 62 bucket/copy + 46 upload checks, populated SQLite upgrade/re-entry, three frontend suites and build pass. MySQL/PostgreSQL schema generation is separate from actual target Snap MySQL execution. Source inspection identified Nextcloud's empty-response HEAD length rewrite; public ICallbackResponse fixes it without core changes. See [Sprint 04](agile/sprint-backlogs/sprint-04.md) and [US-MS-06](agile/user-stories/US-MS-06.md). Next is US-MS-07: Range/validators, rate/abuse and hotlink policy. Existing Copy virtual path remains metadata-only; this story adds APIs, not a new UI screen. The user authorized committing the accumulated UI-10 and US-MS-06 changes and continuing to US-MS-07 on 2026-10-10. Push was not requested.

## Start here

The app is `mediastorage` 0.3.3. The user approved production implementation and confirmed virtual buckets. Nextcloud 34.0.4 was initialized and the user installed 0.3.0. Current source includes a Vue/Material explorer, persistent virtual buckets, reference Copy/Paste and token management. Live HTTP: 91 checks passed. Final deployed frontend: **46 browser checks passed with installed assets, cache disabled and no candidate interception** after the user redeployed the host CSS/layout correction. Upload, previews, signed URLs and binary delivery remain deferred. The sections below record historical decisions; this current status and the production contract supersede their unresolved-bucket/unimplemented-UI statements.

Read the documentation index, current [Sprint 04](agile/sprint-backlogs/sprint-04.md), architecture decisions, schema, API contract, security design, and tests/README.md. The original `.chat/prompt1.md` is ignored by Git and may not exist on another machine; the tracked docs plus this handoff carry the continuation context. Do not require the original Downloads knowledge folders or screenshot to apply the tracked skills.

Latest correction: Copy means the plugin virtual_path, not a Nextcloud native URL. Corrected source is deployed; 96 browser checks passed against installed assets with cache disabled and no interception. See the latest clarification below.

Latest cache correction: 0.3.1 is installed. Replacing 0.3.0 assets under the same version left cache URLs unchanged; prior cache-disabled tests missed existing-browser behavior. The version bump changed both JS/CSS URLs. All 99 installed browser checks passed with cache enabled and no HTTP-cache clearing, including served-byte equality and existing dialog/theme/plugin-path regressions. No schema change or Nextcloud restart is needed.

## Latest user decisions

- 2026-10-10: exclude actual screen-reader testing from UI-10/release acceptance at the user's request. Retain physical mobile/keyboard, actual browser zoom and all-state contrast checks. Accessible names and existing keyboard/accessibility-tree tests remain in scope. This supersedes historical screen-reader pending notes without claiming those tests passed.

- 2026-10-10: the user accepted installed 0.4.1 without observed errors and requested continuation. UI-09 video and automated UI-10 acceptance now pass: 49 focused checks and 305 combined installed browser checks, plus 130 Phase 3 HTTP checks. This slice changes only tests/documentation; production remains 0.4.1. Physical device/keyboard, actual browser zoom and complete composited-state contrast remain manual gates; Phase 4 delivery is still planned. See [integrated acceptance](design/integrated-acceptance.md).

- UI-03: the user reports that the deployed UI works and restores the previously opened view. This is user acceptance, not an independently rerun installed browser suite.
- UI-09 upload storage (2026-10-10): each account receives its own `Media Storage/YYYY-MM-DD/` folder in its Nextcloud files. Group new uploads by calendar day, without hour-level folders. The plugin may add original files through upload; its Move/Rename/Remove/Clear/Delete actions continue to affect virtual metadata only. Users may move or otherwise manage original files later through Nextcloud. Upload and preview are verified in installed 0.4.1; see the current evidence above.

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


Latest visual correction: full-row feedback and the primary focus outline use 16px corners on desktop/mobile. Existing insets, dimensions, straight dividers and independent controls are preserved. 383 Chrome checks passed after the change; mobile row-feedback image refreshed and inspected. Standalone study only.


## Production work started — latest user decision

2026-10-09: User approved the prototype for implementation and explicitly confirmed virtual buckets. This resolves the previous bucket question. See software/08-production-explorer.md for the documentation-first contract. Current localhost Nextcloud was uninitialized despite historical evidence above; web setup has now initialized 34.0.4 using Snap MySQL. Admin credentials are in the private /tmp file (0600), never Git. sudo currently requires a password; do not claim deployment until verified. Production frontend/backend work is in progress.

## Current production evidence and next step

See software/08-production-explorer.md and tests/README.md. `tests/explorer.php` passes 69 baseline + 23 bucket/copy checks; tokens.php passes 66; schema.php verifies populated SQLite upgrades/re-entry and MySQL/PostgreSQL SQL generation. Build and frontend rules pass. Live browser tests create and delete a dedicated account/file, and cover real DAV binding, rename/copy/move/remove, bucket/folder navigation, token issue/rotate/revoke, ephemeral secrets, responsive geometry, drawer Escape and physical-byte preservation. Candidate assets were CDP-intercepted only for app JS/CSS during preparation. Final deployment has now passed the same 46 checks without interception and with cache disabled. No credentials belong in Git. No commit or push authorized for this implementation yet.

## 2026-10-10 UI correction

User reported dialogs at top-left and purple Material hover/focus/pressed states. Actual-host probes confirmed dialog margin:0 from Nextcloud core and absent Material system primary roles. Explicit scoped centering and app color-role mappings now fix both; heading colors also follow the plugin theme. Added Copy Nextcloud link beside Rebind for available bindings, using authenticated native `/f/{fileId}?openfile=true`, with clipboard-denied manual-copy fallback. This is a native viewer link, not public/signed/raw media delivery. Candidate assets passed 96 live browser checks; the user redeployed, and all 96 passed again against installed assets with cache disabled and no interception. No commit or push requested for this revision.

2026-10-10 user clarification supersedes the native file-link feature: Copy means the plugin's exact bucket-relative virtual_path, including virtual alias/folders. Replace Copy Nextcloud link with Copy virtual path, retain manual-copy fallback and show bucket context. This is metadata only; plugin browser media delivery is still deferred. Dialog and green interaction-state fixes remain. User redeployed the correction; 96 browser checks passed against installed assets with cache disabled and no interception.

0.3.2 latest source: user required replacing the drawer footer slogan with only the plugin version. PageController now supplies IAppManager version through escaped template data and a Vue prop. Both slogan lines are removed from the production UI; footer shows v0.3.2. Metadata increments preserve cache invalidation. Build/PHP syntax and 33 fixture checks pass; installed verification pending deployment.

## Material component correction — 0.3.3 (requirements before code)

The production explorer used native styled buttons for FAB, icon and toolbar commands despite bundling Material Web. Replace supported actions with actual `md-fab`, `md-icon-button`, `md-filled-tonal-icon-button` and `md-text-button`. Preserve responsive toolbar packing, independent cancellation, focus restoration and reference-only semantics. Use the official `md-ripple` on custom navigation, menu and file-picker controls. Attach the object primary ripple to its native button while drawing it over the full rounded row; checkbox and details actions remain independent. Do not add duplicate ripples to library buttons.

Replace the static SVG icon wrapper with `md-icon` and an official Google Material Symbols Outlined font subset. Bundle the font locally with its Apache-2.0 license and provenance, preserving Nextcloud CSP without external font requests. Update overlay event delegation and keyboard selectors for custom elements. Verify real pointer ripples, disabled controls, keyboard activation, light/dark states, compact packing, menus/tooltips and font loading under CSP. Retain the installed-version-only drawer footer. Release 0.3.3 combines this correction with the pending 0.3.2 footer change; deployment and installed-browser verification remain pending. No API or schema changes.

0.3.3 preparation verified: production build and frontend rule checks pass; 71 built-frontend HTTP fixture checks pass with 20 CSRF-backed requests. The final assets pass 134 browser checks in the actual Nextcloud host using candidate JS/CSS/font interception and disposable account cleanup. Both mobile and desktop candidate screenshots were visually inspected. Actual pointer animations, disabled suppression, keyboard/menu/tooltip interaction, full-row geometry, responsive packing and FAB/menu insets are covered. PHP bootstrap/template syntax checks pass. Source version is 0.3.3; privileged deployment, installed-version display and warm-cache upgrade verification are pending. Do not describe candidate results as installed evidence. Screen-reader, real touch and full zoom/contrast validation remain deferred.

0.3.3 installed verification (2026-10-10): after the user deployed, all **138 live Nextcloud browser checks passed with cache enabled and no candidate interception** (Chrome 154.0.8037.97). Both JS/CSS asset URLs changed from the recorded installed release and served bytes match the local build. The server supplies 0.3.3 and the drawer displays only v0.3.3. Official local icons/font and actual Material ripples load under host CSP; disabled/keyboard/menu/tooltip behavior, responsive toolbar/FAB geometry, light/dark dialog states and virtual-path/reference/token regressions pass. Installed mobile/desktop screenshots were visually inspected. The dedicated fixture account was removed and the harness exited successfully. Screen-reader, real touch and full zoom/contrast validation remain deferred.

0.3.4 preparation verified (2026-10-10): production build and frontend rule checks pass. 107 built-frontend fixture checks pass with 20 CSRF-backed API requests; 170 actual-Nextcloud candidate browser checks pass using local JS/CSS/font interception and disposable DAV folders. The original installed spacing failure was reproduced (53px Add bucket width, zero padding) before correction. Rendered Add bucket and labeled toolbar spacing, one-row picker navigation, root/pending disabled state, parent/Home keyboard behavior, focus return, long names, selection/name preservation and content-hashed font URL pass. Candidate desktop, dark compact picker and nested compact screenshots were visually inspected. Installed baseline is still 0.3.3; 0.3.4 deployment and installed warm-cache/font-byte verification remain pending. No API/schema changes.

0.3.8 changes only bucket editor Clear contents/Delete bucket colors to normal on-surface text/icons, as requested. The supplied screenshot shows bucket editing in use, but installed-version/API acceptance has not been independently rerun. Privileged deployment and installed acceptance remain pending.
