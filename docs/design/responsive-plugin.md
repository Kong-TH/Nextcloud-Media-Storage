# Responsive Media Storage plugin design

Design proposal, 2026-10-09. Requested direction: MinIO-like organization with Material Design 3 styling, for mobile and desktop. This document defines the implementation tasks; it does not claim a working Nextcloud frontend or accepted bucket architecture.

The latest user action requirements are recorded in [reference actions, FAB and toolbar](reference-actions.md). They supersede the initial standalone creation buttons and minimal selection strip; the current prototype and screenshots now include the action revision; production integration remains pending.

The [library layout refinement](layout-refinement.md) supersedes the original stacked heading/search arrangement: one local navbar, conditional nested breadcrumbs, symmetric content insets and a bottom-aligned footer. Toolbar commands adapt to measured available width, showing more commands as space grows and placing only hidden commands in overflow. Contextual actions float at the bottom, with a separate trailing X button that clears selection and clipboard together, and selected/clipboard counts beside the object count; wide layouts reuse the FAB action band without shrinking the list. Narrow layouts retain an icon-only FAB below the toolbar with scroll-end clearance. Opening its menu preserves reference context; invoking an Add entry clears it.

Review the [interactive design study](prototype/index.html). Open it in a browser, resize the window, and try bucket filtering/navigation, folder navigation, submitted search, selection, object details, a temporary sample folder, reference Copy/Paste/Rename/Move/Remove, creation FAB/menu, contextual toolbar, hover/focus tooltips, light/dark themes and RTL. Data is held in memory and resets on reload. The top blue header is an illustrative host placeholder; production uses the existing Nextcloud shell. [Desktop snapshot](prototype/desktop.png) and [mobile snapshot](prototype/mobile.png) show the latest layout.

## Information architecture

Use one plugin drawer: Objects and API tokens destinations, then a bucket filter and bucket destinations. The main pane contains the selected bucket heading, primary action, contextual search, folder breadcrumb and object collection. A detail pane reveals reference metadata. This follows the user's MinIO layout direction without adding storage-server administration, S3 policies, quota dashboards or unsupported usage metrics.

Buckets in the prototype are explicitly proposed sample destinations. The + Add button beside Buckets creates an in-memory sample destination through a labeled dialog; blank/duplicate names remain in the task for correction. Creation selects the empty destination; reload resets all sample changes. Virtual namespace versus S3/MinIO semantics remain unresolved. Until the storage model is accepted, the production shell can expose the existing owner root as Library and omit bucket creation/removal. Do not simulate persistence by mapping arbitrary bucket names onto existing folders.

## Adaptive behavior

Measure the **available plugin container**, not a device category or full browser width. These are product layout choices informed by Material size classes, not new component API guarantees. Observe height too: short landscape windows need scrolling, not large fixed overlays.

| Available inline size | Navigation | Objects | Details and tasks |
| --- | --- | --- | --- |
| Below 600 CSS px | Menu opens a bounded modal drawer, at most 360px and leaving a dismissible edge | Two-line rows: name, then type/status; no horizontal table scrolling | Replace content with a nonmodal detail/task view and explicit Back; keep state and scroll position |
| 600–839px | Same drawer; no rail or extra bottom navigation | Rows with supporting metadata; actions remain labeled where possible | Single main pane; task/detail view replaces content |
| 840–1199px | Standard drawer at 360px; allow user collapse if actual host leaves too little working space | Flexible rows, no forced metadata columns | Detail replaces main pane; retain navigation |
| 1200px and above | Standard drawer at 360px | Column comparison when space permits | Optional 300px nonmodal detail pane; collapse columns if the remaining object pane cannot fit |

The prototype deliberately constrains a drawer below 320px rather than adopting the old skill's blanket navigation-bar fallback. A small number of app destinations and many buckets make the drawer useful; verify usability at 320px browser width and enlarged text. Never introduce a rail merely because the saved skill suggests one for medium windows.

Desktop schematic: `Nextcloud shell / [drawer | heading + search + breadcrumb + objects | optional details]`.
Mobile schematic: `Nextcloud shell / [menu + context / heading + primary action / search / breadcrumb / rows]`; drawer and details are alternate views, not permanent narrow columns.

## Visual system

Use a calm neutral surface and a single green accent proposal, with Material role-based light/dark schemes. Green is a design choice for review, not a change to Nextcloud's branding. Background surface, low surface drawer, secondary-container current destination, primary filled action, outlined supporting actions, and outline-variant row separators establish hierarchy. Avoid wrapping every section in a card or adding shadows to the object table.

Use a 4px base grid with 8/16/24/32 spacing. Main padding is 16px compact and 24–32px wider. Headings are approximately 28px compact/32px desktop, body 14–16px, metadata 15px on desktop and 12px compact; small desktop labels are 13–14px. Rounded contained search, pill buttons and 28px destination indicators provide Material character. Drawer rows are 56px, interactive targets at least 48px, object rows approximately 80px and expandable for names/text scaling. Inline drawer inset is 12px each side: 360 − 24 = 336px active indicator; do not copy the inconsistent 28px inset arithmetic in the existing skill.

No CDN fonts or icons. Production should bundle verified Material Symbols/SVG assets and respect license notices; the study now bundles Google Material Symbols Outlined SVGs, with source revision and Apache-2.0 license in [icon sources](prototype/icons/SOURCES.md). The system font remains a study choice. All theme selectors and tokens belong to the plugin root. Inherit the host's theme preference and provide a consistent app scheme rather than altering document-wide styles. The study theme/RTL controls and proposed badge are review tools, not final app navigation.

## Object workflows and contracts

| Flow | Intended behavior | Existing support / implementation dependency |
| --- | --- | --- |
| Browse | Choose bucket, then folder; breadcrumb allows returning to ancestors. Persist query/scroll per route where useful | Current node API supports owner root/parent; bucket route awaits model decision |
| Search | Named input: Search this folder by name. Explicit submit; clearing restores listing; scope always visible | GET nodes with parent_id and search returns direct matching children; no recursive bucket search claim |
| Collection | Folder name opens folder; media name opens details. Separate checkbox selects; details control is independently named | Native semantic list first; a real semantic table is appropriate if implementing sortable comparison columns |
| Details | Name, virtual path, node type and current binding state; MIME/size only when actually returned | GET node detail revalidates media binding. Listing does not establish binding availability for every row |
| Add from Nextcloud | Entry under the Add FAB; use a verified host file picker, then reference name/location and confirm | POST bindings requires file_id. Picker API must be verified against Nextcloud 34; avoid asking ordinary users for IDs |
| New folder / rename | New folder under Add FAB; rename from selection actions. Short labeled form; inline error and preserved input; server remains authoritative | POST folders / PATCH node. Validate 255 UTF-8 bytes, exact sibling collision, illegal names and depth limits |
| Move | Explicit destination chooser; show source/destination and disallow illegal targets | PATCH parent_id; server validates cycle/depth/subtree. Cross-bucket moves are undefined until bucket design |
| Remove reference | Confirmation names the reference/subtree and states that original Nextcloud files remain | DELETE node; no physical deletion. Do not display Undo until a real reversible contract exists |
| Broken binding | Show Needs rebind in text plus a recovery action; do not silently substitute another file | GET detail / PATCH binding with virtual node ID and chosen file_id |
| API tokens | Separate drawer page; name, scopes, folder boundary, expiration and status | Existing session issue/list/revoke/rotate routes; show new secret once, no browser persistence/logging |
| Upload / preview / delivery | Add after actual APIs/integration exist; upload can later replace Link as primary | Not implemented. No fake upload dropzone, public URL, preview playback or download action |

Counts are loaded-item counts, not inferred bucket totals. The current API has limit/offset and no authoritative total; use Previous/Next with a safe end-of-page strategy. Sorting in the study covers the complete tiny sample only. Production must either say Sort loaded items or introduce a documented server sorting contract before implying global order. Do not fabricate timestamps, storage size or content types from extensions; the study's file categories/statuses are sample metadata. Defer list-wide binding health until an efficient documented API exists; avoid a detail request for every row on initial load.

## Search, selection and async state

Keep search as an inline form on all widths initially: no suggestions, scrim or combobox until there is a real suggestion source. Enter submits without interrupting IME composition. Scope changes reset pagination and selection, cancel obsolete requests and ignore stale responses. Keep existing content while refreshing if appropriate and distinguish stale/pending data from fresh success.

Selection does not open a folder. Name activation does not toggle its checkbox. Production selection uses the contextual md3-toolbar for count, Clear, Move/Copy/Paste/Remove links and single-link Rename; do not mix navigation and selection into one row activation. Initially support single-object mutations; bulk remove needs explicit multi-request outcomes and partial-failure handling, not a fictitious atomic batch API. Clear selection on folder/bucket/search changes. Never silently select unloaded results.

| State | Presentation / recovery |
| --- | --- |
| Initial loading | Stable structure, concise status, indeterminate feedback when needed |
| Refreshing | Retain current context, indicate pending state, prevent duplicate mutations |
| Empty folder | Explain no references yet; offer Add from Nextcloud and New folder |
| Search with no results | Retain query/scope, offer clear or edit query |
| Request failure | Explain failure and Retry; do not display it as an empty folder |
| Session expired / denied | Stop mutations, use host reauthentication/recovery; do not retry endlessly |
| Name conflict / invalid input | Inline field error, preserve entered values |
| Mutation failure | Keep task open and input intact; reconcile listing after confirmed success |
| Missing reference/binding | Explain unavailable item and allow navigation/rebind if authorized |

Production URL state should carry page, stable bucket/parent IDs and submitted query using Nextcloud routing. Browser Back restores context; names/paths are display values, not authorization boundaries. Retain useful focus and scroll position when leaving details. This route design is proposed frontend work; it creates no new backend endpoints by itself.

## Accessibility and host integration

Use named nav/search landmarks, a real heading hierarchy, native buttons/links and visible focus. Long names can wrap in object rows; essential names must remain available without hover. Use text and icons for error/current/selected states, not color alone. Detail panels are nonmodal: no focus trap, sensible initial focus and restoration. Mobile detail Back and browser Back should agree in production.

A modal drawer/task must trap focus, dismiss with Escape and restore focus. True browser modality can block the host document even when the scrim looks app-sized. The study explicitly inerts its illustrative shell while the compact drawer is open; its native task dialog is document-modal. Production must verify this with the actual Nextcloud host. If the shell needs to stay interactive during a task, use a nonmodal inline pane. Scope overlay ownership and styling; never represent aria-modal=true while permitting focus behind it.

Keep controls usable at 200% text and 400% zoom/reflow, with a virtual keyboard, RTL, reduced motion and a short landscape viewport. Do not infer screen-reader behavior from automated DOM checks. Test focus during resize: a disappearing drawer/details control must not strand focus. Preserve Nextcloud CSP, local bundles, session cookies, requesttoken CSRF and server owner authorization. The design study contains no API calls or credentials.

## Component implementation direction

Use target-compatible Vue with selectively imported, verified @material/web buttons, fields, dialogs and other supported primitives. Drawer, search, toolbar and tooltip composition need custom supported HTML/CSS/behavior as recorded in project skills. Prefer a semantic list/table over a nonexistent Material data-table component. The [Material Web repository](https://github.com/material-components/material-web) currently describes maintenance mode; assess pinned exports and integration before selecting package versions, while preserving the user's Material direction.

The [Google adaptive layout guidance](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes) classifies available app space, including compact below 600 and medium below 840; its Android APIs are not proposed web dependencies. Here CSS container queries and a ResizeObserver can implement corresponding app-width behavior. Product choices above intentionally prioritize the requested drawer and actual content space.

## Delivery slices

See the [UI task backlog](../agile/ui-tasks.md) for dependencies, deliverables and acceptance checks. Begin with build integration and a real owner-root explorer; resolve bucket semantics before bucket persistence and routes. Add one verified API-connected workflow at a time. This study must not replace templates/index.php or be deployed as a working frontend.


## Design feedback refinement — 2026-10-09

Renamed the primary action to Add from Nextcloud: select an accessible existing file and create a virtual reference without copying/uploading the physical file. Replaced Unicode icon placeholders with local Google Material Symbols SVGs. The Sort by control retains native select keyboard/popup behavior but uses an explicit 136px minimum width, 56px height, logical padding and a 24px chevron inset 16px from its trailing edge. Search submit now has a proper Material arrow and 12px container trailing padding. These are product sizing choices; the native option popup remains platform-rendered.


2026-10-09 follow-up: the user requests creation via FAB, contextual toolbar for virtual-only reference actions, hover/focus tooltips with explicit menu-ownership regression checks, and larger small desktop text. See the superseding action specification above. The user confirmed md3-extended-fab as the intended skill; use md3-menu for its action menu composition.


2026-10-09 action prototype completed: Add FAB/menu replaces standalone creation buttons; the contextual toolbar and app clipboard manipulate sample virtual references only; hover/focus tooltips preserve open-menu state; desktop small text increased. Main content scrolls independently above a reserved FAB region. [Updated action evidence](reference-actions.md#standalone-implementation-evidence) and [validation](validation.md) distinguish this study from production behavior.
