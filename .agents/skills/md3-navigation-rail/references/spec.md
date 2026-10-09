# Navigation rail — full spec

From the official material.io navigation rail pages (Overview, Specs, Guidelines),
captured 2026-09-29, plus the token values read out of
`@material/web/tokens/versions/v0_192/_md-comp-navigation-rail.scss`.

## Contents
- [Status and availability](#status-and-availability)
- [Baseline token set](#baseline-token-set)
- [Usage](#usage)
- [Anatomy](#anatomy)
- [Placement](#placement)
- [Adaptive design](#adaptive-design)
- [Behaviour](#behaviour)
- [Common layouts](#common-layouts)
- [Differences from M2](#differences-from-m2)

## Status and availability

| Type | Resource | Status |
|---|---|---|
| Design | Design Kit (Figma) | Available |
| Implementation | Flutter | Available |
| Implementation | Jetpack Compose | Available |
| Implementation | Jetpack Compose: Expressive | Available |
| Implementation | Android Views (MDC-Android) | Available |
| Implementation | Android Views (MDC-Android): Expressive | Available |
| Implementation | **Web** | **Unavailable** |
| Implementation | **Web: Expressive** | **Unavailable** |

`@material/web` 2.5.0 ships **no rail component** — not in the stable surface and
not in `labs/`. It does ship the baseline token set, which is where the values
below come from.

## Baseline token set

Read from `_md-comp-navigation-rail.scss`. This is the authoritative source for
the numbers; the docs pages present them as images.

### Container
| Token | Value |
|---|---|
| `container-width` | 80px |
| `container-color` | `md-sys-color.surface` |
| `container-elevation` | `md-sys-elevation.level0` |
| `container-shape` | `md-sys-shape.corner-none` |

### Active indicator
| Token | Value |
|---|---|
| `active-indicator-width` | 56px |
| `active-indicator-height` | 32px |
| `active-indicator-shape` | `md-sys-shape.corner-full` |
| `active-indicator-color` | `md-sys-color.secondary-container` |
| `no-label-active-indicator-height` | 56px |
| `no-label-active-indicator-shape` | `md-sys-shape.corner-full` |

With a label the indicator is a 56×32 pill behind the icon; with no label it is
56×56, i.e. a circle.

### Icon
| Token | Value |
|---|---|
| `icon-size` | 24px |
| `active-icon-color` | `md-sys-color.on-secondary-container` |
| `inactive-icon-color` | `md-sys-color.on-surface-variant` |
| `active-hover-icon-color` | `on-secondary-container` |
| `active-focus-icon-color` | `on-secondary-container` |
| `active-pressed-icon-color` | `on-secondary-container` |
| `inactive-hover-icon-color` | `on-surface` |
| `inactive-focus-icon-color` | `on-surface` |
| `inactive-pressed-icon-color` | `on-surface` |

Note the inactive icon moves from `on-surface-variant` to `on-surface` on
hover/focus/press — it darkens rather than changing hue.

### Label text
| Token | Value |
|---|---|
| `label-text-font` | `label-medium-font` |
| `label-text-size` | `label-medium-size` |
| `label-text-line-height` | `label-medium-line-height` |
| `label-text-tracking` | `label-medium-tracking` |
| `label-text-weight` | `label-medium-weight` |
| `active-label-text-color` | `md-sys-color.on-surface` |
| `active-label-text-weight` | `label-medium-weight-prominent` |
| `inactive-label-text-color` | `md-sys-color.on-surface-variant` |
| `inactive-hover-label-text-color` | `on-surface` |
| `inactive-focus-label-text-color` | `on-surface` |
| `inactive-pressed-label-text-color` | `on-surface` |
| `active-hover-label-text-color` | `on-surface` |

**The active icon and active label take different colour roles** —
`on-secondary-container` for the icon (it sits on the indicator) and `on-surface`
for the label (it sits on the plain container). The active label is also a
*prominent* weight.

### State layers
| Token | Value |
|---|---|
| `hover-state-layer-opacity` | `md-sys-state.hover-state-layer-opacity` |
| `focus-state-layer-opacity` | `md-sys-state.focus-state-layer-opacity` |
| `pressed-state-layer-opacity` | `md-sys-state.pressed-state-layer-opacity` |
| `active-*-state-layer-color` | `on-surface` |
| `inactive-*-state-layer-color` | `on-surface` |

## Usage

The rail can display navigation items, a menu, and a FAB. Use it in **medium,
expanded, large or extra-large** windows. It holds **3–7 destinations** plus an
optional FAB.

Always put the rail in the same place across every screen of an app.

**A navigation rail should be the only visible navigation element.** For compact
windows use a navigation bar instead.

### Colour roles named on the Specs page
- Surface container (optional)
- On secondary container
- Secondary container
- Secondary (vertical) / On secondary container (horizontal)
- On surface variant
- Error / On error (badges)

## Anatomy

1. Container
2. Menu (optional)
3. FAB or Extended FAB (optional)
4. Icon — active / inactive
5. Active indicator
6. Label text — active / inactive
7. Large badge + large badge label (optional)
8. Small badge (optional)

### Container
Placed on the **leading edge** — left for LTR, right for RTL.

**Always vertical.** "Don't use the navigation rail horizontally. Use a navigation
bar instead."

Items align as a group to the **top or centre**. On tablets use centre alignment to
make items easier to reach.

### Menu (optional)
The menu button transitions between collapsed and expanded rails.

### FAB (optional)
The rail's container is ideal for anchoring the FAB to the **top** of the screen,
putting the app's key action above the destinations. Elevation level 0.

> Avoid placing the FAB below navigation items.

The top of the rail can hold a logo instead, but avoid logos that could be mistaken
for a button or destination.

### Active indicator
Shows which page is displayed.

- Use it **only** for the current page.
- **Don't use it for more than one item at a time.**
- In the *expanded* rail the indicator hugs the label text. It can be overridden to
  fill the container, which more closely resembles the baseline navigation drawer.

### Icons
Must symbolise the content of the page they open. When a destination is selected
the icon **fills**, changes colour, and an active indicator appears behind it.

### Label text
A short, meaningful description — a second way to understand the icon.

- Avoid wrapping long labels when possible; if necessary break between words or
  hyphenate longer words.
- **Don't truncate or show an ellipsis.**
- **Don't reduce the type size** to fit more characters.

(This differs from the navigation drawer, where truncation is the prescribed
answer for overlong labels.)

### Badges
Icons can carry badges for dynamic information such as counts or status.

### Divider (optional)
A **vertical** divider can separate the rail from app content, positioned on the
rail edge adjacent to the content area.

## Placement

In adaptive layouts the rail goes **outside any panes** — it navigates the app, not
a pane. Do not confuse it with tabs, which organise content across screens and
views *within* the app.

Expanded rails can open from menu buttons on mobile.

## Adaptive design

### Resizing
Moving from a large to a small screen, a rail **transforms into a navigation bar**.

> Never use the navigation rail and navigation bar simultaneously.

- **Compact:** navigation bar.
- **Medium:** navigation rail. Don't use a navigation bar. If there are more than
  five destinations, consider a **modal expanded rail**.
- **Expanded to extra-large:** navigation rail or expanded rail.

### Presentation
When the rail transitions collapsed → expanded, page content should automatically
adjust to fit.

Use a **standard expanded rail** when there are secondary destinations or actions
with lower priority than the main items.

## Behaviour

### Scrolling
Destinations stay **visible and fixed** during vertical scrolling.

If the layout scrolls horizontally the rail may scroll off-screen or stay fixed. To
show that content is moving underneath, use a divider or raise the rail to
**elevation level 1**.

### Selection
The destination screen uses a **top-level transition** pattern. The icon becomes
filled and the active indicator **expands from the centre of the icon**.

### Back (Android only)
Predictive back applies to the **modal expanded** rail: the rail pops off the edge
of the window during the gesture and the previous screen is previewed. Not
applicable on the web.

## Common layouts

Documented arrangements:
- Three navigation items
- Three navigation items with a menu
- Three navigation items with a FAB
- Three navigation items with a menu and FAB
- With menu and FAB, without labels
- All destinations with text labels
- With menu, FAB, and label text for all destinations

## Differences from M2

- **Behaviour:** predictive back interaction.
- **Colour:** new colour mappings, dynamic colour compatible.
- **States:** the active destination is indicated with a **pill shape in a
  contrasting colour**. M2 used icon colour, weight and fill alone.
