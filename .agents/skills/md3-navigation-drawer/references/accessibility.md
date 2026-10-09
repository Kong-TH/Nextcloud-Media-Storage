# Navigation drawer — accessibility

From material.io's navigation drawer Accessibility page, captured 2026-09-29, plus
the web-specific implications.

## What users must be able to do
- Move between navigation destinations with assistive technology
- Select a particular destination from a set
- Get feedback appropriate to their input device

## Interaction feedback by input

### Touch
When a destination is tapped:
1. The active indicator appears **in place**, confirming selection
2. A touch ripple passes through the indicator
3. The icon switches outlined → **filled**
4. The icon changes colour, becoming darker

### Cursor
1. On hover, the hover state layer appears
2. On click, a ripple passes through the indicator
3. The icon switches outlined → **filled**
4. The icon changes colour — darker in light theme, **lighter in dark theme** — to
   increase contrast

The icon fill is doing real work here. Colour alone is not a sufficient indicator,
so the outlined → filled switch is the second channel that makes the active
destination perceivable without relying on hue.

> Use a filled icon for the selected destination to differentiate it.
> Avoid keeping the selected icon's style the same as unselected icons — this
> removes an important visual indicator of which destination is active.

## Initial focus
Focus lands **directly on the first navigation item**, because that is the first
interactive element of the component. Don't put a focusable wrapper, close button or
headline ahead of it unless the design genuinely calls for one.

## Closing
A modal drawer can be dismissed by selecting the **scrim** covering the rest of the
screen. On the web, `Esc` must also close it — keyboard users have no scrim to
click.

## Keyboard navigation

| Keys | Action |
|---|---|
| `Tab` | Focus lands on the first navigation destination |
| `Space` or `Enter` | Selects the focused destination |
| Arrow keys | Navigate between destinations within the drawer |

`md-list` implements arrow-key navigation between `md-list-item` children, so you
get that for free. `Tab` order and the focus trap are yours.

## Labelling elements

A drawer's accessible label can incorporate adjacent UI text. **When the visible
text is ambiguous, the accessible label must be more descriptive.**

The official example: a destination visibly labelled **"Recents"** sits beside a
grid of photos. On screen the context makes it clear; read aloud in a list of
destinations it does not. Its accessible label should be **"Recent images"**.

Test for this: read each label on its own, with no surrounding UI. If it stops
making sense, it needs an `aria-label`.

## Web-specific requirements the M3 page assumes

The M3 guidance is written platform-neutrally and assumes the platform's own
navigation component handles semantics. On the web you provide them:

### Modal drawer
- `role="dialog"` and `aria-modal="true"` on the sheet
- Move focus into the drawer on open (first destination)
- **Trap focus** while open — without this, `Tab` walks out of the dialog into the
  content behind the scrim, which the user cannot see
- `Esc` closes
- Clicking the scrim closes
- **Return focus to the trigger** on close, or the keyboard user is stranded at the
  top of the document
- Mark the background inert (`inert` attribute, or `aria-hidden` on the main
  region) so assistive tech does not read through the scrim

The `@material/web` labs modal drawer handles Esc and the scrim click. It does
**not** trap focus or mark the background inert.

### Standard drawer
A permanent standard drawer is **not** a dialog. No `role="dialog"`, no
`aria-modal`, no focus trap, no scrim. Applying dialog semantics to a permanent
sidebar is a bug in its own right — it tells assistive tech the rest of the page is
unavailable when it isn't.

A *dismissible* standard drawer sits between the two: it opens and closes, but it
does not block the content beside it, so it still takes no dialog semantics.

### Both variants
- Wrap the destination list in `<nav aria-label="…">`. If the page has more than one
  nav landmark, the labels must differ.
- Put `aria-current="page"` on the active destination. The active indicator is
  visual only; `aria-current` is what a screen reader announces.
- Use `md-list-item type="link" href="…"` for destinations that navigate, so they
  render a real `<a>` — keyboard activation, middle-click, and "open in new tab" all
  come along with it.
- Respect `prefers-reduced-motion` for the open/close transition.
