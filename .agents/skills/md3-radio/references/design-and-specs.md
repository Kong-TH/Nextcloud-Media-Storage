# Design and specifications

## Choosing the control

Radio buttons expose a mutually exclusive set; use them where seeing the alternatives helps decision-making. Material recommends five or fewer choices. This is guidance rather than a data validation limit. Use a dropdown selection pattern when space is constrained or a larger set warrants it; it adds clicks and cognitive effort. Checkboxes support multiple independent selections; switches toggle an independent setting. A radio is not a command button.

Do not nest radios beneath radios. If a choice exposes extra configuration, present a clearly labeled dependent section instead of implying another level in the same radio group. Do not select two items in one group, even temporarily through competing application state.

## Labels and placement

Pair each icon with adjacent text describing exactly what is selected. Label the group by the question/category. Keep wording comparable and distinguish options without relying on icons or color. Arrange vertically and allow wrapping for localized labels; avoid horizontal lists and clipped text. Clicking or tapping either label or icon selects the same value exactly once. Avoid independent links/buttons inside the activation label.

## Initial state and clearing

The Guidelines page recommends one option always selected and preselected. Accessibility explicitly allows a group to start with none selected. Resolve by task: use a valid persisted value or meaningful safe default for settings; allow empty for a deliberate unanswered question where a default would falsely imply consent/intent. Do not fabricate an answer while saved data is loading. Handle obsolete/unavailable stored values explicitly.

Once selected, selecting the same item again does nothing. Allow opting out through a genuine None/Not applicable option, or an explicit separate Clear selection action if the workflow permits no value. Do not add clear behavior to ordinary radio clicks. A required question must still reject an empty result with an understandable group-level error.

Selection ordinarily takes effect immediately, except in a dialog/page with explicit Save. Explain the commit boundary through the task design; do not persist draft changes behind Cancel. Keyboard arrows also change ordinary radio selection, so do not attach irreversible effects to each selected state.

## Measurements and colors

| Attribute | Supplied Specs value |
| --- | --- |
| Icon size | 20dp |
| State layer diameter | 40dp |
| Target size | 48dp |
| Adjacent text | On surface |
| Radio color roles | Primary and on surface variant |

The measurement image visually confirms 20/40; the table supplies 48. These sizes serve different purposes: a larger target does not require a larger visible circle. Translate dp to CSS deliberately; Accessibility explicitly recommends targets of at least 48 by 48 CSS pixels. Preserve light/dark role mappings. Adjacent label color stays on surface when selected or interacted with; do not use label color as the sole selection indicator.

Cover enabled, hovered, focused, pressed/ripple and disabled states for selected and unselected radios. Keep focus visible separately from the filled selection dot. Use the installed component's state treatment instead of inventing opacity/elevation values from screenshots. Exact typography, stroke, animation and state opacity values are not available from the collapsed token panels.

Do not apply compact density by default: it reduces recommended targets. If users explicitly opt into denser layouts, keep the control to revert density at least 48 by 48 CSS pixels. Evaluate readability and pointer/touch usability; shrinking the icon alone is not a justified density implementation.

## Examples

- Sort order: visible mutually exclusive values with the current order selected; reversible immediate application may fit.
- Export format in a Save task: selection updates a draft; Cancel discards it.
- Optional question: explicit None may be clearer than an invisible clearing gesture.
- Independent media type filters: use checkboxes if several can apply together.

Reduced motion must retain understandable selection/focus feedback. RTL uses logical alignment and preserves reading order; longer labels should not shrink activation areas or overlap adjacent choices.
