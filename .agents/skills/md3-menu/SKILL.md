---
name: md3-menu
description: Design, implement, or review Material Design 3 web menus with @material/web. Use for temporary overflow/context actions, anchored dropdowns, submenus, and single or multiple selection menus; cover placement, keyboard/focus, accessibility, and baseline versus Expressive support. Persistent navigation drawers and full form tasks are separate patterns.
---

# Material Design 3 menus

Use menus for temporary contextual actions and choices; keep frequent actions visible in a toolbar. Persistent bucket navigation belongs in the drawer. Field selection popups need appropriate listbox/combobox semantics rather than assuming every dropdown is an action menu.

## Workflow

Identify the trigger, affected object, actions, selection mode and dismissal behavior. Inspect the installed component version before choosing APIs. Read [design-and-specs.md](references/design-and-specs.md) for composition, values, states and prohibitions; read [web-and-accessibility.md](references/web-and-accessibility.md) for implementation and verification. [sources.md](references/sources.md) records provenance and evidence limits. Original Downloads files are not required to use this skill.

## Essential constraints

- Separate baseline M3 from Expressive vertical menus. Supplied guidance marks Web Expressive unavailable. Choose a verified baseline implementation or explicitly scope custom styling and behavior.
- Use dividers for web grouping. Expressive gaps are unavailable on web in the supplied guidance and cannot be used in scrolling menus.
- Each item performs one action. Do not nest independent buttons, switches or other interactive controls inside an item.
- Retain familiar conditionally unavailable actions as disabled. Disabled items remain focusable but cannot execute. This does not require revealing unauthorized capabilities or sensitive information.
- Keep the trigger icon recognizable with an open/pressed state. Selecting an action does not replace its identity.
- Reposition clipped menus; put submenus beside their parent without covering it. Avoid cascades where space is insufficient.
- Expose visible and programmatic selection, keyboard access and sensible focus restoration. Dismissal never executes an action.

## Nextcloud boundary

Scope tokens/CSS to plugin content and preserve Nextcloud navigation and header. Do not add a document-wide modal scrim for an action menu. Verify clipping, scrolling, theme inheritance and top-layer interactions in the host; portaled content may leave the scoped theme subtree.

Use session/CSRF-aware management calls. Disabled UI is not authorization. Labels must match server consequences: Remove reference preserves physical files. Close the menu before opening a confirmation/task dialog and transfer focus deliberately. Handle async failures without claiming success.

Do not advertise upload, preview, signed/public URL or delivery actions until their implementations exist. Bucket semantics remain pending; this skill does not decide storage architecture.

## Completion evidence

Check pointer, touch, keyboard, screen reader, disabled items, selection, submenu exit, viewport edges, nested scroll, long labels, zoom, RTL, both themes and reduced motion. Record observed results and untested limits. Skill validation does not verify rendering or frontend integration.
