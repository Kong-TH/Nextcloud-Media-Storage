---
name: md3-navigation-rail
description: >
  Build a Material Design 3 navigation rail on the web — the slim 80dp vertical
  strip of icon destinations on the leading edge, with an optional FAB and menu
  button, for medium windows and wider. Carries the exact official token values
  (80dp container, 56×32dp pill indicator, colour roles, label-medium type), the
  collapsed/expanded Expressive variants, the breakpoint rules for swapping
  between rail and navigation bar, and how to build it since @material/web ships
  no rail component. Use this whenever the user wants a vertical icon nav, side
  nav strip, icon sidebar, app rail, tablet or desktop navigation, or a
  navigation bar that should become something else on wider screens — in React,
  Next.js, Lit or plain HTML, even if they never say "Material" or "rail". Also
  use it when choosing between rail, navigation bar and drawer, or when M3
  Expressive's expanded rail is meant to replace a navigation drawer.
---

# MD3 navigation rail on the web

A navigation rail is a slim vertical strip on the window's **leading edge**
holding 3–7 destinations, optionally a FAB and a menu button. It is the
mid-to-large-window member of M3's navigation family.

Pick the right family member first — this is the most consequential decision and
the numbers come straight from M3:

| Window width | M3 name | Component |
|---|---|---|
| < 600dp | compact | **Navigation bar** (horizontal, bottom) |
| 600–839dp | medium | **Navigation rail** |
| 840–1199dp | expanded | Navigation rail, or expanded rail |
| 1200–1599dp | large | Rail or expanded rail |
| ≥ 1600dp | extra-large | Rail or expanded rail |

**Never show a rail and a navigation bar at the same time.** M3 says this
outright, twice. A rail *becomes* a bar as the window narrows; they are two
presentations of one thing, not two components.

If there are more than five destinations at medium width, reach for a **modal
expanded rail** rather than cramming the collapsed one.

## What @material/web gives you: nothing, for the rail

Verified against `@material/web` 2.5.0 — check the installed version before
trusting this.

There is **no `md-navigation-rail`**, not in the stable surface and not in
`labs/`. material.io lists the rail's web status as **Unavailable**, for both
baseline and Expressive. So the rail is hand-built. That is the normal path here,
not a workaround.

What *is* available, and what it is actually good for:

| Component | Where | Use it for |
|---|---|---|
| `md-navigation-bar`, `md-navigation-tab` | labs | The **compact** breakpoint the rail collapses into |
| `md-icon` | stable | Destination icons |
| `md-ripple`, `md-focus-ring` | stable | State layer and focus ring on hand-built items |
| `md-fab` | stable | The optional FAB at the top of the rail |
| `md-icon-button` | stable | The optional menu button |
| `md-divider` | stable | The optional vertical divider against content |
| `md-badge` | labs | Destination badges |

**Why not press `md-navigation-tab` into service as a rail item?** It looks
tempting — it already does the icon swap, the pill indicator, the badge and the
ripple. Two things stop it: it is sized for a bar (64×32dp indicator, not the
rail's 56×32dp), and it exposes **no CSS custom properties at all**, so there is
no supported way to retune it. You would be shipping bar metrics and calling them
a rail. Hand-build the items; it is about 60 lines of CSS and you get the spec
exactly.

Do use `md-navigation-bar` + `md-navigation-tab` for the compact layout, though —
there the bar metrics are the correct ones.

## The spec, as exact token values

These are not from a screenshot — they are read out of
`@material/web/tokens/versions/v0_192/_md-comp-navigation-rail.scss`, the official
token set. `assets/navigation-rail.css` implements all of it.

| Token | Value |
|---|---|
| Container width | **80px** |
| Container colour | `surface` |
| Container elevation | level 0 |
| Container shape | none (square) |
| Icon size | 24px |
| Active indicator | **56 × 32px**, `corner-full`, `secondary-container` |
| Active indicator (no label) | **56 × 56px**, `corner-full` |
| Active icon | `on-secondary-container` |
| Active label | `on-surface`, weight `label-medium-weight-prominent` |
| Inactive icon | `on-surface-variant` |
| Inactive label | `on-surface-variant` |
| Label type | `label-medium` |

Three of these trip people up:

- **The container is `surface`, not `surface-container-low`.** The drawer uses the
  latter; the rail does not. Reaching for the drawer's colour gives a rail that
  looks subtly wrong against the app background.
- **The active icon and the active label take *different* roles.** Icon is
  `on-secondary-container` because it sits on the indicator; the label sits below
  the indicator on the plain container, so it is `on-surface`. Colouring both the
  same is the most common rail styling bug.
- **The indicator is 56×32 with a label, 56×56 without.** Without a label there is
  no text to make room for, so the pill becomes a circle. Same `corner-full`
  either way.

## Building it

Read `assets/navigation-rail.css` and `assets/NavigationRail.tsx` rather than
retyping the numbers.

```html
<nav class="md3-rail" aria-label="Main">
  <!-- Optional, in this order: menu, then FAB, then destinations. -->
  <md-icon-button class="md3-rail-menu" aria-label="Expand navigation">
    <md-icon>menu</md-icon>
  </md-icon-button>

  <md-fab class="md3-rail-fab" size="medium" aria-label="Compose">
    <md-icon slot="icon">edit</md-icon>
  </md-fab>

  <ul class="md3-rail-items">
    <li>
      <a href="/inbox" class="md3-rail-item" data-active aria-current="page">
        <span class="md3-rail-indicator">
          <md-icon>inbox</md-icon>
          <md-ripple></md-ripple>
        </span>
        <span class="md3-rail-label">Inbox</span>
      </a>
    </li>
  </ul>
</nav>
```

The structure is doing specific work:

- **The indicator wraps the icon only, not the label.** That is what produces a
  56×32 pill behind the icon with the label sitting below it, which is the whole
  visual signature of an M3 rail. Wrapping both gives you something closer to a
  drawer row.
- **`md-ripple` goes inside the indicator**, so the state layer is clipped to the
  pill rather than to a rectangle.
- **`<a>` for destinations that navigate.** Links give you keyboard activation,
  middle-click and "open in new tab" for free. Use `<button>` only for items that
  change state without navigating.
- **`data-active` and `aria-current="page"` are both needed.** The first drives the
  pill, the second is what a screen reader announces. Neither implies the other.

### Order inside the rail

Menu at the top, then the FAB, then the destinations. M3 is explicit: **avoid
placing the FAB below the navigation items.** The rail's top is the natural anchor
for the app's primary action.

A logo can sit at the top instead, but M3 warns against logos that could be
mistaken for a button or a destination.

### Alignment

Items align as a group to the **top or centre** of the layout. On tablets prefer
centre alignment — it puts the destinations within easier thumb reach.

```css
.md3-rail { justify-content: center; }  /* tablet-friendly */
```

### Icons and labels

- When a destination is selected the icon **fills** and changes colour, and the
  indicator appears behind it. The fill is a second channel beside colour, so it
  is an accessibility feature, not decoration.
- Icons must symbolise the destination's content.
- Labels: short and meaningful. **Do not truncate and do not show an ellipsis.**
  Do not shrink the type scale to fit. If a label is too long, break it across two
  lines between words, or hyphenate.

That last rule is the opposite of the navigation drawer's, where truncation *is*
the prescribed answer. The rail is 80dp wide and a truncated label there carries
almost no information, so M3 would rather you wrap.

### Only one active indicator

Ever, at any time. Using it on more than one item destroys the one thing it
communicates.

## Behaviour

**Vertical scrolling:** destinations stay fixed while content scrolls. The rail
does not scroll away.

**Horizontal scrolling:** the rail may scroll off or stay fixed. If it stays,
distinguish it from the content moving underneath — add a `md-divider` on the
content-facing edge, or raise the rail to elevation level 1.

**Selection:** the destination screen uses a top-level transition, and the
indicator expands from the centre of the icon.

**Placement in adaptive layouts:** the rail belongs **outside** any panes — it
navigates the app, not the pane. Do not confuse it with tabs, which organise
content *within* a view.

## M3 Expressive: collapsed and expanded rails

The May 2025 Expressive update reorganised this component, and the naming matters
because it changes what you should build:

| Variant | Baseline M3 | M3 Expressive |
|---|---|---|
| Navigation rail (baseline) | Available | **Not recommended** — use collapsed |
| Collapsed navigation rail | — | Available |
| Expanded navigation rail | — | Available |

**The expanded rail replaces the navigation drawer.** If a request mentions a
drawer and the project targets Expressive, the answer is an expanded rail. The two
rails match visually and transition into each other via the menu button.

The expanded rail comes in **standard** (participates in layout) and **modal**
(floats over content) configurations, and can be set to *hide when collapsed* for
immersive experiences — appearing only when the menu icon is used.

One colour change worth knowing: the active label on vertical items moved from
`on-surface-variant` to `secondary`.

**Web status for both is Unavailable, and `@material/web` 2.5 ships no tokens for
them** — only the baseline rail token set exists. So Expressive rail measurements
have to come from the Figma kit or the Compose implementation. `references/expressive.md`
records what the docs state; treat unstated numbers as unknown rather than
guessing them.

## Accessibility

⚠️ **The saved doc set did not include the rail's own accessibility page** — the
file named for it contains M3's **Radio button** page instead. So what follows is
the rail guidance that *is* documented, plus web platform requirements, and it is
marked as such rather than attributed to M3's rail docs.

**Do not give a rail radio-group semantics.** This is worth saying because the
radio-button page sitting in the same folder makes it a tempting model — one of a
set is selected, after all. But navigation destinations that change the page are
**links**, and `role="radiogroup"` would tell assistive tech that activating one
selects a value rather than navigating. Arrow-key-only traversal would also hide
destinations from users who tab.

What the rail needs on the web:

- `<nav aria-label="…">` around the destinations. Distinct labels if the page has
  more than one nav landmark.
- `aria-current="page"` on the active destination. The pill is visual only.
- Real `<a href>` destinations, so `Tab` reaches each one and `Enter` activates it.
- Accessible names that survive being read alone. If a label only makes sense
  because of what is next to it, add an `aria-label`.
- The icon fill (outlined → filled) kept, so "which destination is current" does
  not rely on colour alone.
- 48×48 CSS pixel minimum touch targets. The rail's 56×32 indicator is the
  *visual* pill; the hit area must still reach 48px.
- `prefers-reduced-motion` respected on the indicator and expand transitions.

## React and Next.js specifics

Material Web components are custom elements, which brings three traps:

1. **They do not server-render.** The server emits the tag; the browser upgrades
   it when the module loads. Import them from a `'use client'` module and reserve
   the rail's width in CSS so the upgrade is not a visible jump.
2. **Attribute names are kebab-case.** React passes unknown props straight through
   as attributes, so `hideInactiveLabel` becomes a literal, ignored attribute.
   Write `hide-inactive-label`.
3. **Import per component, never the barrel.** `import '@material/web'` pulls in
   the whole library.

## Checklist

- [ ] 80px wide, `surface` container, on the **leading** edge, vertical only
- [ ] Indicator 56×32 (or 56×56 with no label), `corner-full`, `secondary-container`
- [ ] Active **icon** `on-secondary-container`; active **label** `on-surface` — different roles
- [ ] Active icon filled; exactly one active indicator
- [ ] Labels never truncated — wrap or hyphenate instead
- [ ] Menu, then FAB, then destinations; FAB never below the destinations
- [ ] 3–7 destinations
- [ ] Becomes a navigation bar below 600px, and the two never appear together
- [ ] `<nav aria-label>`, `aria-current="page"`, real links, 48px targets
- [ ] No radio-group semantics
- [ ] Works at `dir="rtl"` (leading edge flips)

## Reference files

- `references/spec.md` — the full baseline token set, anatomy, placement, adaptive
  and behaviour rules from the official pages. Read when you need a value or a rule
  this page summarised.
- `references/expressive.md` — the collapsed and expanded rails, their
  configurations, and exactly which numbers the docs do and do not give for web.
  Read when the project targets M3 Expressive or is replacing a drawer.
- `assets/navigation-rail.css` — drop-in CSS implementing the baseline spec.
- `assets/NavigationRail.tsx` — working React component with the compact-window
  navigation bar swap.

Both assets were typechecked, linted and built against Next.js 15 / React 19 /
`@material/web` 2.5 before being put here, so they compile as given.
