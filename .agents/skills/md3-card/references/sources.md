# Source mapping

Read from /home/kong/Downloads/knowlages/card on 2026-10-09. This skill contains focused paraphrases and original implementation guidance, not copied site scripts or a dependency on the Downloads folder.

| Saved HTML | Source page | Coverage |
|---|---|---|
| Cards – Material Design 3.html | https://m3.material.io/components/cards/overview | Purpose, variants, availability; Web marked unavailable |
| Cards – Material Design 3-2.html | https://m3.material.io/components/cards/specs | Color roles, interaction-state categories, measurements |
| Cards – Material Design 3-3.html | https://m3.material.io/components/cards/guidelines | Usage, anatomy, media, actions, collections, adaptive design, gestures and scroll exceptions |
| Cards – Material Design 3-4.html | https://m3.material.io/components/cards/accessibility | Interaction models, gesture alternatives, focus, keyboard, labeling |

The captured interactive token tables do not contain complete numeric values. The measurements table includes the exact statement “Padding between cards: 8dp max”; do not reinterpret that as a universal minimum. Exact figure-specific layout should be checked against source figures when needed.

The captured Accessibility guidance is stricter about stacked actions than the general Guidelines discussion of action areas. The web implementation resolves this by separating a single actionable surface from an inert container holding independent controls. It distinguishes screen-reader reading order from keyboard Tab stops and preserves native link behavior.

Web implementation availability must be rechecked against the installed @material/web package before use. Do not assume an official md-card component or invent a package path. Semantic HTML/CSS card construction and supplementary web contrast checks are implementation guidance, not APIs supplied by the captured Material pages.
