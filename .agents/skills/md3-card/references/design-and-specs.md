# Card design, measurements, and behavior

## Variants and source tokens

| Variant | Container role in supplied Specs | Boundary |
|---|---|---|
| Elevated | surface-container-low | Shadow for separation |
| Filled | surface-container-highest | Tonal fill |
| Outlined | surface | outline-variant stroke |

Content uses appropriate on-surface roles and verified contrast. Use CSS custom properties and project tokens rather than scattering raw colors. The supplied Specs table states 12dp corner radius, 16dp left/right padding, start-aligned labels, and “8dp max” spacing between cards. Preserve that spacing statement as the captured reference rather than silently changing it to a minimum or applying it as a universal grid rule. Resolve exact layout intent against the original measurement figure/current spec when fidelity matters; larger contextual layout spacing must be an intentional adaptation.

Represent design dimensions through named logical CSS values; CSS px is not universally physically equivalent to Android dp. Interactive token tables in the saved page expose categories but not complete numerical values. Do not invent exact stroke width, elevation shadows, state opacity, or disabled colors from those empty tables.

## Anatomy and content hierarchy

Only the container is required. Group optional media, headline, subhead, supporting text, and actions into coherent blocks. Content determines useful dimensions; avoid arbitrary fixed heights that clip important text.

Use full-width dividers for expandable regions and inset dividers for related content where separation helps. Do not add separators mechanically. Thumbnails, images, and videos can establish the subject; text should remain readable even if media fails.

Avoid placing text/icons directly on images. When necessary, use a scrim or bounding surface and verify contrast across actual images, not one convenient screenshot. An image's decorative or informative purpose determines its alternative text.

## Actions and interaction models

Guidelines allow a primary action area and additional buttons, links, selection controls, or overflow actions. The Accessibility page explicitly prohibits stacking actionable elements on actionable surfaces. On the web, choose one of these implementations:

- A non-clickable container with a distinct title link, checkbox, buttons, or menu trigger. Each control has independent semantics; the container is not a Tab stop.
- A single actionable surface leading to details or performing one command, with no nested interactive controls.

For a media tile needing both Open and selection/overflow, use the first model. Do not install a root click handler and rely solely on stopPropagation to mask nested semantics. An overflow menu should be anchored predictably without blocking completion of its action.

## Collections and adaptive layouts

Collections may use grids, vertical lists, or carousels; custom staggered/mosaic layouts are optional, not the default. Keep the order understandable and resting elevation coplanar. Filters and sorting belong outside the collection and apply to the whole relevant collection.

On larger screens, use columns and appropriate grouping instead of stretching cards across a vast width. On narrow screens, cards may become a compact list if controls and content remain available. Preserve meaningful DOM order when rearranging. Adapt spacing before arbitrarily enlarging every element.

## Expansion, scrolling, and gestures

Use an expansion or detail view to reveal additional information. Reserve elaborate container transforms for meaningful moments; simpler navigation transitions suit routine detail navigation. The supplied page provides no exact animation timing. Respect reduced motion in custom implementations.

On mobile, avoid independent internal card scrolling that competes with page scrolling. An expanded card can exceed the viewport and scroll with the page. Desktop guidance permits expanded content to scroll within a card; this is an explicit contextual exception, not a universal ban on internal scrolling. Do not truncate essential information without an accessible way to reveal it.

If swipe is implemented, assign one swipe action per card, avoid competing horizontally swipeable content inside it, and keep the card intact. Drag can reorder cards; visually raise the dragged card without pushing unrelated elements around, keeping host navigation above it. Provide explicit menu/button alternatives for moving, dismissing, or reordering. These gestures are optional behaviors, not required features for every collection.
