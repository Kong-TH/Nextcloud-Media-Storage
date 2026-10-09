---
name: md3-toolbar
description: Design, implement, or review Material Design 3 docked and floating toolbars on the web. Use for persistent contextual actions, selection/edit controls, responsive overflow and toolbar keyboard/focus management. Cover Expressive styles, orientation, FAB pairing and custom web composition; global navigation, app bars and simple form action pairs use separate patterns.
---

# Material Design 3 toolbars

Use a toolbar for frequently used actions related to the current page or context. Keep navigation and commands understandable as different purposes. A visual row of two form buttons does not automatically need a composite toolbar widget.

## Workflow

Identify context, essential actions, optional overflow, primary emphasis and available pane space. Choose docked/floating, standard/vibrant and orientation independently. Read [design-and-specs.md](references/design-and-specs.md) for measurements, restrictions and web exceptions. Read [web-and-accessibility.md](references/web-and-accessibility.md) for composition, focus, mixed controls and verification. [sources.md](references/sources.md) records evidence and source conflicts; original Downloads files are not required.

## Essential constraints

- The supplied overview marks Web unavailable. Do not invent md-toolbar APIs, imports, tokens or built-in collapse behavior. Compose supported controls in an app-owned container.
- Prefer docked/floating Expressive designs over the historical bottom app bar. Do not reuse the old app-bar height/shadow/FAB layout as toolbar specifications.
- Keep a floating container fully inside its pane. Show essential controls and move less important actions into trailing overflow as space narrows.
- Emphasize at most one action. Do not give a primary filled button and paired FAB competing emphasis.
- Avoid square filled icon buttons in a fully rounded floating toolbar; avoid wide icon buttons in a vertical toolbar.
- Use one toolbar in compact space. Vertical floating toolbars are generally unsuitable there unless the screen is simple and controls few.
- Preserve minimum useful targets and reachable controls during scroll/collapse. Do not collapse and animate offscreen simultaneously.
- Choose and implement real keyboard semantics; adding role=toolbar alone does not manage focus.

## Nextcloud boundary

Treat the plugin pane as the available design surface; preserve Nextcloud header and navigation. Material's bottom navigation conflict is not permission to remove the host shell. Avoid competing app-owned bottom bars and confusing duplicate local navigation. Keep bucket navigation in the approved drawer direction.

Scope styling/tokens and bundle locally under CSP. Use existing session/CSRF-aware calls and server owner authorization. Toolbar availability is not permission enforcement. Selection actions must identify their affected objects and match implemented consequences; Remove reference must preserve physical files. Do not advertise uploads, previews or delivery actions before their implementation exists.

Record actual keyboard, screen-reader, overflow, scrolling, RTL, zoom, themes and async/action checks. Skill validation does not verify browser rendering or frontend integration.
