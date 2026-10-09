---
name: md3-extended-fab
description: Design, implement, or review Material Design 3 extended floating action buttons on the web with @material/web. Use for a persistent labeled primary action, extended FAB placement, responsive collapse to an icon-only FAB, and FAB accessibility. Distinguish baseline web support from Expressive sizes; ordinary button rows and FAB menus are separate patterns.
---

# Material 3 extended FAB

An extended FAB keeps one primary action prominent and reachable, with a visible label that explains an otherwise ambiguous icon. Use the user's saved guidance summarized below; do not impose a floating action on every screen.

## Choose the pattern deliberately

Use an extended FAB when a long scrolling view needs persistent access to its main action, or when a label improves understanding of the primary action. Use a regular button for actions inside a card, a toolbar, a dialog action row, or a set of equally weighted choices. A screen should have one prominent FAB action, not several competing regular and extended FABs.

The container hugs its contents. A label is required in extended form; an icon is optional. Icon-only form is a regular FAB and needs an understandable icon and accessible name. Keep the action unchanged when switching forms.

Read [design-guidance.md](references/design-guidance.md) for placement, do/don't rules, responsive behavior, and accessibility. Read [web-implementation.md](references/web-implementation.md) when writing code. [sources.md](references/sources.md) records evidence and missing specs.

## Essential workflow

1. Identify the screen's primary action and explain why persistent floating access helps. If it does not, prefer an ordinary button.
2. Inspect the existing framework, @material/web version, app scroll container, host boundaries, and theme configuration.
3. Choose placement and a responsive strategy that leave content and other controls reachable. Consider translated labels and keyboard focus before adding collapse-on-scroll behavior.
4. Implement the verified web API, theme roles, one focusable control, and the actual handler. Treat custom Expressive styling or animation as custom work, not a library feature.
5. Verify activation, focus order, viewport changes, scrolling, light/dark contrast, enlarged text, and loading/error behavior. State what was not tested.

## Do

- Use a concise action label, preferably 1–2 words, with a clear relationship to its optional icon.
- Keep the full label readable; allow the container to accommodate localization.
- Keep the main action easily reachable without covering other actionable content.
- Use a single focusable element for the icon and label; keep its accessible name consistent with the visible wording.
- Place the primary action early in a sensible DOM/focus order. Do not simulate priority using positive tabindex or automatic focus stealing.
- Preserve the action and accessible name when adapting between extended and icon-only forms.

## Don't

- Do not use an extended FAB as one choice in a row of actions, inside a card, or over a toolbar.
- Do not show multiple competing FABs or pair an extended FAB with a floating toolbar.
- Do not truncate or casually wrap the label to force a fixed width. Reconsider placement or wording first; enlarged-text accessibility takes priority over rigid geometry.
- Do not float the action across Nextcloud's header, navigation, or unrelated application areas.
- Do not assume the latest Expressive design sizes are supported by the installed library.

## Project boundary

For Media Storage, a persistent Upload action is a possible use case, not a requirement to add it before upload behavior exists. Keep the FAB and its theme within the plugin area. Account for the plugin's scroll viewport, drawers, dialogs, notifications, and narrow layouts. Use existing authenticated and CSRF-aware request handling; UI affordances do not grant backend permission or authorize storage changes.
