# Web and accessibility

## Library implementation

Verify the installed version. Upstream documents md-menu, md-menu-item and md-sub-menu; headline content uses the headline slot. Set anchor or anchorElement before opening; absolute placement needs a shared positioned parent. Submenus use item/menu slots with overflow configuration. Placement includes absolute, fixed, document and popover; fixed does not follow page scrolling, while popover uses the top layer with fixed fallback. The guide documents open, show(), close(), quick, focus restoration and close-menu. Tokens include --md-menu-container-color and --md-menu-container-shape. Library selected colors differ from Expressive mappings. These APIs do not establish Expressive support. [Material Web guide](https://github.com/material-components/material-web/blob/main/docs/components/menu.md)

Inspect Vue custom-element configuration, property binding and event handling. Use stable unique IDs/refs across rows. Bundle locally under CSP. Synchronize state after keyboard/outside dismissal or route changes. Avoid global :root styling. Verify clipping, overflow and nested scrolling instead of assuming a placement option solves every case.

Target context actions to the intended row/selection. Suppress the browser context menu only for that target; provide another accessible trigger. If the row refreshes or disappears, close/retarget safely. Prevent duplicate execution and report failed requests against the correct object.

## Semantics and keys

Name the opening button; set aria-haspopup="menu" and synchronized aria-expanded. aria-controls can identify its popup. Enter/Space opens with focus on the first item; optional arrows can open at first/last. [WAI-ARIA menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)

Action menus use menu/menuitem. Selection commands use menuitemradio/menuitemcheckbox with aria-checked. Up/Down traverses items. Escape closes and restores invoking focus. Tab/Shift+Tab exits and closes instead of traversing every item. Submenu arrows open/return to the parent. Home/End reaches boundaries when wrapping is absent. Disabled items are focusable but cannot activate; separators cannot focus. Name the menu and maintain correct accessible roles/states. [WAI-ARIA menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)

Material's captured Tab prose is ambiguous; follow the composite web model above. Check RTL submenu keys and localized typeahead. Accessible item labels match visible text; decorative icons must not repeat them. Checkmarks do not replace programmatic selection. Preserve visible focus distinct from checked state.

Selection fields/autocomplete require the appropriate listbox/combobox focus model. Do not assign role=menu based on appearance, or treat an abbreviated upstream autocomplete example as complete. Filter updates need useful announcements and focus preservation; empty results must not become a fake action.

Menus are not dialogs: do not trap Tab or blanket-disable the shell. Close before handing focus into a dialog. After outside interaction respect the new focus target. After deleting the invoking row choose a surviving nearby control. Cancellation must not run a command.

## Verification

Record browser and installed package version plus observed results:

- Click, touch, Enter/Space and supported context shortcuts expose equivalent actions.
- Arrow navigation, boundaries and typeahead work; disabled items never activate; dividers never focus.
- Escape, outside interaction and Tab/Shift+Tab close appropriately; focus survives selection, row removal and dialog handoff.
- Submenus work with keyboard/pointer, including RTL, without accidental parent execution.
- Screen readers and accessibility tree expose accurate labels, roles, expanded/checked/disabled states.
- Multiple selection stays open until dismissal; async failure has an honest recovery path.
- Viewport edges, zoom, long labels, scroll containers, disappearing anchors and dialog/top-layer behavior remain usable.
- Light/dark colors, focus/selection cues, reduced motion and touch targets work without styling Nextcloud controls.

Authoring/validating this skill does not execute a frontend build or browser integration test.
