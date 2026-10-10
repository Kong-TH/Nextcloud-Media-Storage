# UI implementation tasks

Status: Production core implemented; UI-03 navigation user-accepted. UI-09 daily uploads, thumbnail/detail images and upload success/folder notifications are installed in 0.4.1; 26 upload/preview HTTP checks and 257 cache-enabled installed-browser checks passed. Real silent MP4/H.264 and WebM/VP9 playback/seek/session ranges pass the extended UI-09/UI-10 checks. Physical touch/keyboard and comprehensive visual-state contrast/actual zoom acceptance remain open. Actual screen-reader testing is excluded from UI-10 at the user's request (2026-10-10); historical pending notes are superseded. Historical prototype entries below are superseded by current implementation notes.

| ID | Task | Dependency | Reviewable deliverable / acceptance |
| --- | --- | --- | --- |
| UI-01 | Establish Vue/Material frontend build | Target Nextcloud source/API inspection | Pinned dependencies and reproducible build; app-only asset loading; no CDN/CSP exceptions; custom elements upgrade correctly; existing shell preserved |
| UI-02 | Implement app theme and responsive shell | UI-01 | App-width breakpoints, standard/compact drawer, Library fallback before buckets, Objects/API tokens navigation; light/dark, RTL, focus, resize and narrow host checks |
| UI-03 | Connect real owner-root object browsing | UI-02 | Session/CSRF client, GET nodes, parent breadcrumbs, limit/offset pagination, honest counts, loading/empty/error/reauth states, stale-response protection and browser history |
| UI-04 | Add contextual search and object details | UI-03 | Explicit current-folder name search; query retained; details via GET node; available/needs-rebind status; mobile back and desktop detail pane; no unsupported preview/delivery |
| UI-05 | Add folder CRUD and reference removal | UI-03 | Create/rename/move forms, safe destination selection, inline/server errors, explicit virtual-only deletion confirmation and focus restoration; no silent bulk transaction assumptions |
| UI-06 | Add Nextcloud file linking and rebind | UI-04 | Verify supported file-picker integration; accessible picker/name flow, POST binding/PATCH binding; broken-reference recovery; no ordinary-user File ID entry |
| UI-07 | Add token management page | UI-02 | Paginated metadata, issue with scope/boundary/expiry, one-time secret, explicit rotate/revoke semantics and expired states; no persistent browser secret/logging |
| UI-08 | Integrate accepted bucket model | Bucket decision, schema/API/security/upgrade design; UI-03 | Owner-scoped destinations/filter/create workflows and migration compatibility; documented search/token/move boundaries; no implicit S3 behavior |
| UI-09 | Add upload and preview workflows | Actual upload/preview contracts, UI-06 | Server-validated file handling, progress/cancel/error/retry behavior, actual host preview; primary action hierarchy revised when enabled |

UI-09 storage decision (2026-10-10): store newly uploaded originals in the authenticated account's `Media Storage/YYYY-MM-DD/` directory, grouped by day only. Create missing directories on demand; never overwrite existing files. Physical storage folders are independent of virtual buckets and folders. Existing-file binding and all reference management remain metadata-only. Users manage originals later through Nextcloud. Implementation must define the authoritative date/timezone, validate destination write permissions and quota, and retain file-ID-based binding when an original is moved within accessible Nextcloud storage. This requirement is implemented and verified in installed 0.4.1. See [upload/preview contract](../design/upload-preview.md).
| UI-10 | Validate integrated plugin | Each connected slice, then full feature set | Record real Nextcloud/browser checks, mobile/desktop, focus/keyboard, CSP, zoom/long labels/RTL/themes and host isolation; defer unsupported delivery clearly |

For every slice, update affected architecture/API/schema/security/validation documentation when contracts change. Use real session endpoints and their existing owner/CSRF boundaries. A disabled control or a confirmation never substitutes for server checks.

## Reference-action revision — documentation first

See [reference action requirements](../design/reference-actions.md), recorded before modifying the prototype. Add creation FAB/menu (Add from Nextcloud, New folder), contextual md3-toolbar (Move/Copy/Paste/Remove links; single-link Rename), md3-tooltip ownership/lifecycle handling and desktop small-text increases. The user confirmed md3-extended-fab as the intended skill; combine it with md3-menu for the requested action menu.

Add UI-11: implement source-reference Copy/Paste semantics and app-private clipboard. Dependency: documented backend clone contract, authorization/binding revalidation, naming/collision and subtree/token boundaries. No physical-file operations and no fictional atomic bulk endpoint. Prototype behavior may use in-memory link identity only, with clear sample labeling.

Add UI-12: FAB/toolbar/tooltip interaction regression, including tooltip appearing over an open FAB or toolbar overflow menu without closing it, correct Escape layering, hover travel, click-once, focus restoration, touch and resize. Verify larger desktop metadata/column/helper text without clipping or shell-style changes.

## Acceptance scenarios

1. At compact app width, navigate to a library/folder using the drawer and return focus on dismissal. No clipped labels or document-level horizontal scrolling. A wide browser with a narrow plugin pane behaves the same way.
2. Open a folder, search its direct children, visit details, and return with query/context retained. Change context while a request is pending; an old response must not overwrite the new scope.
3. Create a valid folder through the Add FAB, recover from a duplicate/server error without losing input, rename and move it safely. Remove a reference and verify the physical Nextcloud file remains.
4. A broken binding remains identifiable and offers an authorized rebind path. Metadata failure is distinguishable from an empty folder or missing media.
5. Token issue reveals the secret once. Reload/list never reveals it. Rotation does not imply immediate revocation of the old token; revocation is explicit.
6. At desktop width, use the drawer/list/details with keyboard alone; at mobile width, complete the same core tasks without horizontal table scrolling. Resize during an open view and retain meaningful focus.
7. Verify real target integration with both themes, RTL, accessible names and keyboard focus, enlarged text, zoom/reflow, reduced motion, virtual keyboard and host navigation/modal behavior. Record actual results and untested platforms.

## Design-study evidence

The standalone prototype now exercises creation FAB/menu, contextual reference actions, clipboard aliases and tooltip/menu interactions on sample data; sample-model tests passed; the current layout/action suite passes 332 Chrome checks. Production UI-01 through UI-12 remain pending; see [prototype validation](../design/validation.md). It provides no deployment, API integration, upload, bucket persistence or production accessibility evidence.

8. Copy a reference to another virtual folder, give it a different name, and verify both references retain the same original Nextcloud binding. Move/remove one reference and confirm the original file and other references remain. Copying a folder duplicates only virtual structure/references; clipboard conflicts/errors are explicit.
9. Display the selection toolbar and paste destination state without overlapping content or a competing creation FAB. Tooltips must not close menus or steal focus. Small desktop text follows the updated sizing and remains readable in both themes.


10. Preserve the [refined library layout](../design/layout-refinement.md) in production: one title/search navbar, conditional nested breadcrumbs, equal measured content insets, a bottom-aligned content-sized footer and responsive FAB clearance. Recheck proportions after each component integration across pane widths/heights and selection/details/search states. Use the bottom floating toolbar in the existing FAB band, with selected counts after the object count. Selection must preserve list height and first-row position. Standalone evidence is now 332 Chrome checks; production UI tasks remain pending.


11. Below the toolbar overflow breakpoint, retain an icon-only Add FAB below the floating toolbar and use an expand-more arrow for the final toolbar action. Add menus may cover the toolbar. Test selection/clipboard preservation on open, tooltip, Escape/outside dismissal; clear context only on invoking either Add command and keep it cleared after task cancellation. Verify both stack levels, last-row keyboard/pointer clearance, resize/RTL and no extra permanently reserved list height. Wide layouts retain exclusive FAB/toolbar behavior.


12. Use one separate trailing X action outside the rounded toolbar; remove inline Clear selection and all Clear clipboard duplicates. Cancel clears selection and clipboard together and restores Add focus, including clipboard-only state. Preserve already applied reference operations. Verify 8px separation, 56px cancel target, its separate Tab stop, Enter/Space, RTL, desktop/compact stack geometry and unchanged reference data.


13. Stretch the compact (<600px) toolbar/X group to equal 24px pane insets aligned with FAB. Include + Add beside Buckets and a labeled creation task with input validation/focus recovery. The study implements in-memory sample destinations only; production depends on accepted bucket semantics and backend contracts.


14. Pack toolbar commands from actual pane/group width, not fixed Copy/Rename/Remove breakpoint rules. Reserve X, toolbar padding/gaps and overflow, keep 48px icon targets, prefer readable labels when all fit, and expose only hidden commands in overflow. Observe resize/font changes and preserve focus/menu state. Verify 320/360/375/390/420/480px widths, including five visible commands at 390px.


15. Latest user decision supersedes compact action stacking: hide Add FAB whenever selection/clipboard context displays the toolbar at every width. Place contextual actions in the existing bottom band with no extra compact scroll-end padding. Keep full mobile width and measured packing. Test clipboard-only context, cancellation restoring Add, resize/RTL and final-row reachability. Historical paired-action acceptance scenarios are superseded.


16. Size anchored creation menus independently of fixed offsets before measuring placement. Align the menu with the FAB logical trailing edge (29px desktop inset), preserve compact layout, and clamp very narrow menus inside the viewport. Verify final geometry on first/repeated open, live resize and RTL alongside tooltip/menu regression checks.


17. Give object rows a full-row primary hit area and hover/press/keyboard focus feedback, retaining independent sibling checkbox and information controls. Preserve native semantics, row dimensions, dividers and bottom action clearance. Verify whitespace activation, selection without opening, folder information without navigation, RTL and both themes.


18. Soften full-row hover/press/focus surfaces with 16px corners on compact and desktop layouts. Retain existing margins, row sizes, straight dividers and independent controls; verify focus-outline shape alongside the existing row interaction checks.

## Current production implementation

The user approved this prototype and confirmed virtual buckets. Version 0.3.0 implements real session-backed bucket/folder navigation and creation, current-folder search, existing-file binding/rebind, reference rename/move/copy/paste/remove and token management. The latest FAB/toolbar exclusion, measured overflow, separate cancel and rounded-row decisions supersede earlier stacking proposals. See [production contract and evidence](../software/08-production-explorer.md). Upload, previews and binary media delivery remain open; earlier sample-only descriptions above record prototype preparation.

## UI-03 navigation completion — 0.3.9 requirements before code

Use a plugin-owned #ms: URL fragment to identify page, bucket, folder, submitted search, object sort and optional details. Preserve the Nextcloud pathname/query and shell; no server route, schema or API changes. Store only scroll offset in a namespaced history.state member. Never persist selection, clipboard, dialog drafts, file-picker state or token secrets. Submitted navigation creates history entries; repeated identical destinations do not. Back/Forward, direct URLs and reload restore authenticated state and rebuild folder breadcrumbs from current server parent IDs/names, bounded to 128 ancestors and confined to the selected bucket. Search is direct-child only.

Missing/foreign/deleted buckets fall back to default with visible feedback; invalid/moved/deleted folder or detail IDs cannot expose another bucket. Retryable network/auth failures remain explicit rather than silently becoming empty folders. Restored URLs are canonicalized with replaceState. Cancel superseded list/detail/navigation requests. Back/Forward during a mutation is deferred until it finishes; navigation closes unsubmitted dialogs and clears one-time secrets. Restore list scroll after loading and focus the current view without stealing focus on ordinary async list refresh. Validate nested traversal, search, sort, details, page changes, reload, Back/Forward, deletion, malformed/foreign IDs, races, pagination and session errors.

## Historical task status — 0.3.9

UI-01/02/04–08/11/12 core implementation is present; integrated accessibility and release acceptance remain under UI-10. UI-03 includes paginated real browsing, visible loading/empty/retry/session errors, stale-response protection and now URL/history/scroll restoration. UI-09 upload/preview is implemented in prepared 0.4.0 source; installed acceptance remains pending. UI-10 still needs latest installed/warm-cache checks, screen-reader, real touch/virtual keyboard, and full zoom/contrast validation. Historical prototype statements do not describe current production feature availability.

UI-03 implementation verification: production build, three frontend model suites, 190 browser fixture checks (including 205-row pagination/scroll) and 245 actual-Nextcloud checks with candidate assets passed. Core implementation is complete; installed/warm-cache acceptance remains pending deployment of 0.3.9.

## Current task status — 0.4.1, 2026-10-10

The user accepted the installed UI without observed errors. UI-01–09/11/12 core behavior is implemented; UI-09 silent MP4/H.264 and WebM/VP9 playback/seek and authenticated session ranges now pass. Phase 3 HTTP acceptance passed 130 checks. UI-10 focused acceptance passed 49 installed checks covering modal/AX names, background control exclusion, focus return, opaque text contrast pairs, reflow equivalents, targeted enlarged text, reduced motion and touch emulation. See [integrated acceptance and manual checklist](../design/integrated-acceptance.md).

Physical mobile/keyboard (including the virtual keyboard), real browser zoom and complete visual-state contrast remain manual release gates. The user removed actual screen-reader testing from UI-10; accessible labels and existing keyboard/accessibility-tree checks remain in scope. CDP emulation and token-pair measurements do not fulfill them. Phase 4 signed/temporary access and external streaming protections remain planned; current video delivery delegates to authenticated Nextcloud DAV. No production UI change or app redeployment is needed for this test/documentation slice.

Final combined installed-browser acceptance passed 305 checks with cache enabled and no candidate interception; disposable account cleanup completed.

## New requested tasks — 2026-10-10, planned only

The user requested recording four additions before implementation. See [bulk selection and import requirements](../design/bulk-selection-and-import.md) for behavior, edge cases and mandatory test cases.

| ID | Task | Dependency | Acceptance |
| --- | --- | --- | --- |
| UI-13 | Incremental object loading in batches of 25 | Existing browsing/navigation | Append at scroll end; accurate counts; stable ordering; no duplicate or stale rows; loading/retry/exhaustion states |
| UI-14 | Select-all with loaded/all-matching dropdown modes | UI-13 and bounded server selection contract | Select loaded UI objects or all matching database objects; counts/exclusions and all bulk actions include unloaded selections |
| UI-15 | Multiple file/folder selection in Add from Nextcloud | Existing picker and source enumeration contract | Row checkboxes, selection across navigation, select-all after Home; separate navigation/selection and multi-item naming |
| UI-16 | Per-folder keep/flatten import choices with Material progress | UI-15 and bounded batch import contract | Independent choice per selected folder; flatten only its outer wrapper; preserve nested folders; official md-linear-progress, partial failure/retry/cancel and multi-folder tests |

No production code was changed for these tasks. The user requested task registration only; implementation awaits a subsequent instruction. Existing US-MS-07/08 and manual UI acceptance remain open.
