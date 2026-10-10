# Sprint 03: Buckets and Material Explorer

Status: In progress. UI-03 is user-accepted. UI-09 uploads/previews are installed in 0.4.1, including the first-upload correction and success/location notification. Installed acceptance passed 26 upload/preview HTTP checks and 257 cache-enabled actual-Nextcloud browser checks. Broader sprint limits remain documented below. See [agent handoff](../../agent-handoff.md).

## Scope and dependency

UI-09 approved storage requirement (2026-10-10): new uploads go to `Media Storage/YYYY-MM-DD/` within the authenticated account's Nextcloud files, with daily grouping and no hourly subdivision. Create directories only when needed and preserve existing files without overwrite. Bucket/folder placement remains virtual. Plugin reference operations must never move, rename or delete originals; users can manage originals themselves through Nextcloud later. Implementation and installed upload acceptance passed in 0.4.1. The user has separately accepted UI-03 navigation/restoration as working on their installation.

The user approved the prototype and confirmed virtual buckets inside the plugin. Buckets, reference-only Copy/Paste, the Vue/Material explorer, existing-file picker/rebind, and token management are implemented. Uploads and image previews are verified in 0.4.1; remaining video/accessibility acceptance keeps the sprint in progress. See software/08-production-explorer.md for the current contract; dated preparation entries below are historical.

## Work packages

1. US-MS-09: define and implement approved buckets, owner isolation, migration of existing roots/data, API/token compatibility and regression checks.
2. US-MS-05: Vue/Material build; app-scoped theme; bucket drawer; breadcrumb/object list; folder operations; binding/rebind; upload; previews; token dashboard.
3. Update architecture/schema/API/security and operations docs before dependent changes, then record actual checks as each slice completes.

## Acceptance gates

- Populated 0.2 upgrade preserves nodes, bindings, physical files and intended token access; invalid cross-owner/cross-bucket access is denied under concurrent changes.
- Real session/CSRF-backed operations work without manually entering full paths; primary/secondary/selection actions do not conflict.
- Drawer, dialogs, focus return, keyboard, RTL, narrow layouts, both themes and reduced motion are checked in the actual Nextcloud host.
- No CSS/theme changes spill into the Nextcloud shell. True browser-modal behavior and scrim scope are verified, not inferred from scoped CSS.
- Upload validates permission, MIME and size using supported APIs. Missing bindings have an explicit recovery path.
- Token issue shows secrets once; no long-lived external token in browser persistence/logs.
- URL copying never advertises nonexistent delivery/security guarantees; signed access and streaming remain Phase 4.

Current app version is 0.3.0. Exact frontend dependencies are pinned in package-lock.json. Keep deployment and test claims tied to recorded execution.

## Design preparation

2026-10-09: Added [md3-menu](../../../.agents/skills/md3-menu/SKILL.md) with design/specification, web/accessibility and source references after studying the supplied Overview, Specs, Guidelines and Accessibility captures. Baseline versus Expressive web limits and keyboard-guidance conflicts are explicit. No UI implementation or browser verification is included.

2026-10-09: Added [md3-radio](../../../.agents/skills/md3-radio/SKILL.md) after studying the supplied radio captures and checking Material Web/WAI-ARIA. References cover sizing, labels, do/don't, default versus unanswered states, density, form and async behavior, and source limitations (duplicate Specs, missing Overview). Skill validation passed; UI implementation and browser checks remain pending.

2026-10-09: Added [md3-search](../../../.agents/skills/md3-search/SKILL.md) after studying all four supplied Search pages and checking Material Web/WAI-ARIA. References distinguish design from unavailable web implementation, document ambiguous measurements, and cover async queries, accessible suggestions/results and the existing server search contract. Skill validation passed; UI and browser checks remain pending.

2026-10-09: Added [md3-switch](../../../.agents/skills/md3-switch/SKILL.md) after studying supplied Overview, Specs and duplicate Accessibility captures and checking Material Web/WAI-ARIA. References cover binary settings, stable naming, size/state rules, form and async persistence, and label/event documentation caveats. Missing Guidelines content is explicit. Skill validation passed; UI/browser checks remain pending.

2026-10-09: Added [md3-text-field](../../../.agents/skills/md3-text-field/SKILL.md) after studying all four supplied pages and checking Material Web/WAI. References cover variant consistency, measurements, labels, required/error feedback, textareas, affixes, readonly behavior, form validation and actual UTF-8 byte limits. Source/API caveats are explicit. Skill validation passed; UI/browser checks remain pending.

2026-10-09: Added [md3-toolbar](../../../.agents/skills/md3-toolbar/SKILL.md) after studying all four supplied pages, inspecting specification images and checking Material Web/WAI-ARIA. References cover docked/floating geometry, emphasis, overflow, FAB pairing, responsive behavior and composite keyboard focus. Web placement exceptions, conflicting keyboard guidance and unavailable web implementation are explicit. Skill validation passed; UI/browser checks remain pending.

2026-10-09: Added [md3-tooltip](../../../.agents/skills/md3-tooltip/SKILL.md) after studying all four supplied pages, both measurement images and Material Web/WAI guidance. References cover plain/rich variants, placement, timing, accessible names, hover/focus persistence and interactive popup semantics. Missing web implementation and Material/APG differences are explicit. Skill validation passed; UI/browser checks remain pending.


2026-10-09: Prepared the [responsive plugin design](../../design/responsive-plugin.md), standalone interactive prototype and [UI task backlog](../ui-tasks.md). Mobile uses a compact drawer and supporting-text object rows; desktop retains a standard drawer and optional details pane. Standalone Chrome checks passed at 320–1440px viewports; see [validation](../../design/validation.md). Production Vue/API integration and bucket semantics remain pending.


2026-10-09: Refined the UI study after user feedback: Add from Nextcloud label explains reference creation; local licensed Google Material Symbols replace placeholder glyphs; Sort by width/padding and search-arrow spacing were increased. Standalone Chrome checks and snapshots refreshed; production UI remains pending.


2026-10-09: Documented the user's reference-only Move/Rename/Copy/Paste/Remove semantics, creation FAB, contextual toolbar, tooltip/menu regression requirements and desktop small-text increase **before code changes**. See [reference actions](../../design/reference-actions.md). The user corrected the skill name and confirmed md3-extended-fab before prototype work. Copy/Paste backend contract remains pending; no new UI/server test evidence is claimed.


2026-10-09: Completed the standalone action prototype using confirmed md3-extended-fab plus menu/toolbar/tooltip guidance. Add FAB combines creation entries; contextual toolbar/clipboard models reference-only Copy/Paste/Rename/Move/Remove; desktop small text increased and scroll clearance prevents FAB/list overlap. Sample model checks and 71 Chrome checks passed, including tooltip/menu ownership, keyboard/focus and narrow toolbar fit. See [evidence](../../design/validation.md). No production frontend/backend Copy/Paste implementation or server tests are claimed.


2026-10-09: Refined the standalone layout after annotated screenshot feedback. One local title/search navbar replaces repeated heading layers; breadcrumbs appear only inside folders. Symmetric scrollbar gutters balance horizontal padding, a bottom-aligned footer replaces fixed bottom padding, and desktop FAB inset increases to 29px while compact remains 24px. Requirements were documented before code. 165 Chrome checks passed, including the supplied image dimensions and short-height states; see [validation](../../design/validation.md). No production deployment or backend change.


2026-10-09: Applied the user's bottom-toolbar correction after documenting it. Contextual actions now float in the existing bottom FAB band; selection/clipboard counts move beside the object count. Selection preserves the list's height and first-row position. 201 standalone Chrome checks passed, including short-height selection, last-row clearance, reduced motion and existing menu/tooltip/reference regressions. Desktop and compact screenshots were visually reviewed. Production integration remains pending.


2026-10-09: Applied the user's compact FAB/toolbar pairing correction after documenting it. Below 1200px, toolbar floats above an icon-only Add FAB; expand-more opens overflow. FAB menu overlays toolbar while preserving context until an Add entry is invoked. Both Add entries clear selection/clipboard; task cancellation keeps it cleared. 252 standalone Chrome checks passed, including menu hit testing, Escape/outside preservation, stack/scroll/focus clearance, resize/RTL and existing regressions. Updated paired-action/menu snapshots; production integration remains pending.


2026-10-09: Applied the user's separate-cancel correction after documenting it. Rounded toolbar now contains reference commands only; a separate trailing 56px tonal X surface with 8px gap replaces inline Clear selection and all Clear clipboard duplicates. It clears selection/clipboard together, hides contextual actions and restores Add focus, including clipboard-only state. 292 Chrome checks passed, including three context modes at desktop/compact/short sizes, geometry, unchanged references, Tab/Enter/Space and RTL; snapshots refreshed and inspected. Production integration remains pending.


2026-10-09: Documented and implemented compact action-group width matching FAB insets and the missing + Add bucket entry. Bucket creation is sample-only with empty/duplicate validation, selected empty destination and compact task/drawer focus restoration. 304 Chrome checks passed; desktop, compact toolbar and bucket dialog snapshots were visually inspected. Production bucket semantics/persistence remain unresolved; no backend changes.


2026-10-09: Replaced fixed toolbar action hiding with measured adaptive packing after documenting the requirement. Five icon commands fit at 390px; narrower sizes reserve overflow for exactly hidden commands, retaining 48px targets. Resize/font/group updates preserve focus and stable menus, with labels restored when space permits. 333 Chrome checks passed, including a continuous compact sweep, long labels and focus/menu resize regressions. Updated mobile snapshot visually inspected; production integration remains pending.


2026-10-09: Latest user correction makes FAB/toolbar mutually exclusive at every width, superseding compact stacking. Toolbar returns to the existing bottom band with full mobile width/adaptive packing; X clears context and restores Add. 332 Chrome checks passed including clipboard-only exclusion, resize/RTL and both Add entries after cancellation. Snapshots refreshed; mobile visually inspected. No backend changes or production integration.


2026-10-09: Documented and corrected desktop creation-menu alignment. Intrinsic width removes position-dependent sizing; the menu aligns with FAB trailing edge, including RTL, while compact layout and narrow viewport clamping remain intact. 365 Chrome checks passed, including initial/repeated open and live resize. Desktop/mobile menu snapshots visually inspected; standalone study only.


2026-10-09: Documented and implemented full-row primary hit area and hover/press/focus feedback, replacing the name-only pill. Checkbox/info remain independent native controls. 383 Chrome checks passed including desktop/mobile whitespace activation, selection/info isolation, keyboard focus and RTL/dark theme. Mobile screenshot inspected; standalone study only.


2026-10-09: Documented and applied 16px corners to full-row feedback and primary keyboard focus on mobile/desktop, preserving straight dividers, insets and targets. 383 Chrome checks passed; mobile snapshot inspected. Standalone study only.


2026-10-09: User approved production implementation and confirmed virtual buckets. Local Nextcloud web setup completed; deployment still requires privileged app-directory access. Production contract documented in software/08-production-explorer.md before implementation. Frontend, bucket persistence and copy endpoint work now in progress; no live UI verification claimed.

## Current execution

0.3.0 installed by the user on the initialized Nextcloud 34.0.4 / Snap MySQL instance. 91 live HTTP checks passed. 30 installed-frontend browser checks passed; subsequent host layout fixes passed 46 checks with candidate frontend assets against actual deployed APIs. The user redeployed the final built assets; 46 browser checks then passed with installed assets, cache disabled and no interception. Local service/token/schema checks and production build pass. Upload, previews, assistive-technology/touch validation and broader deployment validation remain open.

2026-10-10: User reported native dialog centering and Material interaction-color regressions, and requested a copyable file-opening path beside Rebind. Requirements and root-cause evidence recorded in software/08-production-explorer.md before implementation. Use a clearly labeled authenticated native Nextcloud file link; public/signed/binary delivery remains deferred. Revision deployed by the user; 96 installed-asset browser checks passed, including dialog/interaction colors and native-link permission behavior.

2026-10-10 user clarification supersedes the native file-link feature: Copy means the plugin's exact bucket-relative virtual_path, including virtual alias/folders. Replace Copy Nextcloud link with Copy virtual path, retain manual-copy fallback and show bucket context. This is metadata only; plugin browser media delivery is still deferred. Dialog and green interaction-state fixes remain. User redeployed the correction; 96 browser checks passed against installed assets with cache disabled and no interception.

0.3.1 cache revision: user browser retained old 0.3.0 UI after same-version asset replacement. Installed bytes match the build; Nextcloud version-derived asset URLs did not change. Increment release metadata, document frontend release discipline and verify changed asset URLs plus all UI regressions with cache enabled. No new schema migration. User deployed 0.3.1; 99 installed-asset browser checks passed with cache enabled, including JS/CSS cache-URL change and served-byte equality.

0.3.2: replace the drawer footer slogan with the installed plugin version only, using server-provided app version data. Increment asset-release metadata; no API/schema change. Verification/deployment pending.

## Material component correction — 0.3.3 (requirements before code)

The production explorer used native styled buttons for FAB, icon and toolbar commands despite bundling Material Web. Replace supported actions with actual `md-fab`, `md-icon-button`, `md-filled-tonal-icon-button` and `md-text-button`. Preserve responsive toolbar packing, independent cancellation, focus restoration and reference-only semantics. Use the official `md-ripple` on custom navigation, menu and file-picker controls. Attach the object primary ripple to its native button while drawing it over the full rounded row; checkbox and details actions remain independent. Do not add duplicate ripples to library buttons.

Replace the static SVG icon wrapper with `md-icon` and an official Google Material Symbols Outlined font subset. Bundle the font locally with its Apache-2.0 license and provenance, preserving Nextcloud CSP without external font requests. Update overlay event delegation and keyboard selectors for custom elements. Verify real pointer ripples, disabled controls, keyboard activation, light/dark states, compact packing, menus/tooltips and font loading under CSP. Retain the installed-version-only drawer footer. Release 0.3.3 combines this correction with the pending 0.3.2 footer change; deployment and installed-browser verification remain pending. No API or schema changes.

0.3.3 preparation verified: production build and frontend rule checks pass; 71 built-frontend HTTP fixture checks pass with 20 CSRF-backed requests. The final assets pass 134 browser checks in the actual Nextcloud host using candidate JS/CSS/font interception and disposable account cleanup. Both mobile and desktop candidate screenshots were visually inspected. Actual pointer animations, disabled suppression, keyboard/menu/tooltip interaction, full-row geometry, responsive packing and FAB/menu insets are covered. PHP bootstrap/template syntax checks pass. Source version is 0.3.3; privileged deployment, installed-version display and warm-cache upgrade verification are pending. Do not describe candidate results as installed evidence. Screen-reader, real touch and full zoom/contrast validation remain deferred.

0.3.3 installed verification (2026-10-10): after the user deployed, all **138 live Nextcloud browser checks passed with cache enabled and no candidate interception** (Chrome 154.0.8037.97). Both JS/CSS asset URLs changed from the recorded installed release and served bytes match the local build. The server supplies 0.3.3 and the drawer displays only v0.3.3. Official local icons/font and actual Material ripples load under host CSP; disabled/keyboard/menu/tooltip behavior, responsive toolbar/FAB geometry, light/dark dialog states and virtual-path/reference/token regressions pass. Installed mobile/desktop screenshots were visually inspected. The dedicated fixture account was removed and the harness exited successfully. Screen-reader, real touch and full zoom/contrast validation remain deferred.

## 0.3.4 — Labeled button spacing and one-row file navigation (before code)

User screenshot exposes legacy Add bucket CSS overriding Material text-button padding to zero and icon/label gap to 4px. Remove those layout overrides, preserve official leading/trailing space and at least 8px icon/label separation; icon-only actions retain square 48px controls. Audit rendered labeled buttons rather than only checking registration and outer bounds.

Replace the file picker's separate Up one folder button and path paragraph with one navigation row: Back (parent), Home (root), current folder name. At root show Nextcloud files and disable both navigation controls. Nested folders show their final segment, with the complete path available in accessible text. Back changes exactly one level; Home returns directly to root. Use actual md-icon-button controls and official arrow_back/home icons in the local font subset. Keep buttons type=button, bounded dialog geometry and independent list scrolling; changing folders must not submit or discard the chosen file/name. Restore focus to an appropriate picker control after navigation. Retain abort/latest-request handling and test root, nested/back/home, long names, pending state and keyboard operation on mobile/desktop. No API/schema change. Increment frontend release metadata to invalidate cached assets.

0.3.4 preparation verified (2026-10-10): production build and frontend rule checks pass. 107 built-frontend fixture checks pass with 20 CSRF-backed API requests; 170 actual-Nextcloud candidate browser checks pass using local JS/CSS/font interception and disposable DAV folders. The original installed spacing failure was reproduced (53px Add bucket width, zero padding) before correction. Rendered Add bucket and labeled toolbar spacing, one-row picker navigation, root/pending disabled state, parent/Home keyboard behavior, focus return, long names, selection/name preservation and content-hashed font URL pass. Candidate desktop, dark compact picker and nested compact screenshots were visually inspected. Installed baseline is still 0.3.3; 0.3.4 deployment and installed warm-cache/font-byte verification remain pending. No API/schema changes.


## Token dashboard revision — 0.3.5 requirements (before implementation)

Replace the sparse token list with four responsive, actionable summaries: active, active expiring within 14 days, revoked, and expired. Revocation takes precedence over expiry; expiring is a subset of active. Counts cover all loaded pages, independently of name/status filters. Show a readable access-token list with permissions, access boundary, expiry, last use and explicit Rotate/Revoke actions for active credentials. Keep existing rotation overlap semantics and plugin-scoped Material styling. Provide loading, retry, empty and filtered-empty states without fabricating metrics.

The authenticated token-list response will add a no-store `policy` object with `server_time` and `max_lifetime_seconds`, using the same configured/clamped lifetime as issuance. Refresh policy when opening Create. Fail closed on missing/unavailable policy, explain recovery, and preserve entered drafts. Native datetime-local remains appropriate because Material Web text fields do not support that type. Set minute-aligned min/max, clamp the initial seven-day suggestion, visibly state the latest allowed local expiry, and validate typed dates before submitting. Server validation remains authoritative. No token schema or permission changes.

The one-time secret dialog gets an actual Material Copy token action, at least 24px between secret content and actions, success/denied-clipboard feedback, and manual selection fallback. Copying must not close the dialog, persist or log secrets. Closing clears the secret and copy feedback. Tests must cover status boundaries, non-default lifetime, missing policy, invalid typed dates, filters, narrow layout, copy success/failure and secret cleanup. Never capture secret dialogs in screenshots. Installed verification requires privileged deployment; fixture/candidate results are separate evidence.


## 0.3.5 token dashboard preparation — 2026-10-10

Before changes, installed 0.3.4 passed 172 actual-host browser checks without candidate interception; asset URLs were recorded for the next warm-cache upgrade. Source 0.3.5 build and frontend model tests pass; token service/controller suite passes 73 checks, explorer passes 69 + 23 checks, and schema checks pass (SQLite execution; MySQL/PostgreSQL SQL generation only). The built-frontend HTTP fixture passes 132 browser checks with 24 CSRF-backed requests, including four summary counts/filtering, revoked/expired precedence, search/reset/sort, configured one-hour expiry, typed over-limit rejection preserving drafts, absent-policy fail-closed behavior, copy success/denial/manual selection, secret cleanup and 320/390/840/1440/1914px geometry. Fixture viewport setup now gives html/body explicit height so screenshots reflect the intended viewport rather than an initial browser-window height.

Desktop light and compact dark dashboard fixture screenshots were visually inspected (`/tmp/mediastorage-tokens-1440-light.png`, `/tmp/mediastorage-tokens-390-dark.png`); they contain only fixture token metadata and no secrets. Secret dialogs are excluded from screenshots. Installed 0.3.5/API-policy and warm-cache acceptance, updated live HTTP checks, screen-reader, real touch and full zoom/contrast validation remain pending. Candidate asset-only interception cannot validate new PHP policy metadata, so no 0.3.5 candidate result is claimed. No schema change.


## Bucket removal — 0.3.6 requirements (before code)

Add a trailing X Material icon button to each non-default bucket row. Keep destination and removal as sibling controls, never nested buttons. Hide the removal control at rest; reveal on row hover or focus-within, including when hovering the control itself. Keyboard users tab to the destination and then the revealed removal control; touch users focus/select a row to reveal it. Preserve row width, rounded feedback, 48px removal target, RTL and tooltip naming. Library is the protected owner root and has no removal action.

Clicking X opens a confirmation naming the bucket and explicitly explaining that its virtual folders and links are removed while original Nextcloud files and links elsewhere remain. Cancel/Escape performs no deletion; failures keep the confirmation open with recovery feedback. Confirm uses authenticated/CSRF-protected DELETE /api/v1/buckets/{id}. Backend validates ownership and bucket type under the existing owner-root transaction lock, bounds traversal to 1000 nodes, collects the entire subtree before mutation, and removes child metadata/bindings, bucket root and bucket record atomically. No filesystem delete APIs are called. Keep the default root protected and ordinary node-root deletion forbidden. Deleted folder-scoped tokens retain their missing boundary and never widen to owner-wide authority. No schema change.

Deleting the current bucket returns to Library, clears navigation/selection/details, and resets a filter that would hide Library. Deleting another bucket keeps the current view. Clear the app clipboard after successful bucket deletion to discard possibly stale source references. Restore focus to a surviving destination when the trigger no longer exists. Validate hover, keyboard, touch-style focus, nested contents, inactive/current bucket, cancellation, owner/default boundaries, repeated deletion, original-file preservation and concurrency/rollback limits. Verify installed behavior only after root deployment.


## Bucket management revision — 0.3.7 (requirements before code)

Supersedes the trailing-X/removal-only design: every bucket, including default Library, has a hover/focus edit icon opening one management dialog. Allow rename, Clear contents and Delete bucket. Library can be renamed and cleared; only its deletion is disabled and explained. Destructive commands open a confirmation in the same dialog, with Cancel/Escape returning to the editor and drafts preserved. Rename is a separate Save action, not an implicit side effect of clearing/deletion. All operations remain virtual-only.

Add session/CSRF PATCH /buckets/{id} {name} and POST /buckets/{id}/clear. Names use NodeRules UTF-8 validation, owner-local exact uniqueness including the current default name; Library remains reserved for the default bucket. Store default display name in the existing root node name (empty legacy name displays Library), retaining its deterministic ID/name_key. Additional bucket rename updates ms_nodes and ms_buckets names/keys in one owner-root transaction. Re-read the root under lock for uniqueness checks. No schema migration.

Clear removes descendants/bindings atomically with the existing 1000-node traversal bound including the retained bucket root; it keeps bucket identity/name and other buckets. Tokens restricted to the retained root remain scoped to that root; deleted child-folder boundaries fail closed. Clear current bucket resets nested navigation/selection/details and clipboard; clear inactive bucket keeps current view. Delete retains Library protection and prior file-preserving semantics. Test persistence/identity, default rename/clear, duplicate/invalid/cross-owner handling, destructive confirmation/draft recovery, keyboard/focus, loading/error states, original bytes and links elsewhere.

## 0.3.7 bucket management preparation — 2026-10-10

Supersedes the undeployed 0.3.6 removal-only UI. Production build and two frontend model suites pass; PHP strict-interface doubles pass 69 baseline + 62 bucket/copy checks and 76 token/scope/lifecycle checks. Schema tests execute SQLite upgrades and validate MySQL/PostgreSQL SQL generation only. Python HTTP harness compiles; this is not an HTTP execution result.

The production-frontend HTTP fixture passes **163 browser checks with 47 CSRF-backed requests**. Coverage includes hover/focus edit disclosure on every bucket including Library, independent navigation/action targets, invalid and successful current/default rename with stable identity, disabled default deletion, default/current clear, repopulation after clear, draft-preserving confirmation Cancel/Escape, retry after simulated failure, deletion fallback, keyboard/focus, typography, 48px targets and desktop/390px/320px RTL dialog containment. Desktop and 390px editor screenshots were visually inspected; screenshots contain fixture data only. Backend doubles additionally verify exact name uniqueness, rollback, owner/type/default protection, traversal bounds, retained root keys, subtree/binding cleanup and original-file preservation.

Installed baseline remains 0.3.5: 192 actual-host browser checks passed without interception. New backend routes require privileged deployment before installed 0.3.7 browser/cache and Phase 3 HTTP acceptance. Prepared HTTP checks include rename/clear ownership and CSRF, duplicate/invalid names, stable default identity, retained empty roots, other links and exact original bytes, plus removal concurrency/token boundaries. These updated installed suites have **not run**. Screen-reader, real touchscreen, complete zoom/contrast and other database execution remain pending. No new commit or push requested.

0.3.8 presentation follow-up: neutral text/icons for bucket editor Clear contents/Delete bucket, with existing confirmations and disabled default deletion preserved.

## UI-03 navigation completion — 0.3.9 requirements before code

Use a plugin-owned #ms: URL fragment to identify page, bucket, folder, submitted search, object sort and optional details. Preserve the Nextcloud pathname/query and shell; no server route, schema or API changes. Store only scroll offset in a namespaced history.state member. Never persist selection, clipboard, dialog drafts, file-picker state or token secrets. Submitted navigation creates history entries; repeated identical destinations do not. Back/Forward, direct URLs and reload restore authenticated state and rebuild folder breadcrumbs from current server parent IDs/names, bounded to 128 ancestors and confined to the selected bucket. Search is direct-child only.

Missing/foreign/deleted buckets fall back to default with visible feedback; invalid/moved/deleted folder or detail IDs cannot expose another bucket. Retryable network/auth failures remain explicit rather than silently becoming empty folders. Restored URLs are canonicalized with replaceState. Cancel superseded list/detail/navigation requests. Back/Forward during a mutation is deferred until it finishes; navigation closes unsubmitted dialogs and clears one-time secrets. Restore list scroll after loading and focus the current view without stealing focus on ordinary async list refresh. Validate nested traversal, search, sort, details, page changes, reload, Back/Forward, deletion, malformed/foreign IDs, races, pagination and session errors.

Final UI-03 acceptance preparation: **245 actual-Nextcloud candidate browser checks passed**, cache disabled, including the final compact reload/Back/focus additions. Dedicated fixture account cleanup completed. Production build, three frontend model suites and **190 HTTP-fixture browser checks** pass. Final source/build is 0.3.9; installed/warm-cache acceptance awaits privileged deployment. No new commit or push.

## UI-09 implementation preparation — 0.4.0

Source implements per-account `Media Storage/YYYY-MM-DD/` uploads, content/size/permission/quota validation, owned destination checks, persistent retry journal and migration, Material progress/Stop/retry, thumbnails, detail images and session video/DAV content bridge. Dates use account core/timezone with UTC fallback; server-random MIME-safe storage names avoid alias collisions. All reference operations remain metadata-only. No file is deleted to compensate for SQL/write failures.

45 upload/preview service/controller checks pass with strict public-interface doubles, alongside existing backend checks, three frontend model suites, production build and 213 browser fixture checks. SQLite populated upgrades through 0.4 execute successfully; other database SQL generation only. `tests/upload_http.py` and `tests/frontend/upload-live-checks.mjs` are prepared but not run against installed 0.4.0. The new backend/schema cannot be validated by frontend asset interception alone. Privileged deployment and installed/warm-cache acceptance remain required; UI-09 is not marked fully verified. No commit or push requested.

## UI-09 first-attempt correction — 0.4.1 preparation

Reproduced the installed first upload failure through real multipart requests and isolated it using the authenticated Log Reader API: Nextcloud closes the input stream and UploadService closed it again. The correction guards resource cleanup, and strict filesystem tests now reproduce stream consumption. Add persistent success/path feedback with a Material action opening the containing Nextcloud folder, including successful reconciliation and graceful optional-location failure. Installed correction acceptance awaits privileged deployment.

0.4.1 installed acceptance: server reports 0.4.1; 26 real upload/preview HTTP checks and 257 cache-enabled installed-browser checks passed, including first-attempt upload, notification/path/folder action and regression coverage. Exact served build assets matched. Disposable accounts were removed. No new commit or push.

## UI-10 acceptance work — 2026-10-10

The user accepted 0.4.1 and authorized continuing. Extend integrated keyboard/accessibility-tree, contrast, reflow/enlarged-text, reduced-motion and emulated-touch checks, alongside real video playback/seek/Range acceptance. Keep physical touchscreen/keyboard (including the virtual keyboard), actual browser zoom and all-state contrast evidence separate. The user removed actual screen-reader testing from UI-10 acceptance on 2026-10-10; accessible names and keyboard/focus checks remain required. This decision supersedes historical screen-reader pending notes. See design/integrated-acceptance.md.

Final combined acceptance: **305 actual-Nextcloud browser checks passed**, using installed 0.4.1 assets, cache enabled, no asset interception, including the new UI-10/video checks. The dedicated account and generated originals were removed. No production change/deployment was needed. Phase 3 HTTP acceptance separately passed 130 checks.
