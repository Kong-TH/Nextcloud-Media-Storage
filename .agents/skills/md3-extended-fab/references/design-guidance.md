# Extended FAB design and accessibility

## Rationale and hierarchy

An extended FAB emphasizes the most important or frequent action and can keep it available above a long scrolling surface. Its visible label improves understanding when an icon alone would be vague. The prominence has a cost: multiple FABs compete with content and each other. Additional actions belong elsewhere, with ordinary button styles reflecting their priority.

## Anatomy and labels

The rounded rectangular container grows with its label and optional icon. Use short action wording, ideally 1–2 words, while allowing extra width for translated labels. The icon, if present, should express the same purpose as the text. Extended form cannot be icon-only; transition to a regular FAB if removing the label. Avoid clipping or truncating labels, and do not treat localization as a reason to reduce type size until unreadable.

## Placement

- Compact and medium windows: use the lower region, centered or toward the trailing edge. Do not put an extended FAB in the upper half of a mobile screen.
- Expanded and larger windows: the saved guideline permits bottom-right placement in both LTR and RTL, or placement within a navigation rail. The accessibility page also recommends considering an upper-left primary action region on large web screens, such as an expanded rail, for efficient access. These are context-sensitive alternatives, not instructions to move every desktop FAB to the top.
- Mirror icon/label order in RTL. Compact trailing-edge placement mirrors; the saved large-window bottom-right exception does not. Decide intentionally rather than indiscriminately mirroring every coordinate.
- Keep it above ordinary content, but not over app bars, toolbars, actionable elements, or inside cards. Avoid pairing with a floating toolbar.
- Reserve enough scroll clearance for the last item and account for overlays, safe areas, and software keyboards. These are implementation considerations for making the non-obstruction rule work, not additional measurements supplied by the saved spec.

## Responsive behavior and motion

Extended and regular FABs may transform into each other as space changes. A collapsed rail may use icon-only form and an expanded rail labeled form; this does not require adding a rail to a drawer-based app. Optional scrolling behavior collapses on downward scrolling and expands on upward scrolling. Preserve function, identity, and focus through the transition.

The source describes entering/exiting, container transformations, icon movement, and label fades conceptually. It supplies no timing curves or durations. Do not invent exact Material animation tokens or claim the library implements these transitions automatically. Respect reduced motion and avoid oscillating expansion around a scroll threshold. Do not collapse a focused control in a way that destroys keyboard focus.

## Accessibility

- Tab reaches the command; Space and Enter activate it. Icon and label are one focus stop, not two.
- Extended form already has visible text and needs no redundant tooltip. Icon-only form still requires an accessible name; a visual tooltip does not replace it.
- Include the visible wording in any expanded accessible name, preferably at its start, e.g. Upload → Upload media to this bucket.
- Keep a meaningful DOM order across responsive layouts; visual position alone does not establish focus order. Prioritize access without positive tabindex or forced autofocus.
- Check focus visibility, light/dark contrast, touch access, enlarged text, and that floating content does not hide other controls. Contrast and target checks are web implementation checks; the supplied extended-FAB accessibility capture does not provide numeric contrast or hit-target values.
- For async actions, communicate pending, success, and failure, prevent unintended duplicate work, and restore operability after failures. Ensure any chosen component API actually supports the intended disabled behavior.

## Baseline versus Expressive

The saved overview describes Expressive extended FAB heights of small 56dp, medium 80dp, and large 96dp with updated typography. It marks baseline extended FAB and surface styling as no longer recommended for an Expressive target, while explicitly marking Web: Expressive unavailable. This is not a blanket prohibition on using the baseline web library.

These heights do not define complete web components: the supplied folder lacks the Specs page, exact padding, full typography, corner tokens, color tables, and animation values. Do not infer them from ordinary FAB sizes or set a library size attribute and claim Expressive parity. Logical CSS sizing can represent the design intent; do not claim universal physical equivalence between CSS px and Android dp.
