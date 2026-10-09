# Web implementation

Official reference: https://material-web.dev/components/divider/ (checked 2026-10-09). Verify the installed version.

```js
import '@material/web/divider/divider.js';
```

```html
<md-divider></md-divider>
<md-divider inset></md-divider>
<md-divider inset-start></md-divider>
<md-divider inset-end></md-divider>
```

These are alternative examples, not instructions to display all four. The API provides inset, inset-start, and inset-end. Equal inset is the inset default. Documented tokens are --md-divider-color, defaulting to --md-sys-color-outline-variant, and --md-divider-thickness, defaulting to 1px. Decorative dividers are not announced by default; add role="separator" when a break should be announced. Scope overrides to the plugin.

## Vertical implementation and semantics

The checked API does not document vertical. Inspect package source before relying on additional features; otherwise use custom CSS, not an invented attribute. For example, a decorative line between side-by-side regions can use an aria-hidden element with an inline-start border and stretch within the parent layout. Use a verified thickness/color token and give the layout a real block size; avoid rotating a horizontal line into an overflowing box.

If the vertical break is meaningful, use role="separator" and aria-orientation="vertical" on the non-focusable element instead of hiding it. Horizontal separator orientation is the default. Do not combine aria-hidden with an intended announcement. A resize handle needs keyboard operation, focus, sizing state, and its own design guidance; it is not a static divider.

## Semantic placement

Decorative lines need no accessible name, Tab stop, hover feedback, or click handler. A meaningful thematic break may use a semantic hr where suitable, with corresponding styling. Avoid adding separator announcements after every list item.

Preserve HTML structure: ul/ol contain list items, not arbitrary divider siblings. Use a border/pseudo-element on an appropriate item or another valid structure when separating groups. Do not copy invalid list markup just because a component example is visually convincing. Keep section headings and reading order meaningful without relying solely on the line.

## Verification

Check the rendered line and content alignment in light/dark themes, narrow/wide layouts, RTL, and enlarged text. Inspect equal versus leading/trailing inset behavior rather than assuming physical left/right spacing. Check that a vertical divider adapts when columns stack and does not collapse or force overflow. Inspect the accessibility tree and Tab order: decorative lines are absent, meaningful breaks have the intended orientation, and no static divider becomes a keyboard stop. Do not claim these browser checks from documentation validation alone.
