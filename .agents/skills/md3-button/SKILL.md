---
name: md3-button
description: Design, implement, or review Material Design 3 labeled buttons on the web with @material/web. Choose filled, tonal, outlined, text, or elevated styles; cover action hierarchy, labels, states, responsive sizing, accessibility, and Expressive limitations. Use for action buttons, button rows, form actions, and button styling; standalone icon buttons, FABs, and navigation destinations need their own component guidance.
---

# Material Design 3 buttons

Create buttons that make the next action clear through label, placement, and visual emphasis. Use the user's saved Material guidance, summarized in the references, and verify the installed library before implementing APIs.

## Design first

Identify the action, its priority, context, and whether it performs a command, navigates, or toggles a persistent binary state. Choose a variant deliberately:

| Style | Use | Avoid |
|---|---|---|
| Filled | Primary or final action, such as Upload or Save | Multiple competing primary actions |
| Filled tonal | Secondary action needing more emphasis than an outline | Treating it as the default for every action |
| Outlined | Supporting action alongside a primary action | Busy images or visual confusion with filter chips |
| Text | Lowest-emphasis actions, often Cancel or dialog actions | Underlines or indistinguishable body text |
| Elevated | Separation from a prominent background when needed | Shadows merely to make every action prominent |

Prefer one prominent primary action in the relevant page or task area; this is a hierarchy guideline, not a hard count for independent sections. Use overflow menus for less important actions when the toolbar becomes crowded.

Read [design-guidance.md](references/design-guidance.md) for the rationale, do/don't rules, responsive layout, and Expressive distinctions. Read [web-implementation.md](references/web-implementation.md) when writing code or reviewing semantics, tokens, and accessibility. Provenance and missing measurements are recorded in [sources.md](references/sources.md).

## Essential rules

- Use brief action labels, ideally 1–3 words, in sentence case where applicable. Show the full label; grow or rearrange the layout rather than clipping it.
- Keep an optional meaningful icon on the logical leading edge, grouped with the label. Do not stack them vertically or use two competing icons in an ordinary labeled button.
- Preserve keyboard focus visibility, action semantics, and predictable DOM order across responsive layouts.
- Use theme roles and supported component tokens. Verify contrast in both themes; a token name alone does not prove accessibility.
- Distinguish ordinary commands from toggles. A toggle needs persistent state and accessible pressed semantics; a click animation alone is not a toggle.
- Do not infer web support from the latest Material design spec. Expressive sizes, shape morphing, and toggle variants require explicit verification or a documented custom implementation.

## Implementation workflow

Inspect existing UI conventions, @material/web version, and build configuration. Explain the selected variant briefly, import only the needed components, and use the framework's supported custom-element integration. Verify real click/submit/link behavior and keyboard operation, not only appearance.

For this Nextcloud project, scope theme tokens and CSS to the plugin root. Preserve Nextcloud's outer UI. Bundle assets locally, use the existing session/CSRF-aware request flow, and do not equate a disabled button with server authorization. Creating button UI does not authorize changes to storage behavior, bucket models, or backend permissions.

For asynchronous actions, communicate progress, prevent unintended duplicate submissions, and expose success or failure. Preserve a stable label footprint where practical. Do not leave a permanent disabled state after an error.

## Before reporting completion

Check the relevant enabled, disabled, hover, focus, pressed, and pending states; verify light/dark contrast, keyboard activation, narrow layouts, long or translated labels, 200% text scaling, and RTL when supported. Report any untested behaviors explicitly. Skill validation checks documentation structure; it does not validate a rendered component.
