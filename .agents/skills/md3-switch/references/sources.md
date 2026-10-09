# Sources and evidence limits

Studied 2026-10-09. Original English synthesis; complete page copies, website code, fonts and trackers are not redistributed. Downloads paths are provenance only, not runtime dependencies.

## Supplied captures

Directory: /home/kong/Downloads/google-mat/switch

| Local HTML | Saved source URL | Content |
| --- | --- | --- |
| Switch – Material Design 3.html | https://m3.material.io/components/switch/overview | Purpose, independent settings, availability, M2 comparison |
| Switch – Material Design 3-2.html | https://m3.material.io/components/switch/specs | Anatomy, color, states, measurements, icon configurations |
| Switch – Material Design 3-3.html | https://m3.material.io/components/switch/accessibility | Accessibility, not Guidelines; remote image references |
| Switch – Material Design 3-4.html | https://m3.material.io/components/switch/accessibility | Duplicate Accessibility body with local assets |

All four bodies were studied; only three distinct sections were supplied. The attempted official Guidelines URL returned only a JavaScript-required message through the browser tool. No Guidelines content was verified. Placement, persistence and async rules in this skill are clearly implementation recommendations rather than attributed quotations from that missing section.

Overview marks Web available; it does not establish Expressive switch support. The token panel is unpopulated, so complete state colors/opacities, typography and motion values cannot be reconstructed. Specs images unnamed(4).png and unnamed(6).png in Switch – Material Design 3-2_files were visually inspected for track/handle/icon measurements. Other image alt text was reviewed, but not all images/animation frames were visually inspected; remote Accessibility images were not downloaded.

## Primary web checks

- [Material Web switch guide](https://github.com/material-components/material-web/blob/main/docs/components/switch.md): public API, labels, form behavior and tokens. Upstream main is not a pinned installed release. Its label naming warning requires verification against the actual accessible tree. Event table flags and descriptions conflict on bubbling/composition; do not treat the table alone as event-routing evidence.
- [WAI-ARIA switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/): binary state, stable name, role and keyboard/group semantics. Enter is optional there, though Material describes both Space and Enter.
- [Material Guidelines URL](https://m3.material.io/components/switch/guidelines): attempted; content unavailable through the tool, not counted as reviewed guidance.

No dependency installation, frontend build, browser behavior, API persistence or screen-reader test was executed for this preparation. Recheck installed APIs before implementing.
