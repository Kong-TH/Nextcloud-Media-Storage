# Design and specifications

These rules summarize the supplied Material Overview, Specs, Guidelines and Accessibility captures. Measurements are design dp; use CSS logical dimensions and verify scaling in the actual host.

## Variant and content

Plain: container plus short supporting text, typically labels an icon-only action. Prefer a single concise phrase; multiple lines and several facts are cautions, not reasons to truncate essential text. A visibly labeled control usually does not need a duplicate plain tooltip.

Rich: container, supporting text, optional subhead and optional actions/links. Use for additional context or feature value. Keep the subhead brief, ideally one line, especially for automatically introduced features. Allow up to two brief relevant text buttons, preferably side by side. Avoid stacking if space permits; localization/zoom must remain readable rather than forcing overflow. Required warnings and destructive consequences belong in visible content or a confirmation dialog as appropriate.

## Geometry and color

| Attribute | Supplied value / interpretation |
| --- | --- |
| Plain single-line container | 24dp height in the example; allow growth for wrapping/zoom |
| Plain horizontal padding | 8dp each side; the prose only says padding, but the measurement image marks the sides |
| Plain colors | Inverse surface container, inverse on surface text |
| Rich outer padding | Top 12dp, bottom 8dp, inline 16dp |
| Rich internal gaps | Image marks 4dp between subhead/body and 12dp before the action region |
| Rich colors | Surface container background; on surface variant subhead/body; primary actions |

Rich corners are more rounded than M2. The collapsed token explorer does not expose a complete radius, elevation, typography or width token inventory. Do not infer exact values from screenshot pixels or transfer Android token names into a web API. Use verified design tokens and document custom choices. The plain 24dp container is not an interactive target size.

## Placement

Plain defaults above its parent: gap 4dp from a clear visual boundary, 8dp when there is no boundary (for example a text baseline). App-bar triggers place it below at the same gap. Rich defaults bottom-right and adjusts to stay on screen; desktop may center it below. The guidance describes adjustment in 8dp increments. Use logical alignment for RTL and collision handling when the default cannot fit. Neither variant should cover its parent.

Use the actual visible plugin pane, scrollport and viewport, including host navigation and zoom. Keep text readable at narrow widths; flip/shift and wrap where needed. Never force a rigid placement that clips the message or makes it unreachable.

## Triggers and lifecycle

Material describes desktop hover and mobile tap-and-hold, plus keyboard focus in Accessibility. Do not let touch discovery consume the primary action or require long press as the only way to get important help. Persistent rich hints are triggered by click/tap or intentional feature introduction on load, not hover. Avoid persistent rich hints on icon buttons.

Transient guidance specifies a 1.5-second delay after leaving the target region. Treat this as an exit grace period, not a lifetime from opening. Retain hoverable/focused content as described in the web reference. Opening another tooltip closes the previous one; cancel timers on re-entry and unmount. Persistent hints remain after leaving the target, closing when another UI element is interacted with; also provide keyboard dismissal. Do not turn an optional onboarding hint into a blocking tour.
