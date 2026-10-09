---
name: md3-loading-indicator
description: Design, implement, or review Material Design 3 Expressive loading indicators for short indeterminate waits on the web. Cover timing, placement, contained versus default styling, async lifecycle, accessible status, and reduced motion. Distinguish custom morphing indicators from @material/web progress components; long or measurable processes need progress guidance.
---

# Material 3 loading indicator

Use this pattern for a short wait whose progress cannot be measured or does not need to be shown. The Expressive indicator loops through Material shapes to communicate activity; it is not a percentage meter or an ordinary circular progress ring.

## Choose the appropriate feedback

| Expected wait/process | Source recommendation |
|---|---|
| Under 200ms | Show the content directly; no indicator |
| 200ms–5s, indeterminate | Loading indicator |
| Over 5s | Progress indicator |
| Expected to become measurable | Start with indeterminate progress, then determinate progress |

These are expected-duration guidelines, not a guarantee that a request completes in five seconds. Do not insert an artificial wait to make an animation visible. The source explicitly advises against transforming a loading indicator into determinate progress; use the progress family from the outset when that transition is expected.

Read [design-and-specs.md](references/design-and-specs.md) for anatomy, color, dimensions, placement, and do/don't rationale. Read [web-and-accessibility.md](references/web-and-accessibility.md) when implementing animation and async state. Provenance and missing source content are in [sources.md](references/sources.md).

## Essential rules

- Center loading feedback within the area actually loading, not automatically the whole browser window.
- For additional items, place it in the empty area where new content will appear; do not obscure already available content.
- Use contained treatment over content; uncontained treatment can sit directly on a surface.
- Keep status tied to actual work, remove it on completion/failure/cancellation, and provide useful recovery for failures.
- Keep a textual accessible status and a reduced-motion alternative; do not announce each animation cycle.
- Do not invent md-loading-indicator or claim a progress ring is the Expressive morphing component. Inspect the installed library before choosing implementation.

## Workflow and scope

Identify expected duration, whether real progress exists, and the exact affected region. Choose custom Expressive implementation or an explicitly identified baseline progress fallback. Implement request ownership and cleanup before polishing motion. Check fast completion, normal loading, failure/retry, navigation away, repeated requests, and stale responses.

For Nextcloud Media Storage, scope visuals and tokens to the plugin. A loading state must not disable the whole Nextcloud UI or cover unrelated content. Loading a folder or page of items may suit short indeterminate feedback; a large media upload needs real progress when available. Preserve existing authenticated requests and permissions; loading UI does not authorize backend changes.

Before reporting completion, verify placement, no layout jump, both themes, narrow layouts, reduced motion, keyboard usability, and accessible status. State which rendered behaviors were tested; skill-document validation alone proves no runtime behavior.
