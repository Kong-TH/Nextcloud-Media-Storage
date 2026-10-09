# Semantic web implementation

## Non-actionable container with actions

```html
<article class="ms-card ms-card--filled">
  <h3><a href="/verified-detail-route">Project artwork</a></h3>
  <p>Image collection for this project.</p>
  <button type="button" aria-label="More actions for Project artwork">More actions</button>
</article>
```

This is a structure example: replace the illustrative href with the actual router destination and wire the action before presenting it as functional. Native controls can be replaced by verified Material Web controls. The article is not focusable and has no click handler. Use article only for a meaningful self-contained item; a div or list item may be more appropriate for simple tiles. A card does not automatically need role=region or its own landmark.

## Single actionable surface

For navigation, use a real link styled as the surface, with no nested links/buttons. For a command, use a native button with suitable phrasing content; do not insert invalid block content into it. A link activates with Enter and follows normal link conventions; a command button supports Enter and Space. Prefer these native semantics over a div with role and reimplemented keyboard behavior.

Do not duplicate the primary action as both a focusable wrapper and a title link. Avoid making selectable cards into button-with-checkbox nests. If secondary controls are needed, choose a non-actionable container instead.

## Styling

Scope CSS under the plugin root. Define shape and spacing tokens from the chosen design target. Filled background maps to --md-sys-color-surface-container-highest, elevated to --md-sys-color-surface-container-low, outlined to --md-sys-color-surface with --md-sys-color-outline-variant. Use appropriate text roles and a separately verified elevation token if needed. Do not fabricate a shadow token value as an exact Material spec.

Use responsive grid/list CSS with min-width safeguards and readable text. Hover, focus, pressed, dragged, and disabled feedback should match implemented interactions. An inert container should not suggest clickability through a pointer cursor or fake ripple. Do not make a static container disabled simply to gray out its contents; disable only the unavailable controls and explain availability when necessary.

## Accessibility checks

- Tab visits interactive surfaces/controls in meaningful order; inert cards are skipped. Screen-reader reading navigation can still read headings and body text without adding tabindex to each text node.
- Preserve visible keyboard focus, including around clipped/rounded media containers. No mouse-only click handlers.
- Name controls from the visible subject/action. A bare More actions repeated across tiles needs item context. Decorative images have empty alt; meaningful images have useful alternatives. Do not repeat a filename unnecessarily in every accessible name.
- Verify normal text contrast of at least 4.5:1, qualifying large text 3:1, and necessary non-text indicators 3:1. These are supplementary web accessibility checks; the supplied Card accessibility capture does not provide numeric thresholds.
- Make swipe/drag functionality available through a single-pointer alternative such as a menu, and through keyboard-operable controls. Keep focus stable after sorting or moving, and restore it sensibly after dismissal.
- Avoid hiding controls until hover without an equivalent keyboard/touch path.
- Verify zoom/text scaling, translated text, RTL alignment, image failure, loading and empty/error states. Preserve actions when switching between cards and lists.
- Test pointer and keyboard activation independently, including that secondary actions do not accidentally open the item or execute twice.

Document checks do not prove rendering, keyboard behavior, or screen-reader output. Do not claim live verification without exercising the actual component.
