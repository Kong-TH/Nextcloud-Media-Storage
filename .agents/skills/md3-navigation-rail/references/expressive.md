# Navigation rail — M3 Expressive (May 2025)

What the official pages state about the collapsed and expanded rails, and — just as
importantly — **what they do not give you for the web**.

## Why this matters even if you are not "doing Expressive"

The Expressive update moved the navigation drawer out of the recommended set and
made the **expanded navigation rail** its replacement. So a request for a drawer, on
a project that tracks Expressive, is a request for an expanded rail. If you build a
drawer instead you are building the deprecated component.

See the `md3-navigation-drawer` skill for the drawer side of the same decision.

## Variants and naming

| Variant | Baseline M3 | M3 Expressive |
|---|---|---|
| Navigation rail (baseline) | Available | **Not recommended.** Use collapsed navigation rail. |
| Collapsed navigation rail | — | Available |
| Expanded navigation rail | — | Available |

Expressive added **two wider rails**. The collapsed and expanded rails "match
visually and can transition into each other", driven by the menu button, on any
device — including large or medium window sizes such as tablets.

## Configurations

| Category | Configuration | Baseline M3 | M3 Expressive |
|---|---|---|---|
| Expanded layout | Standard (default) | Available as navigation drawer | Available |
| Expanded layout | Modal | Available as navigation drawer | Available |
| Expanded behaviour | Hide when collapsed | — | Available |

- **Standard** — participates in layout; content sits beside it.
- **Modal** — floats over content. On Android this is the configuration predictive
  back applies to.
- **Hide when collapsed** — for immersive experiences the expanded rail can be
  hidden entirely, appearing only when the menu icon is selected.

A rail can be **expanded by default** on larger screens, or **expanded over
content** on smaller ones.

Use the expanded rail for:
- Information-dense layouts where space is limited
- Products with many navigation items

At medium width with more than five destinations, M3 suggests a **modal expanded
rail** rather than a crowded collapsed one.

## What changed from the baseline rail

- **Colour:** the active label on vertical items moved from `on-surface-variant` to
  **`secondary`**.
- **Naming:** the baseline rail is superseded by the collapsed rail.
- **Active indicator in the expanded rail** hugs the label text rather than just the
  icon. It can be overridden to fill the container, which reads more like the old
  navigation drawer — useful when migrating a drawer to an expanded rail without
  changing how it feels.

## What the docs do NOT give you for the web

Be careful here, because the gap is easy to paper over with plausible-looking
numbers.

- **Web status is `Unavailable` for both baseline and Expressive.** There is no
  reference web implementation to read metrics off.
- **`@material/web` 2.5.0 ships only the baseline rail token set**
  (`_md-comp-navigation-rail.scss`). There are no collapsed or expanded rail token
  files, so the expanded rail's width, padding, indicator size and label metrics are
  not available from the package.
- The captured docs pages present the Expressive measurements as **images**, so no
  numeric table could be extracted.

**Therefore:** the expanded rail's measurements are genuinely unknown from these
sources. Get them from the Figma Design Kit or the Jetpack Compose Expressive
implementation, both of which material.io lists as Available. Do not infer them
from the baseline rail or the navigation drawer — the drawer is 360dp and the
baseline rail is 80dp, and the expanded rail is neither.

What you *can* rely on for an expanded rail on the web today:
- The baseline rail's colour roles, with the active vertical label as `secondary`
- `corner-full` active indicator, hugging the label
- The standard/modal distinction, which is a layout decision you control
- The menu button as the collapse/expand affordance
