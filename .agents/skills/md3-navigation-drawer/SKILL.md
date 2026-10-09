---
name: md3-navigation-drawer
description: >
  Build a Material Design 3 navigation drawer on the web with @material/web — the
  side sheet of app destinations, standard (always/dismissible) or modal (with a
  scrim). Covers the official M3 spec (360dp sheet, 56dp × 336dp active indicator,
  28dp radius, colour roles, breakpoints), which parts @material/web gives you and
  which you must build, plus keyboard, focus, ARIA and RTL. Use this whenever the
  user wants a side nav, sidebar, drawer, hamburger menu, nav panel, app shell
  navigation, or a list of destinations down the left edge — in React, Next.js, Lit
  or plain HTML — even if they don't say "Material" or "MD3". Also use it when they
  ask whether to use a drawer at all, mention md-navigation-drawer, or need to fix
  an existing drawer's sizing, active state, scrim or accessibility.
---

# MD3 navigation drawer on the web

A navigation drawer is a side sheet holding an app's top-level destinations. M3
recommends it for **5 or more destinations**, or **2+ levels of hierarchy**.

Two variants, and the difference is layout, not looks:

| | Standard | Modal |
|---|---|---|
| Effect on layout | Takes horizontal space; content sits beside it | Floats over content, layout unchanged |
| Scrim | No | Yes — blocks interaction, click to dismiss |
| Can be permanent | Yes | No |
| Typical window | ≥ 840px | < 840px |

## Read this before you build one

**Two facts change the answer, and a model that doesn't know them will build the
wrong thing.**

1. **M3 deprecated the navigation drawer in the May 2025 Expressive update.** The
   replacement is an *expanded navigation rail* — a rail that shows text labels and
   can itself be modal. If the project targets M3 Expressive, say so and offer the
   rail; the **`md3-navigation-rail`** skill covers it, including what the docs do
   and do not specify for the expanded variant on the web. If the project targets
   baseline M3, or already has drawers, the drawer is fine and the spec below
   still stands.

2. **`md-navigation-drawer` is a `labs/` component.** It exists in `@material/web`
   and it works, but labs is the unstable shelf: not exported from `all.js`,
   undocumented upstream (the source literally carries a `b/265346501 - add docs`
   TODO), and free to change or vanish between releases. This is why material.io
   lists the drawer's web status as **Unavailable**.

So there are two honest paths. Pick deliberately and tell the user which you took:

- **Use labs** — you get the sheet, scrim, Esc-to-close and animation for free.
  Right when shipping speed matters more than upstream stability.
- **Hand-build the sheet** — ~40 lines of CSS over an `md-list`. Right when the
  team won't ship unstable dependencies, or you want full control.

Either way **the destinations are yours to build**, because neither the labs
drawer nor `md-list-item` provides an active indicator. That is the part people
get wrong, and it is the heart of this skill.

## What @material/web actually gives you

Verified against `@material/web` 2.5.0. Check the installed version before relying
on it — `node_modules/@material/web/package.json`.

| Need | Component | Notes |
|---|---|---|
| Sheet + scrim + Esc | `md-navigation-drawer`, `md-navigation-drawer-modal` | **labs** — deep import required |
| Destination list | `md-list` | Arrow-key navigation built in |
| One destination | `md-list-item` | `type="link"` + `href` renders an `<a>`; ripple and focus ring included |
| Icon | `md-icon` | Put it in `slot="start"` |
| Group separator | `md-divider` | Full-width only — see below |
| **Active indicator** | *nothing* | **You build it.** `md-list-item` has no shape token. |

```js
// labs is not in all.js — these are the real paths
import '@material/web/labs/navigationdrawer/navigation-drawer.js';
import '@material/web/labs/navigationdrawer/navigation-drawer-modal.js';
```

Labs drawer API: `opened` (boolean), `pivot` (`'start' | 'end'`), and it fires
`navigation-drawer-changed` with `{opened: boolean}` (bubbles, composed). Its
content is a single default `<slot>`.

## The spec, as numbers

These come from material.io and are what make a drawer look right rather than
approximately right. Same for both variants unless noted.

| Attribute | Value |
|---|---|
| Container width | **360dp** |
| Container height | 100% |
| Container shape | `0 16px 16px 0` (standard; modal has no leading radius requirement) |
| Left / right padding | **28dp** each |
| Active indicator | **336dp × 56dp**, radius **28dp** (fully rounded) |
| Active indicator inner padding | 12dp |
| Icon size | 24dp |
| Label alignment | Start |
| Padding between items | 0dp |

Note how 360 − 28 − 28 = **336**. Set the sheet's inline padding to 28px and the
indicator gets its width for free — don't hard-code 336px, it will drift the
moment the sheet width changes.

### Colour roles

Use the role, never a hex value, so the drawer follows light/dark and dynamic
colour automatically.

| Element | Role |
|---|---|
| Sheet container | `surface-container-low` |
| Inactive icon + label | `on-surface-variant` |
| **Active** indicator | `secondary-container` |
| **Active** icon + label | `on-secondary-container` |
| Divider | `outline-variant` |
| Scrim (modal) | `scrim` at ~32% opacity |

`--md-sys-color-scrim` is often missing from a hand-rolled token set — check for it
and add it rather than assuming, or the scrim renders transparent and the modal
silently stops looking modal.

## Building it

`assets/navigation-drawer.css` is a drop-in implementation of everything above,
and `assets/NavigationDrawer.tsx` is a working React/Next.js component. Read them
rather than retyping the numbers — then delete what the project doesn't need.

The shape of it:

```html
<md-navigation-drawer opened>
  <nav aria-label="Main">
    <h2 class="drawer-headline">Mail</h2>
    <md-list>
      <md-list-item type="link" href="/inbox" data-active aria-current="page">
        <md-icon slot="start">inbox</md-icon>
        <div slot="headline">Inbox</div>
      </md-list-item>
      <md-list-item type="link" href="/drafts">
        <md-icon slot="start">drafts</md-icon>
        <div slot="headline">Drafts</div>
      </md-list-item>
    </md-list>
  </nav>
</md-navigation-drawer>
```

Three things about this that matter:

- **`data-active` + `aria-current="page"` both.** The first drives the indicator,
  the second tells a screen reader. Neither implies the other.
- **`slot="headline"` not bare text.** A bare text child lands in the wrong slot
  and loses its typography.
- **The `<nav aria-label>` wraps the list, not the drawer.** Two navs on a page
  need distinguishing labels; the drawer element is a sheet, not a landmark.

### The active indicator

`md-list-item` exposes colour and spacing custom properties but **no shape**, so
the rounded indicator is a `border-radius` on the host:

```css
md-list-item[data-active] {
  border-radius: 28px;                              /* the whole point */
  --md-list-item-label-text-color: var(--md-sys-color-on-secondary-container);
  --md-list-item-leading-icon-color: var(--md-sys-color-on-secondary-container);
  background: var(--md-sys-color-secondary-container);
}
```

Set the indicator height with `--md-list-item-one-line-container-height: 56px`, on
every item — the row height is 56dp whether or not it is active, or the list jumps
as selection moves.

### Icons: fill the active one

M3 asks the selected destination's icon to switch from outlined to **filled**.
This is a real accessibility requirement, not decoration — it is a second channel
beside colour for which destination is current. With Material Symbols:

```css
md-list-item[data-active] md-icon { font-variation-settings: 'FILL' 1; }
```

And the rule that goes with it: **icons on all destinations, or none.** A drawer
with icons on some items reads as broken.

### Dividers

Use them to separate *groups*, never individual destinations, and full-width. A
divider between every item turns a list into a ladder and destroys the grouping
signal you were reaching for. Optional short section labels do the same job more
clearly.

### Labels

Keep them short. If one is too long: **truncate it**. Do not wrap to two lines and
do not shrink the font — both break the 56dp rhythm that makes the list scannable.

```css
md-list-item::part(headline) { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
```

## Responsive behaviour

A drawer is not a thing you show or hide — it is one of a family of navigation
components, and the window picks which one.

| Window width | M3 calls it | Use |
|---|---|---|
| < 600px | compact | Modal drawer (or a navigation **bar**) |
| 600–839px | medium | Modal drawer, often beside a navigation rail |
| 840–1199px | expanded | Standard drawer, or a rail |
| 1200–1599px | large | Standard drawer |
| ≥ 1600px | extra-large | Standard drawer |

**Never show two primary navigation components at once.** A navigation bar and a
drawer on the same screen is the most common M3 navigation mistake — pick one per
breakpoint and transition between them.

```css
/* Below expanded: modal only. At expanded and up: standard, permanent. */
@media (min-width: 840px) {
  .drawer-modal { display: none; }
  .drawer-standard { display: block; }
}
```

Below 320 CSS pixels, a drawer cannot fit usably — use a navigation bar.

## Accessibility

This is where hand-built drawers usually fail, and the failures are invisible to a
mouse user.

**Keyboard**, per M3:

| Key | Behaviour |
|---|---|
| `Tab` | Focus lands on the **first destination** — it is the first interactive element |
| `Space` / `Enter` | Activates the focused destination |
| Arrow keys | Move between destinations (`md-list` does this for you) |
| `Esc` | Closes a modal drawer |

**A modal drawer is a modal.** It needs `role="dialog"` and `aria-modal="true"`,
focus moved in on open, focus **trapped** while open, and focus returned to the
trigger on close. The labs modal handles Esc and the scrim click; it does not trap
focus. Without a trap, keyboard users tab straight out of the "modal" into the page
behind the scrim, which they cannot see.

A standard permanent drawer is not a modal — no `aria-modal`, no trap, no scrim.
Applying dialog semantics to it is its own bug.

**Labels must survive being read alone.** A destination labelled "Recents" beside a
photo grid is clear on screen and meaningless in a screen-reader list; give it
`aria-label="Recent images"`. Rule of thumb: if the visible label only makes sense
because of what is next to it, it needs a fuller accessible name.

**RTL.** The drawer sits on the **start** edge — left in LTR, right in RTL — and
the corner radius mirrors with it. Use logical properties (`padding-inline`,
`border-start-*`, `inset-inline-start`) and it follows `dir` for free. Set
`pivot="end"` on the labs component for RTL.

## React and Next.js specifics

Material Web components are custom elements, which brings three traps that cost
real debugging time:

1. **They do not server-render.** The server emits the tag; the browser upgrades it
   when the module loads. Import them from a `'use client'` module, and reserve the
   drawer's width in CSS with `md-navigation-drawer:not(:defined) { width: 360px }`
   so the upgrade isn't a visible jump.
2. **Attribute names are kebab-case.** React passes unknown props through verbatim,
   so `supportingText` becomes a literal `supportingText` attribute and is silently
   ignored. Write `supporting-text`.
3. **Import per component, never the barrel.** `import '@material/web'` pulls the
   whole library into the bundle.

## Checklist

Before calling a drawer done:

- [ ] Sheet 360px wide, 28px inline padding, `0 16px 16px 0` radius
- [ ] Rows 56px tall; active indicator fully rounded (28px) and `secondary-container`
- [ ] Active icon **filled**; icons on all destinations or none
- [ ] Colours from `--md-sys-color-*` roles, so dark mode needs no extra work
- [ ] `aria-current="page"` on the active destination
- [ ] `<nav aria-label>` around the list
- [ ] Modal: `role="dialog"`, `aria-modal`, focus trapped, Esc closes, scrim dismisses, focus restored
- [ ] Standard permanent: none of those dialog semantics
- [ ] One primary navigation component per breakpoint
- [ ] Works at `dir="rtl"`

## Reference files

- `references/spec.md` — the full official spec: anatomy, every measurement, colour
  and state table, responsive rules, scroll and visibility behaviour. Read when you
  need a number or a rule this page summarised.
- `references/accessibility.md` — the complete M3 accessibility guidance, including
  touch vs cursor feedback and the labelling examples. Read when building the modal
  variant or auditing an existing drawer.
- `assets/navigation-drawer.css` — drop-in CSS implementing the spec.
- `assets/NavigationDrawer.tsx` — working React component, standard + modal with a
  focus trap.
- `assets/material-web.d.ts` — ambient JSX typings for the custom elements. Skip it
  if the project already wraps Material Web in typed React components; those
  wrappers carry the types.

All three were typechecked, linted and built against Next.js 15 / React 19 /
`@material/web` 2.5 before being put here, so they compile as given.
