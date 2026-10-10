# Incremental browsing, bulk selection and Nextcloud reference import

Status: UI-13, UI-14 and UI-15 implemented in prepared 0.7.0 source; UI-16 remains planned. Installed acceptance is tracked separately. These additions do not close the remaining US-MS-07/08 release gates.

## UI-13 — Load objects in batches of 25

Initially load at most 25 direct-child objects in the current virtual folder/search result. When the user reaches the end of the loaded list, fetch and append the next batch of at most 25. Continue until the server reports exhaustion. Preserve sorting, search scope, stable object IDs, loaded rows, selection and scroll position while appending. Display loaded count and total result count accurately.

Allow only one append request at a time. Prevent duplicate rows and repeated end-of-list requests. Changing bucket/folder/search/sort invalidates the old paging state and late responses; reset to the first batch. Show initial, append, retry and empty states distinctly. A failed append keeps already loaded rows and selection and retries the failed batch without duplication. Define stable server pagination/ordering under concurrent changes before implementation; offset alone must not silently skip or duplicate results after insertions/deletions.

Acceptance cases: 0/1/24/25/26/50/51 objects; repeated end intersection; viewport taller than one batch; slow/failed append and retry; folder/search/sort change during loading; insert/delete between pages; duplicate response; scroll restoration; desktop/mobile and final-row clearance with the selection toolbar visible.

## UI-14 — Select all with a scope dropdown

Add a select-all control to the object-management view, with an adjacent dropdown-arrow action to choose between:

- **Loaded objects:** select every object currently loaded into the UI.
- **All matching objects:** select the entire current folder/search result in the database, including objects not yet loaded. For 100 matching objects with only 25 loaded, this mode selects all 100.

The scope is the current virtual bucket/folder and submitted search, not every owner's object or every descendant folder. Sorting changes order, not the matching set. Show the active scope, selected count and checkbox checked/mixed/unchecked state. Allow individual deselection and clearing selection. Loaded mode applies to the loaded set at activation; appending another page does not silently select new objects. All-matching mode also represents matching rows when subsequently loaded. Changing folder/bucket/search clears selection; do not persist bulk selection across reload/history navigation.

Define a bounded server-backed selection/snapshot or equivalent validated batch contract before implementation. Do not fetch/render the full database merely to select it. Specify snapshot consistency, excluded IDs, stale/deleted entries and per-object authorization at action time. Existing Move/Copy/Paste/Remove link actions must operate on the full selected set, not only rendered rows. Rename remains single-object only. Maintain the existing FAB/context-toolbar behavior. All effects remain plugin metadata operations; no original Nextcloud file move/rename/delete.

Acceptance cases: 100 matches/25 loaded in both modes; switch modes; append after loaded selection; append under all-matching selection; deselect one unloaded/loaded result through the selection contract; mixed state; clear/cancel; search and bucket isolation; concurrent create/delete/move and permission changes; bulk actions affecting non-rendered items; partially failed actions; mobile dropdown/keyboard/focus/tooltips and no unexpected menu dismissal.

## UI-15 — Multi-select in Add from Nextcloud

Allow selection of multiple existing Nextcloud files and folders in the picker. Add independent row checkboxes and a select-all control **after Home** in the compact navigation row, alongside Back and the current folder name. Keep folder navigation separate from selection: clicking a folder to browse must not toggle its checkbox, and checking it must not navigate. Preserve selected source IDs when browsing between folders, show the selection count and clearly identify the current folder.

Picker select-all applies to eligible direct children of the browsed Nextcloud folder, including any not currently rendered if picker pagination is introduced. Define the source enumeration/pagination contract before implementation; unsupported files cannot become selected through select-all. At root, Back/Home remain appropriately disabled. Never conflate this operation with Upload media: this adds virtual references to existing files, without transmitting new originals.

Single-file selection retains the existing optional virtual display-name flow. Multi-item selection preserves source names by default; do not reuse one required name field for every selected item. Validate owner access and supported file types server-side. Specify name conflicts, repeated/overlapping selections and partial failures visibly; do not silently overwrite references or import an item twice because its parent was also selected.

Acceptance cases: one/multiple files; multiple folders; files plus folders; checkbox versus navigation; select/deselect all; root/home/back; selection retained across navigation; unsupported/missing/unreadable/foreign files; duplicate/overlapping selection; duplicate destination names; single-name versus multi-name forms; empty selection; desktop/mobile dialog fit, keyboard/focus return and submission error recovery.

## UI-16 — Per-folder import choices and progress

Before importing selected folders, show a review step with an independent choice for **each selected top-level folder**:

- **Keep folder:** create its virtual folder and import supported descendants into the corresponding virtual structure.
- **Import contents here:** omit only that selected folder's outer wrapper and add its direct children to the chosen virtual destination. Direct child files become links in the destination. Direct child folders retain their own virtual folder and normal nested structure; do not recursively flatten descendants.

Example: source `A/` has ten files and `A/Sub/deep.png`. Keeping A yields `destination/A/<ten files>` and `destination/A/Sub/deep.png`. Importing A's contents yields `destination/<ten files>` and `destination/Sub/deep.png`. Selecting B at the same time may independently keep B or import its contents. This is a virtual-reference import; originals stay at their current Nextcloud paths.

Show a review of destinations and resolve conflicting/overlapping choices before writing. Define traversal bounds, batch size, durable operation identity/retry behavior, permissions rechecks and partial completion/cancellation before code. A large folder must not require loading its full tree into one UI frame or one unbounded server request. Unsupported or unavailable descendants must be reported with the chosen failure/skip policy; do not imply all entries succeeded. Cancellation stops future work and reports already-created references; it cannot silently promise rollback.

Use official **@material/web md-linear-progress** for enumeration/import loading. Use indeterminate progress while the total is unknown; determinate progress plus completed/total counts when known. Show clear completion, failure and retry states, preserve responsiveness, and prevent duplicate submissions. Apply the project's dialog/button/list/menu guidance and plugin-scoped styling. Recheck dialog geometry, row spacing, overflow, toolbar/FAB and loading states after adding components, on desktop and mobile. This measurable operation uses progress components rather than a custom Expressive loading animation.

Acceptance cases: A has ten files; keep A; flatten A's outer wrapper; A contains a subfolder with deeper descendants; A/B both kept, both flattened and mixed decisions; empty folder; only nested folders; unsupported descendants; same-name files/folders from different roots; selected child plus ancestor with consistent/conflicting choices; wide/deep/large trees; source mutation/permission loss during enumeration or import; network failure after partial success; retry without duplicate links; cancellation and repeated submission; progress unknown-to-known/completion/error; original byte/path preservation and cross-account isolation.

## Delivery sequence and test obligations

Implement UI-13 first, then UI-14; implement UI-15 before UI-16. Document API/schema/security changes and batch/selection/import consistency before backend edits. Use relevant local Material skills during implementation. Each task requires focused model/service tests and actual browser/API acceptance for its behavior, including large collections and multiple-folder combinations. Record local and installed results separately; writing these test cases is not a passing test result. No new screen-reader gate is added.

## UI-13 implementation contract — 2026-10-10

User authorized UI-13 after committing the prior packaging/backlog slice. Add an opt-in `paged=true` session listing mode: `limit=25`, `offset`, `sort=name|type`, and subsequent `revision` from the first response. Return `total`, `has_more`, `next_offset`, `revision`, and server-ordered nodes. Legacy offset listings and external APIs retain their existing contract. Sort and count in the database, including MIME-backed type order, with ID tie-breaking; do not sort each loaded subset independently in the browser.

Use the existing owner-root lock_version as a conservative collection revision, with checks before and after the queries. All existing metadata transactions increment it. A changed revision returns 409 and requires an explicit reload rather than appending a potentially shifted page. Other owner metadata transactions can also invalidate paging; this conservative behavior is intentional. This is a revision-validated live collection, not a persistent snapshot; no schema change or full-collection fetch is needed. Root/page/count reads must use fresh committed visibility so concurrent writes cannot pass undetected. Refresh resets paging; unchanged append preserves rows, selection, focus and scroll. Hydrate binding details only for the new batch, with bounded concurrency.

Provide scroll-end automatic loading and a keyboard-accessible Load more/Retry fallback. Display an official md-linear-progress during append. Initial and append errors are separate; an append failure retains data. On navigation abort and discard superseded requests, even if transport cancellation is ignored. Restoring history scroll may fetch enough bounded pages to reach that position, without eagerly loading the entire folder. Version 0.6.1 will distinguish the changed frontend in Nextcloud asset caches. UI-14–16 remain planned.

## UI-14 implementation contract — 2026-10-10

Authorized next task: UI-14. Selecting All matching stores the current parent, submitted search, root revision, total and excluded IDs; activation performs no extra listing requests. Loaded mode captures only currently loaded IDs. Choosing a mode activates that selection; the checkbox clears or selects its current mode. Individual exclusions update mixed state and count. Sort retains selection, while navigation/search/reload clears it.

Before Copy, Move, Remove or single-object Rename, resolve an all-matching descriptor through revision-validated pages of at most 25, then perform a final revision check before any writes or clipboard change. Show official linear progress and prevent competing navigation/submissions. Any enumeration error or stale revision stops before mutation and retains the selection for explicit recovery. This is a validated live collection, not a durable snapshot or transaction covering an entire bulk action. Existing per-object endpoints recheck authorization; partial mutations report completed items and preserve remaining explicit IDs. Transient metadata for unloaded selected objects supports names and clipboard operations without rendering those rows. Paste uses the full captured clipboard. No schema or new API endpoint is needed; no original file is moved/deleted. Selection is never persisted in URL/history/storage.

UI-14 local completion: 265 combined fixture browser checks, five frontend suites, 30 actual SQLite paging checks, 69 strict-double service checks, schema validation and 66 archive checks pass. Scope-menu width/offset respects object-list insets and RTL; the official self-hosted font subset includes check/select_all. Option activation uses Material Web close-menu reasons for pointer and Enter/Space, excluding Escape. Selection-preparation failures show a visible alert and stale-revision reload above the list. Installed 0.6.2 verification remains pending deployment; UI-15/16 are not implemented.

## UI-14 header placement correction — 2026-10-10

User rejects the extra selection-control layer. Put select-all in the existing checkbox column and the scope arrow immediately before Name in the same column-heading row. Remove the standalone selection row and its visible scope label. Preserve an accessible scope label, checked menu choice and tooltip. Keep this compact header available on mobile, hiding only Type/Binding labels. Do not change row columns, content insets or selection behavior. Verify the controls share the header row on desktop/mobile and with details open. Prepared cache version: 0.6.3.

0.6.3 placement evidence: build, five frontend suites, 268 combined browser fixture checks, 32 focused browser checks (including details-open geometry) and 66 archive checks pass. Desktop/details and compact screenshots visually inspected. Installed verification remains pending.

## Sticky object and detail headers — 2026-10-10

User requests the existing checkbox/Name/Type/Binding header to stay at the top of the object scroll area after it reaches that edge, and OBJECT DETAILS/Close to stay at the top of the independent details scroll area. Use scoped CSS sticky positioning with opaque matching surfaces and local stacking, preserving natural layout height and the Nextcloud shell. Keep the detail close action clickable at the scroll end. Account for header height in keyboard scroll clearance. Check desktop/mobile, both themes, RTL, scope popover stacking and details content longer than the viewport. Closing the scope menu must restore focus without changing list scroll; use preventScroll for its sticky anchor while respecting focus moved outside the menu. Prepared cache version: 0.6.4; no API/schema changes.

## Two-row sticky header refinement — 2026-10-10

Prepared 0.6.5 follows the user request to pin the existing Objects/count/selected/Sort row together with the column header. Both existing rows share one opaque sticky wrapper; no additional visible row. Progress/errors remain outside that wrapper. Object details/Close now has a 72px minimum height and 12px vertical padding, with keyboard scroll clearance adjusted for both headers. Scope-menu focus restoration continues to preserve scroll. No API/schema or Nextcloud shell changes. Build, five frontend suites, 42 focused / 279 combined browser fixture checks and 66 archive checks pass. Desktop/light and compact/dark/RTL screenshots visually inspected. Tests verify both summary and columns remain pinned together, scroll stays unchanged after scope-menu closure, and the 72px detail header keeps Close clickable at the end. Installed verification requires root deployment.

## UI-15 implementation contract — 2026-10-10

Authorized after checkpoint d9f2d18. Prepare 0.7.0. The existing authenticated WebDAV Depth:1 enumeration remains complete per browsed folder (no picker paging); reject listings above 1000 entries or 2 MiB instead of silently selecting a truncated subset. Select all includes eligible direct children only, excluding unsupported MIME types and missing IDs. Selection is keyed by source ID and retained across navigation; folder navigation and row checkboxes are independent. One selected file keeps its optional display name; multiple selections use source names. Selected ancestors cover selected descendants once, with an explicit covered count.

Folder import defaults to preserving structure for UI-15; per-root flatten/keep choices remain UI-16. Before writes enumerate a bounded plan (1000 entries, 128 levels), report unsupported descendants, reject repeated/cyclic source IDs and duplicate top-level destination names. Existing destination name conflicts stop without overwriting. Sequential per-entry writes recheck authenticated source and destination access. A session-only POST /api/v1/imports/entries accepts request_id (UUID), file_id, folder flag, parent_id and name. Derive node ID from authenticated owner, request UUID and source ID; owner-locked retries return the existing identical node, rejecting changed parent/name/type/binding. This makes lost-response retries safe while that node exists, without a new schema or durable job promise. Deleting the created metadata removes this retry identity; the task is memory-only and is not resumed after reload.

Use official linear progress: indeterminate enumeration, determinate completed/total writes. Retain the prepared plan and completed mapping on failure, and retry the same request UUID. Cancellation stops future entries, waits for any in-flight write, and reports already created references; no rollback or original file operation. Disable source edits once a plan is prepared; Close discards the local task, not saved metadata. UI-16 will extend review choices and large-operation lifecycle separately. APIs have no external/bearer route and retain session/CSRF middleware. Source creation, moves and deletes remain unavailable.
