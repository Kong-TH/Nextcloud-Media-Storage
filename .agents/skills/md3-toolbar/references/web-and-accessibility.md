# Web and accessibility

## Compose with verified primitives

The supplied availability table marks Web unavailable. The inspected Material Web repository has controls such as buttons, fields, menus and FABs but does not establish a ready-made toolbar export. Use a semantic app-owned container, scoped CSS and supported installed components; no invented md-toolbar API. [Material Web repository](https://github.com/material-components/material-web)

Inspect Vue custom-element configuration, refs, events and property binding. A styled container does not automatically provide roving focus, overflow, FAB pairing or scroll behavior. Use existing button, menu and field guidance where those actual controls appear, without loading unrelated patterns.

## Composite toolbar model

For role=toolbar, provide a meaningful accessible name and aria-orientation=vertical when needed. Prefer one Tab entry/exit stop with arrow navigation among controls; initial focus goes to the first enabled control, optionally returning to the remembered control later. Horizontal uses Left/Right, vertical uses Up/Down. Home/End and wrapping are optional. APG recommends this grouping for three or more controls. Avoid controls that consume the navigation arrow pair; if unavoidable, place the conflicting control last and define keyboard behavior deliberately. Disabled controls are usually skipped, with discoverability exceptions. [WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)

Material's capture says Tab through actions and Tab or Arrows; this is not a complete composite implementation. For a simple action group with ordinary tab stops use an appropriate group/container instead of claiming full composite behavior. Do not attach role=toolbar and then leave focus handling accidental.

The container itself is not a button. Child controls keep their button, toggle, menu, input or selection semantics and accessible names. Icons need action names, toggle states need programmatic state, and decorative images/dividers do not become focus targets. Screen-reader naming should distinguish multiple toolbars by purpose.

## Mixed controls and focus lifecycle

Do not steal text-field editing arrows, selection shortcuts or IME keys for container navigation. Choose a simpler group or an intentional mixed-control policy if an editor/search field conflicts. Radio choices inside a toolbar use the toolbar-specific model: moving focus must not unintentionally select or execute a command. Inspect the chosen control's event handling instead of layering duplicate keyboard handlers.

A toolbar menu trigger retains menu-button semantics and restores focus after dismissal. A dialog action transfers focus deliberately and returns to a surviving control on close. Do not trap Tab within the toolbar. Define focus when the current object disappears or selection mode ends.

Overflow must retain access to the same action, name, permissions and state. When resizing moves a focused control into overflow, choose a stable focus destination and make the action reachable; do not leave focus on a hidden node. Avoid duplicate visible and hidden activatable copies. Reconcile focus when orientation changes and keep arrow policy aligned with the rendered orientation/RTL.

Scrolling/collapse must not hide focused controls, obscure content or interrupt ongoing text entry. For fixed/floating positioning reserve enough content space and test nested Nextcloud scrolling. Do not claim position:fixed is confined to a plugin pane. Avoid top-layer/portal theme loss if using an overflow menu outside its DOM subtree.

## Actions and asynchronous state

Commands apply to the intended object/selection. Revalidate their applicability after refresh; a stale selection must not silently retarget an action. Keep server authorization and CSRF checks. Removing a virtual reference is not physical deletion. An unavailable action must remain unavailable through keyboard and direct requests.

Prevent duplicate execution and show pending/error state without falsely claiming success. Preserve useful focus after a failed command. Confirmations describe implemented consequences; do not use a toggle to issue an irreversible command. A FAB next to a toolbar remains a separate interactive control even if styled as a coordinated group.

## Verification

Record browser/package versions and observed outcomes:

- Name/role/orientation, first entry, reentry, Tab exit, arrows, optional boundaries and disabled behavior.
- Control activation and toggle/selection states; normal editing and radio behavior in mixed toolbars.
- Overflow open/dismiss/activation, resize migration of focused controls and dialog focus return.
- Context changes, object removal, pending commands, request failures and duplicate-activation prevention.
- Docked/floating geometry, all pane edges, zoom, long labels, RTL, touch targets and multiple toolbar names.
- Scroll/collapse access, safe-area/virtual-keyboard behavior, both themes and reduced motion.
- Nextcloud header/navigation and surrounding styling remain intact; no unsupported action is advertised.

No build, rendering, keyboard or assistive-technology result is established by authoring this skill.
