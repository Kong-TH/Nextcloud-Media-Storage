---
name: md3-list
description: Design, implement, or review Material Design 3 lists on the web with @material/web. Use for scannable item rows, leading/trailing content, action and selection modes, responsive list-detail layouts, accessible keyboard behavior, and baseline versus Expressive styling. Dense sortable data tables and navigation drawer shells are separate patterns.
---

# Material Design 3 lists

Lists organize discrete items into a continuous vertical structure optimized for scanning. Keep primary text and supporting visuals consistently aligned. Container and label are required; supporting text, media, metadata, and controls are optional.

## Select the interaction model first

| Mode | Behavior | Boundary |
|---|---|---|
| Non-interactive | Read information | No fake clickability or selection |
| Single-action | One primary action across the item | No secondary nested actions or persistent selection toggle |
| Multi-action | Primary action plus independent secondary controls | The entire row is not itself selectable |
| Single-select | Choose one item | One selection interaction per row; no secondary actions |
| Multi-select | Choose multiple items | One selection interaction per row; no secondary actions |

A list has one interaction/selection mode at a time; it may deliberately switch modes. Distinguish current navigation destination, focused item, and selected item. Do not make a row both navigate and toggle selection through the same ambiguous activation.

Read [design-and-specs.md](references/design-and-specs.md) for anatomy, measurements, Expressive differences, and do/don't rules. Read [web-and-accessibility.md](references/web-and-accessibility.md) when implementing roles, selection, slots, or keyboard behavior. Source mapping is in [sources.md](references/sources.md).

## Essential rules

- Keep leading visuals, labels, supporting text, and trailing metadata in consistent positions. Give primary content the most space.
- Use meaningful leading icons, avatars for people/entities, and rectangular imagery for media/products. Avoid centering thumbnails in the middle of rows.
- Keep labels brief and supporting text scannable. Wrapping or truncation is permitted for list text, unlike ordinary button labels; provide an accessible way to obtain essential full content.
- Use gaps for contained/segmented groups; reserve dividers for uncontained or complex lists needing stronger separation.
- Show selection with more than color, and keep the visual state synchronized with accessible state and the selection control.
- Do not assume design-kit slots or Expressive shapes establish library APIs. Verify installed support before implementing.

## Workflow and project boundaries

Inspect the existing data, installed @material/web version, framework integration, and desired mode. Choose semantics and keyboard behavior before styling. Implement actual handlers and state, then test primary/secondary activation independently, selection synchronization, focus entry/exit, arrow behavior, narrow layouts, RTL, enlarged text, and both themes.

For Nextcloud Media Storage, use scoped styling within the plugin. Bucket destinations belong to the drawer navigation pattern; file listings may need a table when column comparison/sorting matters. Do not force a Material list to replace those patterns. Preserve session/CSRF handling, owner boundaries, and actual reference-removal semantics. This skill does not authorize bucket/storage changes.

Report observed browser checks separately from document validation, and identify untested keyboard or selection behavior.
