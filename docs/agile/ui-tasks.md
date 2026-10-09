# UI implementation tasks

Status: Proposed, 2026-10-09. Based on the [responsive design](../design/responsive-plugin.md) and standalone sample prototype. No production frontend tasks below are complete. Bucket semantics remain an independent prerequisite for bucket persistence.

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
| UI-10 | Validate integrated plugin | Each connected slice, then full feature set | Record real Nextcloud/browser checks, mobile/desktop, focus/keyboard, screen reader, CSP, zoom/long labels/RTL/themes and host isolation; defer unsupported delivery clearly |

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
7. Verify real target integration with both themes, RTL, screen-reader announcements, enlarged text, zoom/reflow, reduced motion, virtual keyboard and host navigation/modal behavior. Record actual results and untested platforms.

## Design-study evidence

The standalone prototype now exercises creation FAB/menu, contextual reference actions, clipboard aliases and tooltip/menu interactions on sample data; sample-model tests passed; the current layout/action suite passes 333 Chrome checks. Production UI-01 through UI-12 remain pending; see [prototype validation](../design/validation.md). It provides no deployment, API integration, upload, bucket persistence or production accessibility evidence.

8. Copy a reference to another virtual folder, give it a different name, and verify both references retain the same original Nextcloud binding. Move/remove one reference and confirm the original file and other references remain. Copying a folder duplicates only virtual structure/references; clipboard conflicts/errors are explicit.
9. Display the selection toolbar and paste destination state without overlapping content or a competing creation FAB. Tooltips must not close menus or steal focus. Small desktop text follows the updated sizing and remains readable in both themes.


10. Preserve the [refined library layout](../design/layout-refinement.md) in production: one title/search navbar, conditional nested breadcrumbs, equal measured content insets, a bottom-aligned content-sized footer and responsive FAB clearance. Recheck proportions after each component integration across pane widths/heights and selection/details/search states. Use the bottom floating toolbar in the existing FAB band, with selected counts after the object count. Selection must preserve list height and first-row position. Standalone evidence is now 333 Chrome checks; production UI tasks remain pending.


11. Below the toolbar overflow breakpoint, retain an icon-only Add FAB below the floating toolbar and use an expand-more arrow for the final toolbar action. Add menus may cover the toolbar. Test selection/clipboard preservation on open, tooltip, Escape/outside dismissal; clear context only on invoking either Add command and keep it cleared after task cancellation. Verify both stack levels, last-row keyboard/pointer clearance, resize/RTL and no extra permanently reserved list height. Wide layouts retain exclusive FAB/toolbar behavior.


12. Use one separate trailing X action outside the rounded toolbar; remove inline Clear selection and all Clear clipboard duplicates. Cancel clears selection and clipboard together and restores Add focus, including clipboard-only state. Preserve already applied reference operations. Verify 8px separation, 56px cancel target, its separate Tab stop, Enter/Space, RTL, desktop/compact stack geometry and unchanged reference data.


13. Stretch the compact (<600px) toolbar/X group to equal 24px pane insets aligned with FAB. Include + Add beside Buckets and a labeled creation task with input validation/focus recovery. The study implements in-memory sample destinations only; production depends on accepted bucket semantics and backend contracts.


14. Pack toolbar commands from actual pane/group width, not fixed Copy/Rename/Remove breakpoint rules. Reserve X, toolbar padding/gaps and overflow, keep 48px icon targets, prefer readable labels when all fit, and expose only hidden commands in overflow. Observe resize/font changes and preserve focus/menu state. Verify 320/360/375/390/420/480px widths, including five visible commands at 390px.
