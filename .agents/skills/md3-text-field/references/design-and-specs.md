# Design and specifications

## Variant and anatomy

Filled fields have greater emphasis and often suit short forms/dialogs. Outlined fields reduce emphasis in longer forms. Both support the same functions; choose what fits the app's visual style, goals and distinction from nearby controls. Do not mix both in one form region. Separate regions, such as a page and its dialog, can differ consistently.

Filled fields have a filled container, bottom indicator, rounded top corners and square bottom corners. Outlined fields have a rounded enclosing outline. Both include label, input, caret, optional icons and supporting text. Keep the container clearly interactive and distinguish focused, populated, empty, disabled and error states.

## Labels and required values

Labels describe requested information, align with the input and remain visible. Empty labels can be centered before floating upward on focus/population. Do not truncate internal labels or wrap them over multiple lines; shorten wording or use a separate adjacent label aligned to the leading edge. Adjacent labeling replaces the internal label, not the need for an accessible name. Placeholder/example text is supplementary.

Required fields display an asterisk by the label. Explain it once at the form start or through supporting text, and mark every required field consistently. If required text has a special color, match the asterisk. Do not rely on color or a symbol alone to communicate required status programmatically.

## Input configurations

Single-line fields scroll text horizontally as the caret moves. Long responses need a textarea on web: choose a useful initial height, wrapping and scrolling/resizing that fit compact screens. The design describes expanding multiline fields but recommends textareas for web. Do not assume an auto-grow feature exists in the library.

Prefixes/suffixes provide units or context such as currency or a domain. Explain unfamiliar symbols accessibly. Define whether affixes are display-only or composed into submitted data; do not duplicate a unit the user already entered or silently append an unexpected domain.

Supporting text explains constraints or usage. Prefer a short line but allow wrapping; visibility can be persistent or on focus. Essential instructions must remain available when needed. Include a counter for a real character/word limit, with the measurement unit matching the contract.

Optional leading/trailing icons can describe input or perform a clear, picker, reveal-password or other implemented action. Clear appears only when text exists. Images can be 24dp high. Leading/trailing placement follows LTR/RTL. Do not imply voice input or a picker exists through an inert icon. Decorative icons and buttons have different accessibility behavior.

Read-only fields display prefilled noneditable values with ordinary field styling and a clear read-only indication; do not fade them as if unavailable.

## Error handling

Replace supporting text with error text to limit layout movement. Explain the correction for the actual failure; if several errors are possible prioritize a useful actionable one rather than a vague Invalid input. Errors remain below the field until resolved. Strongly prefer an error icon as another visual cue. Never convey invalidity only through color.

Long errors may wrap. Reserve sufficient spacing and allow content growth instead of clipping or overlapping the next field. Preserve critical formatting instructions when the visual helper is replaced, through the error wording or associated description. Error presentation must not wipe entered values.

The captured Accessibility page discusses both helper and error text together, while Guidelines recommends swapping them visually. Keep one visual supporting region by default; if both descriptions are needed, preserve their meaning and reading order without duplicating announcement.

## Measurements

| Attribute | Filled | Outlined |
| --- | --- | --- |
| Default container height | 56dp | 56dp |
| Target size | 56dp | 56dp |
| Horizontal padding without icons | 16dp | 16dp |
| Horizontal padding with icons | 12dp | 12dp |
| Icon-to-text gap | 16dp | 16dp |
| Icon alignment | Vertically centered | Vertically centered |
| Supporting/counter top gap | 4dp | 4dp |
| Supporting-to-counter separation | 16dp | 16dp |
| Empty label alignment | Vertically centered | Vertically centered |
| Top/bottom padding in table | 8dp | Not separately specified |
| Populated label horizontal inset | Not separately specified | 4dp |

The inspected full-size diagrams confirm filled 56dp height, 16dp horizontal padding and 8dp vertical padding, plus outlined 24dp icons and the 12/16/4 spacing shown above. Do not use a 24dp glyph as the entire button target. Map dp to CSS deliberately and allow longer helper/error content to expand below the nominal container height.

## Colors, adaptation and density

Filled roles include surface container highest, on surface input, on surface variant labels/icons/helpers and primary active treatment. Outlined uses outline, on surface/on surface variant and primary focus roles. Use precise installed tokens for each state rather than one color for all parts. Preserve light/dark schemes.

The Accessibility guidance requires at least 3:1 contrast for the container outline against its background. This is a non-text distinction, not permission to use 3:1 for all body text. Check focus, label, entered text and error visibility independently.

Fields can fill compact content panes; on larger screens bound their width with flexible containers/margins rather than stretching across the whole display. Use the plugin's available width. Keep labels visible and inputs readable under zoom/localization. Do not apply dense mode by default; if users opt in, keep the control to revert density at least 48 by 48 CSS pixels. Respect reduced motion without losing visible focus.
