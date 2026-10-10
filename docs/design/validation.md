# Responsive design study validation

2026-10-09, standalone local HTML/CSS/JavaScript in [prototype](prototype/index.html). Browser: headless Google Chrome 154.0.8037.97, Chrome DevTools Protocol. No Nextcloud deployment or server API requests.

Executed checks:

- Viewports 1440×1000, 1024×900, 840×900, 839×900, 768×1024, 390×844 and 320×740: no document horizontal overflow; drawer visibility follows plugin width.
- The scrollbar reduces available width on some views: viewport 840 produced a plugin width of 825px and correctly selected compact drawer behavior. The check was corrected to use actual app width rather than viewport width.
- Compact drawer opens with modal semantics and background inert state; Escape closes it and restores its trigger.
- Entering a sample folder and returning to its parent updates the listing. Wide details keep the main pane visible without horizontal overflow.
- Submitted folder search filters sample data; compact details replace main content and closing restores the originating control.
- Creating a temporary sample folder updates only the in-memory model; selection state is exposed.
- Dark/RTL mode at the narrow viewport retains the no-overflow condition. No JavaScript runtime exceptions occurred.
- Initial desktop and mobile screenshots were visually inspected for action hierarchy, drawer/list adaptation and text placement. The snapshots use illustrative host styling and locally bundled Material Symbols.
- JavaScript syntax and Git whitespace validation passed.

These checks do not establish integrated Vue/@material/web support, Nextcloud CSP compatibility, server behavior, real storage/buckets, touch-device behavior, screen-reader announcements, full contrast compliance, 200% text enlargement or 400% zoom. The complete production checklist remains in the [UI tasks](../agile/ui-tasks.md). No existing backend tests were rerun for this standalone design/documentation change.


Refinement check, 2026-10-09: reran the same standalone Chrome checks after replacing glyphs with local SVG symbols and renaming Add from Nextcloud. Symbol geometry rendered, the native select measured at least 136×56px at all seven viewports, and no horizontal overflow or runtime exceptions occurred. Refreshed desktop/mobile snapshots; mobile screenshot was visually inspected. Native popup appearance and actual assistive-technology behavior remain platform checks.


## FAB, reference toolbar and tooltip revision

Requirements/architecture/API/schema/task documentation was updated before code. The user corrected the FAB skill name to md3-extended-fab; it was read with md3-menu, md3-toolbar and md3-tooltip before implementing the sample revision.

Executed in Chrome 154.0.8037.97: **71 checks passed**, using [the standalone CDP script](../../tests/design/browser-checks.mjs). At all seven existing viewports, checked no horizontal overflow, FAB containment and clearance above the independently scrolling object viewport, toolbar replacing FAB, toolbar fit, and checkbox synchronization after Clear selection. Also checked:

- Desktop metadata/column text increased to 15px/14px.
- Tooltip mounting, pointer travel into the tooltip, clicking an owned tooltip and rapid item hover preserve the FAB menu. Escape dismisses tooltip before menu; outside click dismisses menu while retaining the new focus target.
- Tooltip over toolbar overflow preserves that menu; dismissal and compact-menu Copy restore invoking focus. Menu Down/Home/End/Tab and toolbar roving arrows work.
- FAB opens New folder; sample Copy → Paste with a distinct alias → inspect original target → Rename → Move → Remove preserves the other reference. Name collision retains the dialog and reports an error.
- Narrow dark/RTL mode has no horizontal overflow. No runtime exceptions occurred.

[Reference model tests](../../tests/design/reference-model.cjs) passed for stable file-target identity, independent aliases, rename/move/remove, folder-subtree cloning, ancestor-selection normalization, collision atomicity, cycle rejection, stale sources and byte/depth limits. These are in-memory invariants; no physical filesystem or Nextcloud server was exercised.

During testing, fixed Clear selection leaving stale checked boxes; corrected implicit grid-row sizing that let content extend under the FAB; moved compact Copy into overflow to keep 48px targets at 320px; and moved tooltip click cleanup to capture phase so it precedes new menu focus. Tests now cover these observed regressions.

Updated and visually inspected desktop/mobile, [FAB/menu](prototype/fab-menu.png) and [toolbar](prototype/toolbar.png) snapshots. The toolbar/menu snapshots include sample interactions and may show a temporary folder. Screen-reader, real touch, virtual keyboard, full text/zoom/contrast, integrated Material Web and actual Nextcloud behavior remain unverified. Existing backend tests were not rerun.


## Header, balanced padding and footer refinement

2026-10-09: [Layout requirements](layout-refinement.md) were recorded before prototype changes. Read md3-search, md3-extended-fab and md3-toolbar plus their design references. Removed stacked duplicate headings and the root breadcrumb; the local header now contains the title and search. Replaced asymmetric scrollbar spacing with symmetric gutters and aligned header/list/footer content. Replaced unconditional bottom padding with a footer that shrinks when selection hides the FAB.

Chrome 154.0.8037.97: **165 checks passed** using the maintained CDP script. The earlier 71-check result is historical evidence for the previous revision. Current checks cover:

- Nine viewports: 1920×1080, 1440×1000, 1317×918 (the supplied image size), 1024×900, 840×900, 839×900, 768×1024, 390×844 and 320×740.
- Equal measured left/right list insets (within 1px), header/search alignment with list content, no root breadcrumb duplication, collection controls immediately below the navbar and footer flush with the pane bottom. On this browser the 15px scrollbar gutters yield 47px equal desktop insets and 31px equal compact insets, including content padding.
- FAB trailing inset 29px on desktop and 24px on compact layouts; scrollport ends at least 8px above the FAB. Selection hides the FAB and reduces footer height below 88px. Toolbar controls fit without horizontal scrolling.
- Short viewports 1440×600, 1024×600, 390×600 and 320×568: last-row details control can scroll fully into view; navbar stays above the scrollport; empty search and details fit the pane.
- Nested breadcrumbs still navigate ancestors. Desktop RTL uses the logical trailing FAB edge and keeps equal list insets. Existing reference actions, tooltip/menu ownership, focus and keyboard regressions still pass; no runtime exceptions.

Desktop, supplied-size desktop, mobile and selected-toolbar screenshots were visually inspected. Refreshed tracked desktop/mobile/FAB-menu/toolbar snapshots. JavaScript syntax and Git whitespace checks passed. This is standalone UI evidence only; production host, real touch/virtual keyboard, screen reader, full zoom/text enlargement and contrast checks remain pending. Backend tests were not rerun because no backend code or contract changed.


## Bottom floating contextual toolbar

2026-10-09: User supplied a Material floating-toolbar reference and requested maximum object space. Updated [layout requirements](layout-refinement.md) before code and read md3-toolbar design/web references. Moved toolbar from above the object rows into the bottom footer band. Selected count follows object count; clipboard status joins the collection summary. Contextual actions replace the footer explanation while visible, with a 64px rounded surface, 48px targets, responsive overflow and reduced-motion-aware entry. They suspend during details, navigation, tokens and dialogs.

Chrome 154.0.8037.97: **201 checks passed**. In addition to existing action/menu/tooltip/keyboard and layout coverage, all nine viewport sizes verify unchanged first-row position and list viewport height before/after selection, selected-count ordering, 64px bottom toolbar containment, and final-row clearance. Four short-height layouts verify selected last-row reachability and toolbar separation from the scrollport. Emulated reduced motion disables entry animation. Existing clipboard/navigation and dialog focus regressions pass, with no runtime exceptions.

Visually inspected desktop toolbar and compact 390px/320px toolbar snapshots. On compact widths counts wrap within the existing sorting-row height; selection still adds no top spacing. Refreshed tracked snapshots and added [mobile toolbar](prototype/toolbar-mobile.png). JavaScript syntax and Git whitespace checks passed. No backend code/contracts changed or backend tests reran. Actual Nextcloud integration, screen readers, touch/virtual keyboards, full zoom and contrast checks remain pending.


## Compact FAB beneath toolbar and Add lifecycle

2026-10-09: Recorded the latest compact arrangement before code, applied md3-toolbar/md3-menu/md3-extended-fab guidance with the user's explicit pairing override. Below 1200px plugin width, keep a regular icon-only FAB beneath the contextual toolbar with a 12px gap. The compact overflow button now uses the local expand-more arrow. The toolbar floats over the list with 92px scroll-end padding rather than reserving another permanent band. Wide layouts retain exclusive creation/contextual surfaces.

Chrome 154.0.8037.97: **252 checks passed** in the maintained CDP suite. Existing nine viewport and four short-height scenarios remain covered. New checks verify responsive paired/exclusive surfaces, toolbar/FAB separation, no list-height loss, final-row scrolling and focus clearance at all six narrow widths. At 1024px, 390px and short 320px, both Add entries are exercised with selection plus copied references: opening the menu preserves context; hit testing confirms the menu covers the toolbar; Escape and outside dismissal preserve state; invoking an entry clears selection/clipboard before showing its task; cancelling the task keeps context cleared and restores FAB focus. Resize wide/narrow and compact RTL preserve the expected arrangement. Existing tooltip/menu, keyboard, reference and reduced-motion regressions pass without runtime exceptions.

Initial geometry checks sampled toolbar entry motion; they now wait for actual animation completion. Native-dialog close is asynchronous; cancellation assertions wait for its close event and focus restoration. No clipboard resurrection was observed after close completion. Compact paired/menu-overlay snapshots were visually inspected, including tooltip ownership while the menu covers the toolbar. See [paired toolbar/FAB](prototype/toolbar-mobile.png) and [Add menu overlay](prototype/compact-add-menu.png).

Syntax and Git whitespace checks passed. Changes remain standalone sample UI only. No backend code/contracts changed or backend tests reran; actual Nextcloud, screen-reader, touch/virtual-keyboard, full zoom and contrast checks remain pending.


## Single separate cancel action

2026-10-09: Recorded the user's correction before code: remove the inline X and Clear clipboard duplication, and compose a separate trailing X surface beside the toolbar. The toolbar now contains reference commands only. The separate tonal rounded-square X is 56px with an 8px gap and its own Tab stop, label and tooltip. It clears selection and clipboard together, closes action overlays, hides the contextual group and restores Add focus; it remains enabled in clipboard-only state. Applied reference operations are preserved.

Chrome 154.0.8037.97: **292 checks passed**. New scenarios cover selection-only, clipboard-only and combined context at 1440×1000, 390×844 and 320×568; verify no duplicate clear controls, separate 8px/56px geometry, all context cleared on X, focus returned to Add and reference listings unchanged. Additional checks cover separate Tab navigation, native Enter and Space activation, and trailing placement in RTL. Existing compact stack/menu-overlay/Add lifecycle, toolbar arrows, tooltip/menu ownership, last-row scroll/focus clearance, short heights and reduced motion remain passing. No runtime exceptions.

The CDP keyboard helper initially sent no text event for Enter and did not activate the native button. Event inspection confirmed normal native activation with Enter text plus virtual key codes; the helper now sends the actual activation sequence for Enter/Space. No duplicate application keyboard handler was added. Refreshed six snapshots; desktop and compact toolbar images were visually inspected. JavaScript syntax and Git whitespace checks passed. No backend code/contracts changed or backend tests reran. Actual host, screen-reader, touch/keyboard-device, full zoom and contrast checks remain pending.


## Mobile action width and bucket creation entry

2026-10-09: Requirements recorded before code. Below 600px, contextual toolbar/X grouping now spans the main pane with equal 24px insets, matching the FAB trailing edge. Commands distribute across the flexible toolbar while the separate X remains 56px with an 8px gap. Added the missing + Add button beside Buckets, following md3-button/md3-dialog guidance; it opens an explicitly sample-only bucket task.

Chrome 154.0.8037.97: **304 checks passed**. Added measured mobile group/FAB edge alignment at 390px and 320px. Bucket checks cover heading placement and 48px target, sample-only dialog disclosure, trimmed-empty and case-insensitive duplicate errors preserving input/dialog, cancellation preserving destinations and returning trigger focus, creation selecting an empty sample destination and clearing filters, and compact drawer/task cancel/create focus/inert restoration. Existing toolbar/FAB, cancellation, keyboard, tooltip, reference, RTL, short-height and reduced-motion regressions still pass without runtime exceptions.

Refreshed seven snapshots, including [bucket dialog](prototype/bucket-dialog.png). Visually inspected desktop Add placement, widened compact toolbar and bucket task. JavaScript syntax and Git whitespace checks passed. Bucket creation is in-memory UI simulation and resets on reload; it does not settle the open virtual/S3 storage question or implement production naming/persistence/API rules. No backend code/contracts changed or backend tests reran. Real host, assistive technology, touch/keyboard-device, full zoom and contrast checks remain pending.


## Toolbar actions packed from actual available width

2026-10-09: Requirements recorded before code; applied md3-toolbar guidance. Removed fixed Copy/Rename/Remove visibility rules. Measure the action budget after reserving X/separation/padding/gaps and overflow. Keep labels when all commands fit; otherwise use 48px icon targets, displaying as many commands as fit with Move/Paste priority. The menu exposes exactly the hidden commands and matching disabled states; its arrow disappears when all fit. Observe main/group resize and font readiness/loading; repair focused actions/menus when visibility changes.

Chrome 154.0.8037.97: **333 checks passed**. Continuous compact sweep verifies 3, 4, 4, 5, 5 and 5 visible slots at 320, 360, 375, 390, 420 and 480px respectively, including the overflow arrow only when needed. All targets retain 48px geometry and no toolbar overflow. At 390px all five reference actions are visible. Tests verify hidden-command-only menu contents, disabled-state parity, focus moving to overflow on shrink and back to a visible command on grow, obsolete menu dismissal, stable menu preservation on a 320→321px resize, long-label fallback and readable-label restoration. Existing reference, bucket, cancellation, FAB/menu/tooltip, short-height, RTL and reduced-motion checks remain passing without runtime exceptions.

During verification, intrinsic labeled widths needed nonshrinking buttons for accurate measurement; otherwise flex shrinking understated the required width. Resize observers must close the menu only when the packed command set changes; closing on every observation caused a tooltip/menu regression. Both are now covered by the suite. Visually inspected the refreshed [390px toolbar](prototype/toolbar-mobile.png) showing five actions. Snapshot refresh accompanies this revision. Syntax and Git whitespace checks passed; backend/production integration and full assistive technology/device/zoom/contrast checks remain pending.


## FAB/toolbar exclusion on every width

2026-10-09: Documented the latest user correction before code. Mobile now hides Add during reference context exactly like desktop, superseding compact stacking/menu-over-toolbar behavior. Toolbar/X occupies the existing bottom action band, retaining full mobile width and measured packing; removed compact extra scroll-end padding. Packing uses actual footer content width after padding at every size.

Chrome 154.0.8037.97: **332 checks passed**. Replaced superseded paired/menu-overlay cases with all-width exclusion and Add-after-cancellation checks. All nine existing viewports hide FAB when toolbar is active. At 1440/1024/390/320px, selected/copied context hides Add, X clears context/restores Add focus, both Add entries open their tasks afterward and task cancellation restores Add without old clipboard state. Selection-only/clipboard-only/combined contexts, resize/RTL, short-height/final-row access, adaptive 48px targets, native keyboard, tooltip/menu, bucket tasks and long labels remain passing without runtime exceptions.

Moving the toolbar back into footer flow required measuring footer content width rather than the earlier absolute-positioned compact budget; the 1024px fit check caught and verified this correction. Refreshed seven snapshots and visually inspected the mobile toolbar: all five actions and separate X remain, FAB is hidden, and contextual actions sit lower in the existing bottom band. The compact Add-menu snapshot now shows creation after cancellation rather than overlapping contextual actions. Syntax and Git whitespace checks passed. Standalone UI only; backend tests were not rerun, and production/assistive-technology/device/zoom/contrast checks remain pending.


## FAB menu edge alignment — 2026-10-09

Documented the requirement before code. Reproduced the desktop defect at 1440px: the menu's final right edge was 1440px while the FAB ended at 1411px. Fixed-position automatic sizing depended on the previous left position, so measuring before positioning produced a different final width. The new trailing-alignment assertion failed at 1920px before the fix.

Use an intrinsic menu width independent of fixed offsets, bounded by the viewport; anchor FAB menus to the logical trailing edge, including RTL. At desktop widths the menu retains the FAB's 29px inset; at 390px it retains the existing compact layout and 24px inset. At 320px a wider menu clamps to the 8px viewport boundary rather than clipping. Keep the 8px vertical anchor gap.

Chrome 154.0.8037.97: **365 checks passed**, including nine viewport sizes, initial/repeated menu open, live open-menu resizing through 1440/1024/390/320/1440px, RTL alignment, balanced content insets, all-width FAB/toolbar exclusion and existing tooltip/menu, keyboard, reference and bucket-task regressions. Desktop and compact Add-menu screenshots were refreshed and visually inspected. No runtime exceptions. Production Nextcloud integration, real touch/screen-reader and full zoom/contrast testing remain pending; no backend tests were rerun for this isolated study change.


## Full-row primary action feedback — 2026-10-09

Documented before code. The old `.object-name` button alone received the rounded hover background and clicks; the new whitespace hit-test failed at 1440px before implementation. A positioned pseudo-element stretches the native primary button hit area across the row, while sibling checkbox and information controls remain above it with their own targets. Row hover/press/focus state layers replace the name-only pill; primary keyboard focus outlines the whole row. Metadata remains readable without intercepting the primary hit area. No row-level click handler, nested interactive controls or duplicate focus stops were introduced.

Chrome 154.0.8037.97: **383 checks passed**. Added desktop/mobile whitespace hit tests and activation, whole-row hover/press styling, keyboard focus outline, checkbox selection without opening, folder information without navigation, and RTL/dark-theme primary and secondary hit testing. Existing nine-viewport layout, final-row clearance, menu/tooltip, reference, adaptive toolbar and bucket-task checks remain passing with no runtime exceptions. Mobile full-row feedback screenshot was visually inspected; toolbar snapshot refreshed. See [row feedback](prototype/row-feedback-mobile.png). Production integration, real touch and screen-reader validation remain pending. No backend changes or backend test rerun.


## Rounded full-row surfaces — 2026-10-09

Documented before code. Applied custom 16px corners to the row state surface and stretched primary button/focus outline on compact and expanded layouts. Kept straight dividers using a decorative, pointer-transparent separator; existing borders reserve the same space. Adjusted whitespace hit probes to stay inside the rounded surface and extended the existing keyboard-focus check to verify both row and outline radii. Chrome 154.0.8037.97: **383 checks passed**, including desktop/mobile, RTL/dark theme and prior menu/toolbar/reference regressions. Refreshed row-feedback and toolbar mobile images; row-feedback image visually inspected. Production integration and real touch/screen-reader validation remain pending.

## Production host validation — 0.3.0

The approved prototype is now implemented in the Vue/Material app. Following the user's final deployment, **46 browser checks passed against installed assets** on Nextcloud 34.0.4, with browser cache disabled and no JS/CSS interception. Checks cover real bucket/folder creation, DAV binding, rename/copy/move/remove with physical-byte preservation, token issue/rotate/revoke and ephemeral secrets, symmetric content insets, toolbar/FAB exclusion, fit/menu containment at 1440/1024/390/320px, compact drawer isolation/Escape and the actual host content-height/closed-dialog/desktop-close regressions. Desktop/mobile screenshots in /tmp were visually inspected.

This is separate from the 383 standalone prototype checks and 32 built-frontend HTTP-fixture checks. Full assistive-technology, physical touch, contrast/zoom, actual-host RTL/dark-theme and other provider/deployment coverage remain unverified. Upload/previews/delivery remain deferred.

2026-10-10 installed revision: 96 live browser checks passed after user deployment, without asset interception and with cache disabled. Added native dialog geometry at five sizes including short-height views, scroll-reachable picker actions, green text/filled button interaction states and heading colors in light/dark plugin themes, plus file-link copying, clipboard-denied fallback and native viewer/login redirects. Updated /tmp dialog screenshots were visually inspected. Full contrast, screen-reader and touch validation remain unverified.

Corrected Copy scope: the user specified plugin virtual paths. The deployed correction passed 96 browser checks with cache disabled and no asset interception. Copy now returns virtual_path exactly, preserves bucket context and follows virtual aliases/folder moves, with success and clipboard-denied fallback tests. Native Nextcloud URL generation was removed. Existing dialog/theme regressions still pass; 32 built-frontend HTTP-fixture checks and frontend build/rules also pass.

0.3.1 cache-upgrade validation: 99 installed-asset browser checks passed with cache enabled in the existing Chrome profile, preserving HTTP cache. Both JS/CSS URLs changed from recorded 0.3.0 values and actual HTTP bytes matched the build; dialog geometry, light/dark green interaction states and plugin-path copy/rename/move/fallback regressions also passed. User confirmed version 0.3.1 enabled. No Nextcloud restart or global cache changes.

0.3.3 preparation verified: production build and frontend rule checks pass; 71 built-frontend HTTP fixture checks pass with 20 CSRF-backed requests. The final assets pass 134 browser checks in the actual Nextcloud host using candidate JS/CSS/font interception and disposable account cleanup. Both mobile and desktop candidate screenshots were visually inspected. Actual pointer animations, disabled suppression, keyboard/menu/tooltip interaction, full-row geometry, responsive packing and FAB/menu insets are covered. PHP bootstrap/template syntax checks pass. Source version is 0.3.3; privileged deployment, installed-version display and warm-cache upgrade verification are pending. Do not describe candidate results as installed evidence. Screen-reader, real touch and full zoom/contrast validation remain deferred.

0.3.3 installed verification (2026-10-10): after the user deployed, all **138 live Nextcloud browser checks passed with cache enabled and no candidate interception** (Chrome 154.0.8037.97). Both JS/CSS asset URLs changed from the recorded installed release and served bytes match the local build. The server supplies 0.3.3 and the drawer displays only v0.3.3. Official local icons/font and actual Material ripples load under host CSP; disabled/keyboard/menu/tooltip behavior, responsive toolbar/FAB geometry, light/dark dialog states and virtual-path/reference/token regressions pass. Installed mobile/desktop screenshots were visually inspected. The dedicated fixture account was removed and the harness exited successfully. Screen-reader, real touch and full zoom/contrast validation remain deferred.

0.3.4 preparation verified (2026-10-10): production build and frontend rule checks pass. 107 built-frontend fixture checks pass with 20 CSRF-backed API requests; 170 actual-Nextcloud candidate browser checks pass using local JS/CSS/font interception and disposable DAV folders. The original installed spacing failure was reproduced (53px Add bucket width, zero padding) before correction. Rendered Add bucket and labeled toolbar spacing, one-row picker navigation, root/pending disabled state, parent/Home keyboard behavior, focus return, long names, selection/name preservation and content-hashed font URL pass. Candidate desktop, dark compact picker and nested compact screenshots were visually inspected. Installed baseline is still 0.3.3; 0.3.4 deployment and installed warm-cache/font-byte verification remain pending. No API/schema changes.


## 0.3.5 token dashboard preparation — 2026-10-10

Before changes, installed 0.3.4 passed 172 actual-host browser checks without candidate interception; asset URLs were recorded for the next warm-cache upgrade. Source 0.3.5 build and frontend model tests pass; token service/controller suite passes 73 checks, explorer passes 69 + 23 checks, and schema checks pass (SQLite execution; MySQL/PostgreSQL SQL generation only). The built-frontend HTTP fixture passes 132 browser checks with 24 CSRF-backed requests, including four summary counts/filtering, revoked/expired precedence, search/reset/sort, configured one-hour expiry, typed over-limit rejection preserving drafts, absent-policy fail-closed behavior, copy success/denial/manual selection, secret cleanup and 320/390/840/1440/1914px geometry. Fixture viewport setup now gives html/body explicit height so screenshots reflect the intended viewport rather than an initial browser-window height.

Desktop light and compact dark dashboard fixture screenshots were visually inspected (`/tmp/mediastorage-tokens-1440-light.png`, `/tmp/mediastorage-tokens-390-dark.png`); they contain only fixture token metadata and no secrets. Secret dialogs are excluded from screenshots. Installed 0.3.5/API-policy and warm-cache acceptance, updated live HTTP checks, screen-reader, real touch and full zoom/contrast validation remain pending. Candidate asset-only interception cannot validate new PHP policy metadata, so no 0.3.5 candidate result is claimed. No schema change.


## 0.3.6 bucket removal preparation — 2026-10-10

Installed 0.3.5 passed 192 actual-Nextcloud browser checks without interception; its asset URLs were recorded for the next upgrade. Source 0.3.6 passes production build and frontend model tests, 69 baseline + 38 bucket/copy checks, 76 token/scope checks, and schema checks (SQLite execution, MySQL/PostgreSQL SQL generation only). The built-frontend HTTP fixture passes 151 browser checks with 36 CSRF-backed requests. New checks exercise hidden-at-rest/reveal-on-hover, sibling 48px actions, default Library protection, keyboard Enter/Tab/Escape, compact focus/touch discovery, RTL, unchanged label typography, cancellation/focus restore, retry after simulated connection failure, inactive/current removal and fallback to Library. Desktop/compact removal screenshots were visually inspected; original-file preservation, nested metadata deletion, exact traversal boundary, rollback and token-boundary retention are covered by service tests.

Updated live browser and Phase 3 HTTP suites prepare installed endpoint/CSRF/owner/physical-byte/token-boundary/concurrency checks. They have not run against 0.3.6: the new PHP route must be deployed first. Asset-only candidate interception cannot prove this endpoint. No 0.3.6 installed/candidate result is claimed. Screen-reader, real touchscreen and complete zoom/contrast validation remain pending. No commit/push requested for this revision.

## 0.3.7 bucket management preparation — 2026-10-10

Supersedes the undeployed 0.3.6 removal-only UI. Production build and two frontend model suites pass; PHP strict-interface doubles pass 69 baseline + 62 bucket/copy checks and 76 token/scope/lifecycle checks. Schema tests execute SQLite upgrades and validate MySQL/PostgreSQL SQL generation only. Python HTTP harness compiles; this is not an HTTP execution result.

The production-frontend HTTP fixture passes **163 browser checks with 47 CSRF-backed requests**. Coverage includes hover/focus edit disclosure on every bucket including Library, independent navigation/action targets, invalid and successful current/default rename with stable identity, disabled default deletion, default/current clear, repopulation after clear, draft-preserving confirmation Cancel/Escape, retry after simulated failure, deletion fallback, keyboard/focus, typography, 48px targets and desktop/390px/320px RTL dialog containment. Desktop and 390px editor screenshots were visually inspected; screenshots contain fixture data only. Backend doubles additionally verify exact name uniqueness, rollback, owner/type/default protection, traversal bounds, retained root keys, subtree/binding cleanup and original-file preservation.

Installed baseline remains 0.3.5: 192 actual-host browser checks passed without interception. New backend routes require privileged deployment before installed 0.3.7 browser/cache and Phase 3 HTTP acceptance. Prepared HTTP checks include rename/clear ownership and CSRF, duplicate/invalid names, stable default identity, retained empty roots, other links and exact original bytes, plus removal concurrency/token boundaries. These updated installed suites have **not run**. Screen-reader, real touchscreen, complete zoom/contrast and other database execution remain pending. No new commit or push requested.

0.3.8 color-only follow-up: production build and all 163 built-frontend HTTP-fixture browser checks (47 CSRF-backed requests) pass. The updated compact editor screenshot was visually checked: Clear contents/Delete bucket use neutral text and icon colors. Existing disabled/default protection and confirmation behavior passed the same suite. Installed 0.3.8 verification remains pending deployment.

## UI-03 actual-host candidate evidence — 2026-10-10

Production build and three frontend model suites pass. The actual Nextcloud host passed **243 browser checks with candidate JS/CSS/font assets and real session/CSRF-backed APIs**, cache disabled, using a disposable account that was removed. Server-supplied version observed during this run was 0.3.8; candidate frontend is 0.3.9. No installed 0.3.9 result is claimed.

Coverage includes current/default bucket rename/clear/delete protection, modal cancellation/focus, URL Back/Forward, reload, nested Unicode breadcrumbs/search, sort, folder details, tokens page, unsaved dialog dismissal, missing/cross-bucket/deleted destinations, delayed requests, simulated 401/503 response handling and retry, pending-mutation navigation, unchanged host URL and original physical bytes. An initial harness failure selected the Nextcloud shell h1; assertions now scope to #main. Actual-host Escape evidence identified host default prevention after capture; plugin dialog Escape handling fixes this without changing shell listeners. Physical touchscreen, screen-reader and full zoom/contrast validation remain pending.

For installed acceptance after root deployment, run the actual-host suite without candidate interception and with cache enabled, comparing the recorded prior asset URLs. The updated Phase 3 Python HTTP suite still requires its separate execution; browser checks do not imply its concurrency/HTTP assertions passed.

Final built-frontend HTTP fixture: **190 checks passed with 154 CSRF-backed requests**, including compact Back/reload/focus, 205-row pagination over offsets 0/100/200, accurate counts, and scroll restoration on Back/reload. Fault injection deliberately simulates delayed fetches, 503 and expired-session 401 responses; these are UI recovery checks, not proof of a real session timeout.

Final UI-03 acceptance preparation: **245 actual-Nextcloud candidate browser checks passed**, cache disabled, including the final compact reload/Back/focus additions. Dedicated fixture account cleanup completed. Production build, three frontend model suites and **190 HTTP-fixture browser checks** pass. Final source/build is 0.3.9; installed/warm-cache acceptance awaits privileged deployment. No new commit or push.

## UI-09 prepared source validation — 0.4.0, 2026-10-10

Production build and three frontend model suites pass. The built-frontend fixture passes 213 browser checks (202 requesttoken-backed API requests), including Upload menu, dialog containment at 1440×844, 390×844 and 320×568 dark/RTL, MIME/size guidance, same-file retry, failed/ambiguous completion, Stop after commit, official Material linear progress, real thumbnail decoding and unavailable preview retry. Desktop and compact dialog screenshots are fixture-only. No installed backend or actual video result is inferred from fixture responses.

Backend: 45 new upload/preview/isolation checks with strict public interfaces plus existing suites. SQLite populated schema/re-entry executes through migration 000400; MySQL/PostgreSQL generation only. Live multipart/CSRF/owner boundaries, preview service, actual original bytes, original moves, link-removal preservation and warm-cache acceptance are prepared and await privileged deployment. Physical touch, screen-reader and comprehensive zoom/contrast remain unverified.

## UI-09 first-upload diagnosis and 0.4.1 preparation — 2026-10-10

Live disposable HTTP reproduced the failure: policy/CSRF/foreign destination/spoofed MIME/empty-file checks passed, then the first valid multipart upload failed. The test removed its accounts. Authenticated Log Reader records TypeError at UploadService line 109: fclose on an already-closed stream. Installed Nextcloud View::file_put_contents explicitly closes the input stream; its own caller guards subsequent cleanup with is_resource. This is concrete failure evidence, not a passing installed suite.

Corrected source passes 46 upload/preview/isolation checks, including consumed and open input-stream cases; three frontend model suites and production build pass. Built-frontend fixture passes 232 browser checks with 214 CSRF-backed requests, including responsive success/path notices (1440/390/320, dark/RTL), Files folder link, dismiss/focus, lost-response and Stop reconciliation, and optional-location lookup failure. Corrected installed first-upload, real folder navigation and warm-cache acceptance await privileged deployment. No physical-user originals were changed during diagnosis.

Installed 0.4.1 upload HTTP acceptance: **26 checks passed** using two disposable accounts, both cleaned up. The first valid multipart request succeeds without Retry, original bytes/date/file-ID binding are correct, folder URL returns the Files HTML view, retry is idempotent, owner/CSRF/MIME boundaries hold, actual preview and session content work, and reference deletion preserves originals. The first preview run exposed an invalid IDAT CRC in the test PNG, confirmed by computing the PNG chunk CRC; corrected the fixture in HTTP/fixture/live browser tests and reran the complete HTTP suite successfully. This was test data corruption, not a preview service change. Installed browser acceptance also passed: **257 actual-Nextcloud UI checks**, using installed JS/CSS/font assets, cache enabled, no candidate interception, with exact build-byte comparison and the recorded pre-upgrade 0.3.5 asset URLs. Includes real upload success/path notice, containing Files folder URL and accessibility, thumbnails/detail preview, existing bucket/token/navigation regressions and cleanup. This does not claim physical touchscreen, screen-reader, comprehensive contrast or video playback validation.
