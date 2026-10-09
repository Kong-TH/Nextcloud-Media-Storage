---
name: md3-switch
description: Design, implement, or review Material Design 3 switches on the web with @material/web. Use for independent on/off settings, labeled setting rows, selected/disabled states, accessible keyboard behavior and async persistence. Mutually exclusive choices, multi-item selection, mixed-state controls and command actions need different patterns.
---

# Material Design 3 switches

Use a switch for an independent binary setting with an understandable on/off meaning. Use radios for mutually exclusive alternatives, checkboxes for item selection or mixed state, and a button for a command. A switch must not imply an implemented policy or feature when no backend exists.

## Workflow

Define what on/off means, the initial source of truth, persistence timing and failure behavior. Read [design-and-specs.md](references/design-and-specs.md) for measurements, states and design constraints. Read [web-and-accessibility.md](references/web-and-accessibility.md) for API, labels, keyboard, forms and verification. [sources.md](references/sources.md) records the duplicated Accessibility capture, missing Guidelines and incomplete token data. Original Downloads files are not needed to use this skill.

## Essential constraints

- Keep the setting name stable when its value changes. Communicate on/off through state, not by replacing the label with the opposite action.
- There are only two states. Loading, saving, unknown and mixed are not third switch positions.
- On/off must be clear at a glance through handle position and visual treatment, with programmatic state for assistive technology. Do not rely on color alone.
- Provide a descriptive adjacent label and sufficient target area. Decorative handle icons do not replace the label.
- Preserve the recommended 48px target area by default. The track and state layer are smaller visual elements, not the complete activation target.
- A switch is one focusable control; do not create separate tab stops for track, handle or decorative icon.
- Tap/click and keyboard must work; do not make dragging the only way to change state.
- Verify installed library APIs instead of copying radio checked state or assuming event behavior from prose.

## Project integration

Scope tokens/CSS to plugin content; preserve Nextcloud navigation and header. Inspect Vue custom-element property/event handling and bundle locally under CSP. Browser management uses existing session/CSRF-aware calls. Disabled appearance is not authorization; validate ownership and setting values on the server.

Treat immediate application as the usual setting expectation and make any explicit Save/Cancel draft boundary visible. Persistence guidance here is implementation advice, not a claim from the missing supplied Guidelines page. Do not announce saved success until confirmed, silently toggle an unknown setting off while loading, or let an older response overwrite newer intent.

Do not invent switches for pending hotlink policy, signed delivery, bucket behavior or upload configuration before the backend contract exists. Report actual browser/package versions, accessible behavior and failure-path checks. Skill validation is not browser verification.
