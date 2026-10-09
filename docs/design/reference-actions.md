# Reference actions, creation FAB and selection toolbar

Current behavior: Add FAB and contextual toolbar are mutually exclusive at every width. Selection or clipboard context hides Add; the separate X clears both and restores Add focus. The toolbar occupies the existing bottom action band on mobile and desktop, retaining adaptive packing and full mobile width. This latest user decision supersedes compact stacking/menu-over-toolbar requirements in historical revision notes below.


User requirements recorded 2026-10-09 **before prototype or production code changes**. This revision supersedes the earlier standalone Add from Nextcloud/New folder buttons and minimal selection strip. Standalone prototype implementation is complete; production Vue/API integration remains pending. The user confirmed the intended skill is `.agents/skills/md3-extended-fab/SKILL.md`. Use it for the labeled/icon-only FAB, with md3-menu for the explicitly requested action menu composition, md3-toolbar for selection actions and md3-tooltip for hover/focus feedback.

## Reference semantics

All plugin Move, Rename, Copy, Paste and Remove actions affect virtual nodes and their link metadata. They never move, rename, copy, overwrite or delete physical files in Nextcloud. One physical file can have multiple independent references in different virtual folders, with different display names. Renaming one reference changes its virtual path/name while retaining its binding to the same Nextcloud file. Removing one reference must leave the original and other references intact.

Virtual folders are app-owned hierarchy, not physical Nextcloud directories. Folder moves and renames change paths for contained references only. Removing a virtual folder removes its virtual subtree and bindings, preserving physical content. Folder copy, when implemented, duplicates virtual structure and references; it does not copy media bytes. Changes to the actual Nextcloud file can affect every reference to that file, and an unavailable original can make all related bindings need recovery. Do not imply that copying a reference creates a backup.

| Command | User-facing behavior | Identity and binding invariant |
| --- | --- | --- |
| Rename link | Change the plugin name; original name/path is untouched | Existing virtual node ID and original binding retained |
| Move links | Choose a plugin destination folder; update virtual parent/path | Virtual node IDs and original bindings retained; other links unaffected |
| Copy links | Put selected source reference IDs into an app-private clipboard | Source unchanged; no physical/system clipboard copy |
| Paste links | Create new virtual references in current destination using the same underlying file bindings | New virtual node IDs; independently editable names; no file duplication |
| Remove links | Confirm names/count and virtual subtree consequences | Delete only selected virtual nodes/bindings; preserve source files and other links |

The clipboard is in-memory app state, retained across plugin folder navigation and cleared on reload/session or owner change. It must not contain bearer tokens, file bytes or external clipboard credentials. Revalidate source/destination/owner and binding permissions on paste. If a source is deleted or loses access before paste, report the affected source rather than silently substituting another file. Keep the clipboard after a successful copy/paste so another destination can receive another reference; provide Clear clipboard.

Name collisions require explicit recovery: ask for a new link name or show a per-item conflict. Do not overwrite, silently merge folders or replace an existing binding. Copy into the same folder is valid only with a distinct accepted name. Reject cyclic destinations, including a folder copied/moved into itself or its descendants. For multiple selection, collapse descendant duplicates when an ancestor already includes them. Preserve server depth/subtree bounds and report partial outcomes if using multiple requests; never advertise an atomic batch before implementing one. Cross-bucket behavior remains pending the bucket model and token-boundary design.

## Creation FAB

Use one app-owned Add FAB as the entry point for Add from Nextcloud and New folder. These two actions leave the heading/search rows. Opening the FAB reveals an anchored action menu with labeled entries and meaningful Google Material icons. This is an explicit product request for a FAB/menu composition; the confirmed extended-FAB and menu skills must be consulted for exact shape, positioning and motion.

Keep the FAB inside the plugin pane, clear of Nextcloud navigation, safe areas, list controls and virtual keyboards. Use an independently scrolling main-content viewport ending above the reserved FAB footer area, with scroll clearance, so the FAB cannot cover an actionable object row. Desktop may use a labeled FAB; compact layout may use an icon-only FAB with accessible Add name and tooltip. Do not assume an unsupported Material Web FAB-menu API exists.

Open by click, Enter or Space. Expose expanded state and popup association, move focus into the menu, support menu arrow/Home/End navigation, Escape and Tab dismissal, and restore focus to the FAB when appropriate. Activating an entry closes the menu and opens its task with meaningful focus; cancelling returns to the surviving Add entry point. Pointer travel between FAB, menu and associated tooltip must not dismiss the menu.

## Contextual md3-toolbar

Use the saved md3-toolbar guidance for an app-owned action container; no invented md-toolbar API. Display it when selection contains references/folders, and retain a paste destination affordance while an app clipboard is populated even if selection is empty. Without selection or clipboard, hide it. Show the selected count immediately after the object count in the collection header. Place Move links, Copy links, Paste links and Remove links in the bottom toolbar; Rename link is available for exactly one selected node. Paste targets the current folder, not an ambiguously selected row. Label destructive commands Remove links rather than Delete files.

Hide the creation FAB while the contextual toolbar is active on every width, including clipboard-only context. It returns after X ends reference actions; Add task dialogs continue to suspend it. Use one separate trailing X action outside the toolbar to cancel reference actions, clearing selection and clipboard together. Remove the redundant Clear clipboard command from both toolbar and overflow. This latest user decision supersedes the earlier separate-clear behavior. Preserve toolbar state while navigating to a paste destination; announce destination and clipboard count. Hide/suspend context actions on the token page and during an unrelated modal task.

Place a rounded floating toolbar at the bottom of the plugin pane, outside the object scroll flow. Reuse the FAB clearance band and hide the explanatory footer text while contextual actions are shown. Selection must not move the first row down or shrink the list viewport. Use the same bottom action band on narrow layouts, with no additional stack or scroll-end padding; final-row controls must remain reachable above it. On desktop, show readable labels and overflow if needed. On mobile, keep the separate Cancel action and the most relevant commands reachable, with commands packed according to measured pane space, prioritizing Move/Paste and placing only hidden commands in trailing overflow; do not make a screen-wide horizontal action scroller. Reserve content space for the surface. All targets remain at least 48px. If using role=toolbar, implement a single Tab entry and arrow navigation, including focus repair when controls become disabled/hidden. The action menu and toolbar are distinct widgets with their own keyboard rules.

Move opens a plugin-folder destination task; Copy updates the app clipboard; Paste opens collision/name review when needed; Remove opens an explicit virtual-only confirmation. Preserve inputs and selection after failure. Production server authorization remains authoritative for every command.

## md3-tooltip and floating-menu interaction

Provide plain tooltip feedback on action buttons for pointer hover and keyboard focus, with accessible names independent of visibility. Use informative action descriptions where labels already exist rather than repeating the same spoken name/description. Do not hide deletion consequences or essential instructions only in a tooltip. Follow the saved md3-tooltip guidance for nonfocusable tooltip semantics, Escape dismissal and hover/focus persistence.

Maintain separate menu-open and tooltip-visible state. A tooltip must never take focus, trigger menu toggling, or cause menu dismissal merely by mounting/unmounting. Associate each tooltip with its owner trigger and the trigger's current overlay scope. Outside-pointer detection should use explicit ownership/composed event paths, not a generic DOM mutation, focusout or pointerleave callback. A pointer entering an owned tooltip remains inside its owner's menu interaction scope; support travel across the intervening gap. Tooltips must be hoverable and must not intercept intended menu item clicks.

Show at most one tooltip; cancel pending show/hide timers when the trigger is removed, disabled, its task changes or its menu closes. Keep description IDs stable and remove only the tooltip's own aria-describedby token. Ignore stale timers after re-render. On Escape, dismiss the visible tooltip first without closing its menu; the next Escape may close the menu and restore focus. Suppress immediate tooltip reopening from the same still-hovered/focused trigger until a fresh interaction.

Required regression: open FAB menu, hover a menu action until its tooltip appears, travel between action and tooltip, then activate the action. The menu must stay open during tooltip display/travel, the action must fire once, and focus must enter the correct task. Repeat with keyboard, Escape ordering, outside click, rapid hover between items, scrolling/resizing, touch and removed triggers. Also exercise toolbar overflow menus with tooltip ownership.

## Desktop typography

Increase small plugin desktop text by approximately 3px initially: 10→13px section/eyebrow labels, 11→14px column/detail labels and 12→15px metadata, counters, status, helper copy and footnotes. Use the app's available width (desktop layout from 840px), not global body/host styles. Keep normal body/action text at least 14–16px and headings proportionate. Allow wrapping and adjust columns rather than clipping newly larger text. Validate both themes, 200% text enlargement, RTL and narrow desktop panes; compact text may remain independently tuned. This is the selected interpretation of the requested 3–5px or roughly 10% increase.

## Backend support and sequencing

Current code already separates virtual node names/parents from bindings, permits multiple virtual nodes per physical file, and supports virtual move/rename/remove. It has **no dedicated source-reference clone or clipboard/paste API**. File-ID binding is not a general copy contract: a copy should preserve and revalidate the source binding's storage identity without silently rebinding to a different file. Restricted tokens cannot use file-ID bind/rebind and must not gain new rights through copy/paste. The browser uses authenticated session routes.

Before production Copy/Paste, define and implement an owner-authorized source-node copy contract, collision behavior, transaction boundaries, subtree limits, binding revalidation and token restrictions. No endpoint path is accepted by this document. Existing files, credentials and token boundaries must survive unchanged. A prototype can model reference identity and clipboard semantics in memory but must state that nothing is persisted.

Deliver in order: record requirements (this revision), use the confirmed FAB/menu skills, update the standalone prototype and regression checks, then implement production Vue/API slices with the required backend contract. The sample reference model and 71 standalone Chrome checks now pass; see [validation evidence](validation.md). No production server or Nextcloud integration tests ran for this revision.


## Standalone implementation evidence

The prototype uses semantic HTML/CSS and application-owned behavior following the confirmed skills; it does not install or claim integrated Material Web components. Model data includes an immutable original-file fixture and a stable sample source-file ID per media reference. Copy clones node IDs while retaining that target, and details display both the alias and original identity. New folder, Rename, Move, Paste and Remove update only in-memory sample metadata.

The creation FAB is icon-only on compact screens and labeled Add on desktop. Contextual toolbar suppresses the FAB, retains paste context across folder navigation and uses compact overflow for Copy/Rename/Remove/Clear clipboard. A bounded independent main scrollport ends above the reserved FAB area. Tooltip/menu state is separate; tooltip ownership includes the trigger's action menu. The capture-phase click handler clears the previous tooltip before a menu/task transfers focus, avoiding accidental suppression of the newly focused menu item's tooltip.

See [FAB menu with tooltip](prototype/fab-menu.png) and [selection toolbar](prototype/toolbar.png). The test model establishes sample semantics only; original physical-file preservation still requires real server tests when backend/UI integration is implemented.


Latest placement correction: the toolbar now occupies a 64px content-hugging floating surface in the existing bottom action band. Selection/clipboard counts are in the collection header. Entry slides upward with a custom 180ms animation unless reduced motion is requested; no Material library animation API is implied. Toolbar placement and counts supersede the earlier inline selection strip. See [desktop toolbar](prototype/toolbar.png), [mobile toolbar](prototype/toolbar-mobile.png) and the 201-check [validation record](validation.md). Reference behavior and production integration status are unchanged.


Superseded compact Add lifecycle (historical): clicking the FAB opens a higher-layer menu that may cover the toolbar. Opening, Escape, tooltip dismissal and outside dismissal preserve reference selection/clipboard. Invoking either Add from Nextcloud or New folder clears selection/clipboard and ends the toolbar context before opening the task. Cancelling the task retains the cleared state. The trailing compact toolbar button uses expand-more and preserves existing menu keyboard/focus behavior. The current [compact Add menu](prototype/compact-add-menu.png) is available after cancelling reference context. This latest user decision supersedes blanket FAB/toolbar mutual exclusion in earlier revision notes.


Latest cancellation composition: the rounded toolbar contains only reference commands; an 8px gap separates a 56px rounded-square tonal X button. The X is outside role=toolbar, has its own normal Tab stop, accessible Cancel reference actions name and tooltip. It remains enabled for selection-only, clipboard-only or combined context. Activation closes action overlays, clears selection/clipboard, hides the action group and returns focus to Add. Already applied reference operations remain intact; cancellation affects pending interaction state only. Desktop and compact grouping retain existing bottom placement, FAB stacking and Add menu lifecycle.


Latest compact width: below 600px, the full toolbar/X action group spans equal 24px pane insets and aligns with the FAB trailing edge. The toolbar fills remaining space; X and its 8px gap keep their existing dimensions. The separate + Add beside Buckets opens a sample-only bucket task; invoking it ends reference selection/clipboard context consistently with other Add commands. No bucket persistence or storage model is implied.


Adaptive packing supersedes fixed action-hiding breakpoints: measure pane/group space after reserving X, separation, padding, gaps and overflow. Keep labels if all commands fit, otherwise use 48px icons and maximize visible actions. At 390px all five commands fit and overflow is hidden; 360–375px show three commands plus overflow; 320px shows Move/Paste plus overflow. Only hidden commands appear in the menu, with matching disabled state. Resize/font/group observers repack and repair focus; unchanged packing preserves open menus.


Creation-menu geometry: compute placement from a stable intrinsic width; align the FAB menu logical trailing edge with its trigger (RTL included). Preserve desktop 29px trailing clearance and compact placement, with viewport clamping on very narrow panes. Reopening or resizing an open menu must retain its anchor relationship without affecting reference context.


Object-row feedback spans the full row rather than only the name button. Whitespace activates the primary open/inspect action. Checkbox and information controls remain independent siblings; neither checkbox activation nor keyboard focus implicitly opens/navigates or changes other reference context.
