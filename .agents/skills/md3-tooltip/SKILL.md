---
name: md3-tooltip
description: Design, implement, or review Material Design 3 plain and rich tooltips on the web. Use for icon action labels, contextual explanations, anchored feature hints, hover/focus behavior and accessible dismissal. Distinguish noninteractive tooltips from interactive rich popovers; critical warnings, form errors and required tasks need visible content or dedicated patterns.
---

# Material Design 3 tooltips

Choose plain for a brief action label, rich for optional explanation or a feature hint. Do not hide information needed to complete a task, understand destructive consequences or recover from an error.

## Workflow

Identify the trigger, independent accessible name, optional message and whether the popup contains interactive content. Read [design-and-specs.md](references/design-and-specs.md) for variant, placement, timing and visual rules. Read [web-and-accessibility.md](references/web-and-accessibility.md) before implementing semantics or event handling. [sources.md](references/sources.md) records provenance and conflicts.

## Essential constraints

- The supplied overview marks Web unavailable. Do not invent md-tooltip components, imports, CSS token APIs or built-in positioning. Verify installed libraries or build app-owned composition.
- Give icon-only controls an accessible name independently of tooltip visibility. Avoid repeating visible labels in plain tooltips.
- Keep only one tooltip open and avoid covering its trigger. Constrain and reposition within the usable pane/viewport.
- Support keyboard focus as well as pointer hover; touch users need an accessible way to obtain supplementary information.
- Noninteractive tooltips keep focus on their trigger. Interactive rich content needs a suitable nonmodal popup pattern, not focusable children inside role=tooltip.
- Allow Escape dismissal and pointer travel into hover content. Keep it visible while its trigger/content remains hovered or relevant focus remains; do not use a fixed reading timeout.
- Persistent rich hints are explicit-click/tap or onboarding patterns. Avoid attaching them to icon buttons, and never make an optional hint a focus trap.

## Project boundary

Scope CSS, tokens, positioning and overlay ownership to the plugin; preserve the Nextcloud shell. Bundle assets under the host CSP. Avoid clipping by app scroll containers without placing unscoped overlays over global navigation. Reposition on scrolling/resizing and close stale popups when their objects disappear.

Explain implemented actions accurately: removing a virtual reference preserves the physical file. A tooltip is insufficient confirmation or disclosure for destructive actions. Do not expose tokens/secrets in hints, or imply uploads, previews and signed delivery exist before implementation.

Record actual keyboard, screen-reader, touch, hover travel, dismissal, RTL, zoom, clipping and theme checks. Skill validation does not establish browser behavior.
