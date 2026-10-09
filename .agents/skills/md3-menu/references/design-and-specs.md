# Design and specifications

Synthesis of supplied Material captures; numeric baseline values come from the Specs table. Hidden token modules are not a full token export.

## Usage and anatomy

Menus open from buttons, icon/split buttons, fields, selected content or context gestures. Context actions apply to the invoked object; provide an accessible alternative to right-click/press-and-hold. A text-field popup may need selection/autocomplete semantics.

Items contain text and optional leading/trailing icons, shortcuts, badges or supporting text. Containers may include group labels and dividers. Slots can hold simple images, color swatches or progress indicators while retaining one action, consistent padding and targets at least 48 by 48dp. Do not insert independent buttons, switches or embedded forms. Shortcut hints must correspond to working handlers.

Use dividers on web. On platforms supporting Expressive gaps, keep gap size consistent, use only one or two, and never use them with scrolling. Do not treat Android support as web support.

## Variants and color

Baseline M3 remains available. Expressive vertical menus add rounded shapes, standard/vibrant styles, selection/active states and submenu morphing; the design recommends them for new products but marks Web Expressive unavailable. Styling a baseline component does not establish full Expressive support.

Standard Expressive uses surface container low, on surface/on surface variant, tertiary container selection and on tertiary container selected content. Vibrant uses tertiary container/on tertiary container and tertiary/on tertiary selection. Use vibrant sparingly. These are semantic design roles, not guaranteed CSS token names.

Baseline diagrams use surface container, on surface/on surface variant, surface container highest and outline variant. The captured 0.08 on-surface state-layer opacity is not a universal value for every state. Preserve light/dark role mappings instead of copying screenshot colors.

## Baseline measurements

| Attribute | Captured value |
| --- | --- |
| Container width | 112dp minimum, 280dp maximum |
| Corner radius | 4dp |
| Item height | 48dp |
| Horizontal padding, with or without icons | 12dp |
| Spacing within an item | 12dp |
| Leading/trailing icons | 24dp |
| Divider top/bottom padding | 8dp |
| Divider height | 1dp |
| Divider width | Dynamic |
| Label alignment | Vertically centered, horizontally start-aligned |

Use logical start/end spacing for RTL. Map design dp to CSS deliberately; do not confuse physical pixels with CSS pixels. Keep choices readable under localization/zoom rather than clipping essential text to force the nominal width. Overview prose describes baseline corners as square, but the precise table specifies 4dp; use the table.

The Expressive measurement image was visually inspected. It labels 48dp item height, 20dp leading/trailing icons and an 8dp icon-to-text gap. It shows several corner values (16, 12, 8, 4) for different positions/states. Do not collapse them into one radius or reuse baseline 24dp icons as an Expressive requirement. Verify remaining geometry for the chosen state before precise custom implementation.

## Placement, adaptation and scrolling

Keep the trigger relationship clear while allowing repositioning above or to either side near edges. Submenus open beside their parent without overlapping it. A large z-index does not escape overflow clipping.

Consider a bottom sheet or simpler flat action set in compact space. Use the plugin's available width. Supplied medium/expanded examples describe 600–839dp and 840–1199dp windows; these are context, not mandatory menu breakpoints. A bottom sheet requires its own accessible behavior.

Scrollable menus keep all choices reachable and indicate scrolling with a persistent scrollbar in the supplied design. Use dividers, never gaps. Web density levels 0 through -3 are described without exact spacing decrements; do not invent a density API or compromise touch usability.

## States, selection and motion

Cover enabled, disabled, hovered, focused, pressed, selected and Expressive active-parent states. Focus and selection are distinct. Use a non-color selection cue such as a checkmark. Supplied guidance calls for 3:1 contrast between selected/unselected appearances; this does not replace text/focus contrast evaluation.

Single selection clears the prior choice. Multiple selection retains other choices and keeps the menu open until dismissal; implement this explicitly rather than assuming component defaults. Keep cancellation separate from changes already applied.

Enter/exit motion relates the surface to its trigger; touch selection includes feedback. Expressive submenu focus can morph corners. Dense desktop menus may open instantly. Respect reduced motion while retaining visible state feedback. Exact durations/easings were not captured.

Examples: sort choices show one checked item; multiple filters remain open and preserve checked state; unavailable Redo stays disabled; Remove reference must retain the virtual-only consequence. Compact long labels should not become a clipped cascade.
