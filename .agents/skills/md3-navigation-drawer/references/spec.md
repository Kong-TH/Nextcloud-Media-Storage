# Navigation drawer — full M3 spec

Extracted from the official material.io navigation drawer pages (Overview, Specs,
Guidelines, Accessibility), captured 2026-09-29.

## Contents
- [Status and availability](#status-and-availability)
- [Usage](#usage)
- [Anatomy](#anatomy)
- [Measurements](#measurements)
- [Colour](#colour)
- [States](#states)
- [Responsive layout](#responsive-layout)
- [Behaviour](#behaviour)
- [Differences from M2](#differences-from-m2)

## Status and availability

| Type | Resource | Status |
|---|---|---|
| Design | Design Kit (Figma) | Available |
| Implementation | Flutter | Available |
| Implementation | Jetpack Compose | Available |
| Implementation | Android Views (MDC-Android) | Available |
| Implementation | **Web** | **Unavailable** |

**M3 Expressive update, May 2025:** the navigation drawer is **no longer
recommended**. Use an *expanded navigation rail* instead — expanded rails show text
labels and an extended FAB, and can be default or modal.

The "Web: Unavailable" line is why `md-navigation-drawer` lives in `@material/web`'s
`labs/` directory rather than its supported surface.

## Usage

Navigation drawers give access to destinations and app functionality such as
switching accounts. They are either permanently on-screen, or opened and closed by
a navigation menu icon.

Recommended for:
- Apps with **5 or more** top-level destinations
- Apps with **2 or more** levels of navigation hierarchy
- Quick navigation between unrelated destinations
- Replacing a navigation rail or navigation bar at wider breakpoints

**Avoid using a navigation drawer alongside another primary navigation component**
such as a navigation bar. Choose one component per breakpoint.

Order matters: put the most frequent destinations at the top, and group related
destinations together.

### Standard navigation drawer
Provides access to destinations *next to* app content, so it participates in the
layout. Can be permanently visible (best when people switch destinations often) or
opened and closed by a menu icon. Intended for expanded, large and extra-large
windows.

### Modal navigation drawer
Uses a scrim to block interaction with the rest of the app and **does not affect
the screen's layout**. Usable at any breakpoint but primarily compact and medium,
where space is limited or reserved for content. Can be swapped for a standard
drawer at expanded and up.

## Anatomy

A navigation drawer is essentially a **list** rendered on a **side sheet**.

1. Active indicator
2. Icon
3. Label
4. Badge label
5. Sheet
6. Divider
7. Section label (optional)
8. Scrim (modal only)

### Sheet
Holds all drawer elements. Drawers that open from the side are **always on the
start edge** — left for LTR, right for RTL.

### Divider (optional)
Use **full-width** dividers to separate *groups* of destinations. Do **not** use
dividers to separate individual destinations.

### Active indicator
A background shape communicating which destination is currently displayed.

### Label text and icons
Destinations are actionable list items: an optional icon plus **required** label
text.

- Label text must be clear and short enough not to be cut off.
- Truncate labels that exceed the container width.
- **Do not wrap** label text.
- **Do not shrink** the text size to fit a label on one line.
- Icons always come **before** text.
- Use recognisable icons where conventions exist.
- **Do not apply icons to some destinations and not others** — all, or none.
- Labels may be used without icons at all.

### Section label (optional)
Short subhead labels group related destinations.

### Scrim (modal only)
Placed directly behind the drawer's sheet; tapping or clicking it dismisses the
drawer.

## Measurements

### Standard navigation drawer
| Attribute | Value |
|---|---|
| Container height | 100% |
| Container width | 360dp |
| Container shape | 0, 16, 16, 0 dp corner radii |
| Icon size | 24dp |
| Active indicator height | 56dp |
| Active indicator shape | 28dp |
| Active indicator width | 336dp |
| Horizontal label alignment | Start-aligned |
| Left padding | 28dp |
| Right padding | 28dp |
| Active indicator padding | 12dp |
| Padding between elements | 0dp |

### Modal navigation drawer
Identical to the standard drawer except that the container shape is not specified
as the standard `0,16,16,0`:

| Attribute | Value |
|---|---|
| Container height | 100% |
| Container width | 360dp |
| Icon size | 24dp |
| Active indicator height | 56dp |
| Active indicator shape | 28dp |
| Active indicator width | 336dp |
| Horizontal label alignment | Start-aligned |
| Left padding | 28dp |
| Right padding | 28dp |
| Active indicator padding | 12dp |
| Padding between elements | 0dp |

336 = 360 − 28 − 28. Derive the indicator width from the sheet's padding rather
than hard-coding it.

## Colour

Values are implemented through design tokens; the drawer has **one token set**
("Navigation drawers (baseline)"). Roles used across light and dark schemes:

| Element | Colour role |
|---|---|
| Sheet container | Surface container low |
| Inactive icon, inactive label | On surface variant |
| Active icon, active label | On secondary container |
| Active indicator | Secondary container |
| Scrim | Scrim |

Divider colour roles come from the divider component's own specs
(`outline-variant`).

Named parts in the token set: Container, Headline, Label text, Active indicator,
Badge label text, Scrim, Icon.

## States

Enabled, Hovered, Focused, Pressed (ripple).

- On hover the hover state layer appears.
- On press/click a ripple passes through the indicator.
- On selection the icon switches outlined → **filled**, and changes colour —
  darker in light theme, lighter in dark theme — to increase contrast.

## Responsive layout

A product's navigation component should change to suit the breakpoint. Use a
transition when swapping components, for example rotating portrait → landscape.

| Breakpoint | Width | Navigation |
|---|---|---|
| Compact | < 600dp | Navigation bar, or modal drawer |
| Medium | 600–839dp | Navigation rail; modal drawer alone or with a rail |
| Expanded | 840–1199dp | Navigation rail, or standard drawer |
| Large | 1200–1599dp | Standard drawer |
| Extra-large | ≥ 1600dp | Standard drawer |

- **Compact:** use a modal drawer. On web, below **320 CSS pixels** a drawer no
  longer fits usably.
- **Medium & expanded:** a modal drawer alone or with a rail; a standard drawer
  works in single-pane layouts. On tablets prefer a rail, or let a drawer open and
  close from a menu icon.
- **Large & extra-large:** for laptop and desktop web, a standard drawer.

Standard drawers change size to suit the screen.

## Behaviour

### Scrolling
Drawers scroll vertically **independently** of the rest of the screen. When the
drawer scrolls, **body content stays stationary**.

### Visibility
- **Dismissible standard drawer** — opened and closed by the navigation menu icon
  in the app bar, and stays open until that icon is tapped again.
- **Permanently visible standard drawer** — typical on desktop.

### Appearing
When a drawer animates on screen it uses an enter-and-exit transition.

## Differences from M2

- **Colour:** new colour mappings, compatible with dynamic colour.
- **Variants:** M3 distinguishes standard and modal explicitly.
- **Shape:** rounded corners on the drawer's ending edge.
- **Active destination:** M2 used a rectangular shape; M3 uses a rounded active
  indicator with new colour mappings.
