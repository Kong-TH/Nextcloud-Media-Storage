# Sources and evidence limits

Studied 2026-10-09. Original English synthesis; complete page copies, website code, fonts and trackers are not redistributed. Local Downloads paths identify provenance only.

## Supplied captures

Directory: /home/kong/Downloads/google-mat/toolbar

| File | Saved source | Content reviewed |
| --- | --- | --- |
| Toolbars.html | https://m3.material.io/components/toolbars/overview | Expressive variants, platform availability, historical bottom app bar comparison |
| Toolbars-2.html | https://m3.material.io/components/toolbars/specs | Configuration, slots, color, measurements and baseline comparison |
| Toolbars-3.html | https://m3.material.io/components/toolbars/guidelines | Usage, do/don't, placement, FAB pairing, adaptation, RTL, scroll/collapse |
| Toolbars-4.html | https://m3.material.io/components/toolbars/accessibility | Assistive access, control feedback, keyboard and web role |

All four contain distinct relevant material. Web is marked unavailable. Baseline bottom app bar remains supported but is no longer recommended; do not confuse its legacy measurements or no-shadow treatment with floating toolbar defaults.

Token panels are collapsed. Exact shape/elevation, typography, state opacity and timing/easing are not fully captured. Visually inspected Toolbars-2_files/unnamed(14).png (floating internal/FAB measurements) and unnamed(15).png (outer/system navigation margins). Other image alt text was reviewed; not all images or motion frames were visually inspected.

The source's bottom-only/straight-corner docked rule has an explicit web/large-screen exception allowing other page placement/rounding. Guidance preserves both. Material's Tab/arrow prose is incomplete compared with the web composite model. The scroll prohibition is interpreted using its caption: do not both collapse and transition off-page, rather than banning collapse in response to scrolling altogether.

## Primary web checks

- [WAI-ARIA toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/): names, orientation, focus, control-count guidance and conflicting-arrow caution.
- [Material Web repository](https://github.com/material-components/material-web): primitive inventory; no toolbar implementation established. Upstream main is not a pinned installed package.

No dependency installation, frontend build, browser rendering, keyboard or screen-reader integration test was executed. Jetpack Compose behavior is platform evidence, not proof of a corresponding web API.
