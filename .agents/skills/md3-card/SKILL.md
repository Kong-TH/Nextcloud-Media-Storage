---
name: md3-card
description: Design, implement, or review Material Design 3 cards on the web, including elevated, filled, and outlined variants, content hierarchy, media, collections, responsive layouts, and accessible interactions. Use for content cards, media tiles, and actionable card surfaces; do not turn dense tables or every content section into cards by default.
---

# Material Design 3 cards

A card groups content and actions about one subject. Make that subject and its primary information easy to scan. A container is the only required element; images, headings, supporting text, and actions are optional.

## Decide before styling

- Ask whether a card helps group a distinct subject. Spacing, headings, dividers, or a list may communicate the same information more simply.
- Choose filled for subtle tonal separation, elevated when shadow helps separation, or outlined for an explicit boundary. Variants do not imply different functionality or permission.
- Choose an interaction model: non-actionable container with individual controls, or one directly actionable surface without nested controls. Do not nest buttons or links inside a clickable card.
- Choose a collection layout based on content and available space. Cards need not replace a dense object-browser table; a thumbnail grid is a distinct possible view.

Read [design-and-specs.md](references/design-and-specs.md) for source measurements, variants, content, do/don't rules, and gestures. Read [web-and-accessibility.md](references/web-and-accessibility.md) when implementing. [sources.md](references/sources.md) records provenance and evidence limits.

## Web boundary

The supplied Overview marks Web unavailable. Build semantic HTML/CSS using Material roles unless the installed package demonstrably supplies a suitable component. Do not invent md-card, an import path, or an official card API. Existing @material/web buttons may serve as individual card actions; they do not make the card itself an official Material Web component.

For this Nextcloud app, scope card styles and tokens to the plugin. Preserve the outer Nextcloud UI and existing authenticated file/API behavior. Creating cards does not authorize file deletion, bucket changes, or new storage capabilities.

## Essential do/don't rules

- Keep related content on one subject, with a clear heading and readable hierarchy.
- Use theme roles; check real light/dark contrast and media overlays.
- Keep collection filters and sort controls outside the cards and apply them consistently to the collection.
- Keep resting elevation consistent across a collection.
- Do not force everything into cards, add decorative hover feedback to inert containers, or add nested interactive surfaces.
- Do not make swipe or drag the only way to perform an action. Provide an accessible explicit alternative.
- Do not use internal mobile card scrolling as the default way to reveal overflow. Expand or navigate to details.

## Verify the result

Test the selected interaction model, keyboard activation and focus visibility, reading order, narrow layouts, long/localized content, enlarged text, media failure, light/dark themes, and accessible names. Check gesture alternatives if gestures exist. If cards replace a list at a breakpoint, preserve actions and information. Report rendered checks separately from skill-document validation.
