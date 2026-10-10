# Incremental browsing, bulk selection and Nextcloud reference import

Status: planned tasks only, requested 2026-10-10. No implementation or verification is claimed by this document. These additions do not close the remaining US-MS-07/08 release gates.

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
