# Sources and evidence limits

Studied 2026-10-09. Original English synthesis. Complete website pages, code, fonts and trackers are not redistributed. Local files are provenance, not runtime dependencies.

## Supplied captures

Directory: /home/kong/Downloads/google-mat/text-field

| Filename | Saved URL | Reviewed material |
| --- | --- | --- |
| Text fields – Material Design 3.html | https://m3.material.io/components/text-fields/overview | Purpose, variants, Web availability, M2 color changes |
| Text fields – Material Design 3-2.html | https://m3.material.io/components/text-fields/specs | Anatomy, color/states, measurements and configurations for both variants |
| Text fields – Material Design 3-3.html | https://m3.material.io/components/text-fields/guidelines | Variant selection, labels, affixes, input lengths, supporting/errors, icons, readonly, adaptation/density |
| Text fields – Material Design 3-4.html | https://m3.material.io/components/text-fields/accessibility | Contrast, keyboard, field/icon labels, affixes, errors, counters and required inputs |

All four contain distinct relevant bodies. Token panels are collapsed; no complete typography, stroke/state-opacity, radius or motion inventory is captured. Web availability does not establish Expressive implementation or target-browser compatibility.

Visually inspected Specs images: unnamed(6).png (filled without icons) and unnamed(16).png (outlined with icons). unnamed(5).png is only a 40 by 12 thumbnail and is not measurement evidence; full-sized unnamed(6).png supplies that diagram. Some filled-section icon diagrams have alt text saying outlined, so classify by rendered diagram/section rather than alt text alone. Other alt text was reviewed; not all images or animation frames were inspected.

Guidelines' visual helper/error swap and Accessibility's combined descriptions are distinguished in the references. The 3:1 requirement concerns outline/background, even though one image alt text says label text. Do not infer that it is a universal text contrast threshold. Generic Accessibility role/label prose is translated into appropriate web message semantics rather than putting alert on the field.

## Primary web cross-checks

- [Material Web text field guide](https://github.com/material-components/material-web/blob/main/docs/components/text-field.md): public components, supported types, labels, validation and tokens. Upstream main is not a pinned installed release. Verify the aria-labelledby limitation against installed behavior; placeholder-only examples do not supersede Material's persistent-label requirement.
- [WAI form notifications](https://www.w3.org/WAI/tutorials/forms/notifications/): error identification, associated descriptions, summary/recovery and live notifications.

## Project source evidence

Inspected lib/Service/NodeRules.php and lib/Service/ApiTokenService.php for current node/token name validation and byte limits. These are source findings rather than new HTTP tests. Reinspect contracts when implementing; bucket semantics remain pending.

No frontend dependency was installed and no build, browser, form or screen-reader integration was executed for this preparation.
