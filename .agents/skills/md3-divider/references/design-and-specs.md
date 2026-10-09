# Design rationale and captured specs

## Purpose and variants

Use lines to group content rather than mechanically separating every individual item. Full-width dividers distinguish larger sections, unrelated content, or interactive versus non-interactive regions in a container. Inset dividers distinguish related/nested items within a section. Spacing alone is acceptable for repetitive, clearly structured rows.

Align insets deliberately with the surrounding icons, avatars, and text. Do not assume every list has the same leading-content geometry. Mixed full-width/inset treatments should reinforce parent/child structure, not decorate arbitrarily.

Vertical dividers can separate side-by-side content such as prose and media on larger screens. The design pattern does not establish web-component API support. When regions stack, remove or convert the divider if it no longer expresses the relationship clearly.

## Captured measurements

| Attribute in supplied Specs | Value |
|---|---|
| Full width | 100% of the relevant container |
| Leading inset, shown as left margin | 16dp |
| Opposite margin for that inset | 0dp |
| Middle inset | 16dp on both sides |
| Divider/supporting-text gap | 4dp |
| Additional shown right margin | 8dp |
| Additional shown bottom margin | 8dp |

The final three values are captured measurement labels without complete figure context. Do not add all margins globally or combine independent examples into one rule. Inspect the original figure when exact placement is needed. The prose describes equal inset as the default inset treatment, while the table includes a one-sided inset and a middle inset; these are configurations, not mutually exclusive instructions.

Use logical CSS properties to express the intended leading/trailing behavior. CSS pixels can represent logical design dimensions but are not universally physically equivalent to Android dp. The saved interactive token table is not populated with complete values. Numeric line thickness comes from implementation documentation, not from this extracted Specs table.

## Color and restraint

The supplied color role is outline-variant in light and dark schemes. Keep the line visible but quiet. Avoid arbitrary brand-color separators or thick borders that compete with content. Prefer a shared token rather than hardcoded colors per instance.

The supplied Accessibility page calls dividers decorative and gives them no contrast minimum. This exemption applies to decorative lines; it does not justify illegible text, invisible focus indicators, or inadequate contrast for an essential component boundary. If a line is the only way to understand a critical grouping, add semantic structure and other cues rather than treating everything as decoration.
