# Sources and limitations

Studied local source folder: `/home/kong/Downloads/google-mat/tooltip`. All four captures contain distinct relevant content:

| Capture | Saved official source |
| --- | --- |
| Tooltips – Material Design 3.html | [Overview](https://m3.material.io/components/tooltips/overview) |
| Tooltips – Material Design 3-2.html | [Specs](https://m3.material.io/components/tooltips/specs) |
| Tooltips – Material Design 3-3.html | [Guidelines](https://m3.material.io/components/tooltips/guidelines) |
| Tooltips – Material Design 3-4.html | [Accessibility](https://m3.material.io/components/tooltips/accessibility) |

The two measurement images in the Specs assets, unnamed(2).png and unnamed(5).png, were visually inspected. Plain image marks horizontal 8dp padding and a 24dp single-line example while also showing a taller multiline case. Rich image adds 4dp and 12dp internal gaps beyond the prose table. Do not interpret the plain prose's unqualified padding as 8dp on every side or fix all tooltips at 24dp.

The overview marks Web unavailable. The [Material Web repository](https://github.com/material-components/material-web/tree/main) was checked as additional implementation context; no public tooltip component is established by this research. Verify installed exports before using any future support. No complete expanded token inventory or motion timing specification was captured.

Cross-checks on 2026-10-09: [APG tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) and [WCAG hover/focus understanding](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html).

Material Accessibility broadly assigns Tooltip role while allowing focusable rich content. APG separates nonfocusable tooltip semantics from nonmodal interactive popups; the web reference follows that separation. APG is explicitly unfinished. Material's 1.5-second exit delay must not become a reading timeout that undermines persistent hover/focus content. The Guidelines caption says only one tooltip at a time even though its surrounding Don't marker can appear ambiguous in extracted text; apply the explicit text rule.

Original Downloads assets are evidence, not runtime dependencies. The tracked references carry the reusable decisions; live UI and assistive technology behavior remain unverified.
