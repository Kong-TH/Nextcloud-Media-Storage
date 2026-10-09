# Design and specifications

## Usage and labels

Switches suit independent settings that can be turned on and off. Separate switches can be enabled together; radio-style exclusion is inappropriate for this meaning. Do not use switches for selecting file rows, one-of-many alternatives, commands such as Delete, or partial selection of a collection.

Name the setting rather than a momentary command: Notifications is stable, whereas alternating Enable notifications and Disable notifications changes the control's identity. Supporting text can explain scope or consequences. Prefer making visible text precise; if an accessible name expands an ambiguous label, retain its visible words and clarify the setting's purpose.

Place labels and supporting text in a readable setting row with the control clearly associated. Support wrapped/localized text and logical start/end alignment. If the whole row activates the switch, ensure a single activation path; a label click must not also trigger an extra row toggle. Do not place unrelated interactive links inside its activation label.

The supplied Overview recommends switches for independent items and settings. It does not provide a complete placement or persistence rule set. Do not claim a mandatory row spacing, maximum option count or Save behavior from the absent Guidelines capture.

## Anatomy and configurations

The component has a track, handle (formerly thumb) and optional icon. Supported design configurations are no icons, icon only when selected, or icons in both selected/unselected states. Optional check/cross icons reinforce state without becoming independent controls. They do not imply validation success/error and should not be announced redundantly.

The selected/unselected state should be apparent through position and visual shape, not color alone. Keep focus feedback distinct from selection. Do not add an indeterminate/mixed position; use another control if the data has that meaning.

## Measurements

| Element | Attribute | Supplied Specs value |
| --- | --- | --- |
| Track | Width by height | 52 by 32dp |
| Track | Outline width | 2dp |
| Track/handle/state layer | Shape | Full corner |
| Unselected handle without icon | Width/height | 16dp |
| Handle with icon | Width/height | 24dp |
| Selected handle | Width/height | 24dp |
| Pressed handle | Width/height | 28dp |
| State layer | Size | 40dp |
| Target | Size | 48dp |
| Selected/unselected icon | Size | 16dp |

The inspected diagrams confirm 52 by 32 tracks, 16/24 handles without icons and 24 handles with 16 icons. Pressed 28 and other values come from the text table. Do not scale the entire component to make the off handle as large as the on handle. A target is not the visible track; preserve usable activation space even where the track is wider than 48dp.

Map dp to CSS deliberately; the Accessibility capture explicitly recommends at least 48 by 48 CSS pixels for targets. Do not apply density by default. If users opt into a denser setting, keep the means of reverting it at least 48 by 48 CSS pixels. Test actual target overlap, not only declared component dimensions.

## Colors and interaction states

Captured switch roles include surface container highest, outline, primary, on primary and on primary container. Adjacent labels use on surface and supporting text may use on surface variant. Label color does not change merely because the switch is selected or interacted with. Preserve light/dark mappings rather than copying screenshot hex values.

Cover enabled, hovered, focused, pressed and disabled for both on/off. The capture describes growing touch handle feedback when tapped/dragged, and hover-area/handle feedback with a cursor. Hover visuals are not a substitute for focus or tap feedback. The table identifies a 28dp pressed handle; it does not specify a universal hovered size or every state opacity.

Provide a visible focus indicator. Reduced motion must retain comprehensible state changes. The supplied token module has no populated values; do not invent exact typography, elevation, transition duration/easing, disabled opacity or custom icon APIs.

## Behavior decisions

For ordinary settings, define immediate application and visible pending/error feedback. For an explicit Save task, identify draft state and preserve Cancel semantics. Keep the value unknown while fetching; do not present false as if confirmed. On failure, explain whether the value was restored or remains an unsaved draft.

A request can complete in a different order from user input. Serialize writes or reconcile them so rapid on/off changes do not restore stale intent. Disabling while saving is one possible policy, but preserve intelligible focus and recovery. Loading is status separate from the binary value.

Unavailable controls must not activate through any input method. Explain why where useful; server enforcement remains required. A state-changing setting should not secretly navigate away or trigger an irreversible command. Consequential tasks may require a more explicit action/confirmation flow.
