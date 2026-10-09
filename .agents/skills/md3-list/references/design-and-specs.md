# Design guidance and captured specs

## Anatomy and scanning

Only container and primary label are required. Optional overline, supporting text, trailing text, icons, avatar, media, and selection controls must reinforce the subject. Keep their placement consistent across rows. The tallest content determines useful row height; do not clip large text to preserve a fixed mockup height.

Keep supporting text roughly one to three lines, adapting to viewport and content. The guideline permits label/supporting-text wrapping or truncation. Preserve distinguishing filename information and access to full content; a mouse-only tooltip is not enough. Trailing text is supplementary metadata such as size, count, or date.

Use circular/expressive avatars for people or entities and rectangular media for products/images/video. Place visuals on the leading side. Any content-derived color scheme must remain readable and use coherent roles.

## Modes and controls

Single-action items perform one command or navigation; they have no secondary actions or persistent selected toggle. Multi-action rows have a large primary area and smaller trailing controls; only individual actions are actionable/selectable, not the whole row as a selection surface.

Selection modes allow one selection interaction per row and no secondary nested actions. Radios express single selection in the visual design; checkboxes express independent multi-selection; switches express immediate on/off settings, not an interchangeable bulk file-selection control. The saved web accessibility pattern uses listbox/option semantics for selection, while other platforms apply radio/checkbox roles. Choose one coherent web pattern rather than combining all of these roles indiscriminately.

A row's selection treatment and its control must agree. Do not distinguish selected items with color alone: use checked controls, checkmarks, shape, or another clear cue. Focus is not selection, and listbox selection is not navigation aria-current.

## Slots and Expressive limits

The saved spec describes leading/content/trailing design slots; content is the widest section. Slots require custom implementation and do not automatically provide accessibility. Preserve standard padding and at least 48×48dp target intent for controls without overlapping hit regions.

Baseline lists are square, standard rows. Expressive introduces segmented grouping, rounded shape treatments, and stronger selection styling. The capture states web Expressive lists are built on baseline lists, but this is not proof that @material/web exposes a ready-made Expressive variant. Verify package APIs or clearly describe custom CSS/behavior.

Captured Expressive corners: unselected inner 4dp and outer 16dp; selected 16dp all around. Determine outer corners from actual group boundaries, including filtering/reordering. Do not apply every outer corner to every unselected segment. The source describes a selected primary-container/on-primary-container treatment; exact per-element tokens still require verification.

Swipe-to-reveal is explicitly marked Android Views only in the supplied configuration table. Do not claim built-in web swipe support. Any requested custom swipe behavior needs accessible alternatives and separate testing.

## Baseline measurement evidence

The captured table lists centered vertical label/leading/trailing alignment, top alignment at row heights of 88dp or more, 16dp leading/label padding, 16dp trailing inner padding, 24dp trailing end padding, leading icon top padding 8dp or 12dp for tall rows, 48dp targets, and zero padding around dividers. Its divider example uses 100% width, 16dp leading and 24dp trailing inset.

Interpret icon-specific and general alignment rows in their figure context; do not flatten them into contradictory universal rules. One-/two-/three-line diagrams and interactive token tables do not expose all numeric heights or typography in extracted text. Do not invent missing values. Use named logical CSS tokens without claiming universal physical equivalence to Android dp.

## Adaptive layout and behavior

Adjust margins and readable line length rather than stretching text-heavy rows across desktop widths. The guideline suggests about 40–60 characters for typical text, with larger-screen exceptions; treat these as reading heuristics, not filename truncation limits or language-independent character laws.

Compact layouts may show a list then a detail page; medium/expanded layouts can show list and details side by side. Lists may adapt to cards or other presentations when appropriate, preserving actions and meaningful order. Use the plugin's available container width, not only the browser window width.

Expansion reveals related nested content; expose expanded state and the controlled region when implementing an expandable row. Do not claim tree semantics or keyboard support merely because items are visually nested. Gestures and container transforms are optional; provide explicit alternatives and respect reduced motion. Keep focus and state stable during filtering, sorting, or responsive view changes.
