# Sources and limitations

Studied 2026-10-09. Original English synthesis; downloaded website code, fonts, trackers and full page copies are not redistributed. Local paths identify provenance and are not runtime requirements.

## Supplied captures

Directory: /home/kong/Downloads/google-mat/search

| File | Saved source URL | Reviewed content |
| --- | --- | --- |
| Search – Material Design 3.html | https://m3.material.io/components/search/overview | Purpose, platform availability, February 2025 update, M2 comparison |
| Search – Material Design 3-2.html | https://m3.material.io/components/search/specs | Styles/layouts, tokens, anatomy, color/states, measurement tables |
| Search – Material Design 3-3.html | https://m3.material.io/components/search/guidelines | Entry points, layout, suggestions/results, placement, behavior and adaptation |
| Search – Material Design 3-4.html | https://m3.material.io/components/search/accessibility | Assistive use, announcement, initial focus, keys and labels |

All four have distinct relevant bodies. Availability explicitly marks Web and Web Expressive unavailable. Search being available as an M3/M3 Expressive design variant is not evidence of a supported web component.

Most token panels are collapsed. One exposed surface-tint value is labeled Default, Android, Light and has a warning marker; it is not a full web token mapping. Do not invent radius, elevation, typography, duration/easing or all-state values. Specs distinguishes unfocused search-bar tokens from interactive search-view tokens.

Visually inspected Specs images: Search – Material Design 3-2_files/unnamed(13).png (bar icon/target dimensions) and unnamed(18).png (contained docked geometry). Other image alt text was reviewed; not every image/animation was visually inspected. Divided measurement images exist but were not measured. Captured table padding/margin wording and a repeated leading-spacing row are ambiguous; the design reference retains these limits. Scroll reappearance prose/caption disagree. Android predictive back is not a verified web capability.

## Primary online cross-checks

- [Material Web repository](https://github.com/material-components/material-web): available primitive directories; no ready-made search implementation established. Upstream main is not the installed project version.
- [WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/): popup roles, editable-input focus and keyboard model. This applies to actual autocomplete, not every result list.

## Local implementation evidence

Inspected lib/Service/VirtualFileSystemService.php, lib/Db/NodeStore.php and lib/Service/ScopedApiService.php for current search limits, parent scope, substring matching, ordering and restricted-token behavior. These are source findings; no HTTP test was run for this preparation. Reinspect the contract before wiring a UI because bucket/search behavior can evolve.

The captured Accessibility table describes Android/iOS field roles, not a complete web semantic model. Web input, combobox and ordinary result-list choices in this skill are implementation guidance, not claims copied from those platform tables. No dependency installation, frontend build, browser rendering or screen-reader result is claimed.
