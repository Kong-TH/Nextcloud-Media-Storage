---
name: md3-divider
description: Design, implement, or review Material Design 3 dividers on the web with @material/web. Use for full-width, inset, and custom vertical separators in lists, cards, drawers, and content sections; cover grouping hierarchy, RTL, tokens, and decorative versus meaningful separator semantics. Interactive resize handles are a different pattern.
---

# Material Design 3 dividers

A divider is a quiet line that reinforces content grouping. Start with whitespace and headings; add a divider only when those do not make the grouping clear. Keep it visible but not visually dominant.

## Choose by relationship

| Need | Choice |
|---|---|
| Separate major sections or different kinds of content | Full-width divider |
| Separate related or nested content within a section | Inset divider aligned with relevant content |
| Separate side-by-side regions on a large layout | Custom vertical divider after checking implementation support |
| Repetitive rows already distinguished by spacing | Often no divider |

Use full-width and inset variants together only when they communicate different levels of hierarchy. Do not draw a line between every item by habit. A divider is not a substitute for headings, semantic groups, or a selectable/interactive control.

Read [design-and-specs.md](references/design-and-specs.md) for the saved measurements, rationale, and do/don't rules. Read [web-and-accessibility.md](references/web-and-accessibility.md) for verified APIs, RTL, and semantics. Provenance is in [sources.md](references/sources.md).

## Do

- Align insets with the content hierarchy and anchoring elements such as icons or avatars.
- Use the outline-variant color role and project tokens, verifying appearance in both themes.
- Keep decorative lines out of the focus order and assistive-technology announcements.
- Use a meaningful separator role only when a structural break needs announcement.
- Adapt the divider when a side-by-side layout becomes stacked; hiding it may be better than retaining the wrong orientation.

## Don't

- Do not clutter a drawer, list, or card with unnecessary boundaries.
- Do not make subtle dividers bold primary-colored borders just to increase prominence.
- Do not infer a vertical attribute or unsupported import path from the design spec.
- Do not apply contrast requirements for interactive controls to purely decorative lines, or assume the decorative exemption also covers essential control boundaries.
- Do not make a static divider focusable or draggable; resizing requires a separate accessible interaction pattern.

## Implement and verify

Inspect existing layout, installed @material/web version, and the intended semantic role. Import only the needed divider component. Check that insets actually follow the target content and mirror appropriately in RTL; verify no overflow at narrow widths or enlarged text. Inspect the accessibility tree for decorative versus structural behavior. Report rendered checks separately from skill-document validation.

For this Nextcloud plugin, scope CSS/tokens to the app root and preserve the surrounding host styling. Dividers may separate bucket-list groups, toolbar/content regions, or details sections when their grouping warrants it; do not add one between every bucket automatically. This skill only changes presentation, not bucket/storage behavior.
