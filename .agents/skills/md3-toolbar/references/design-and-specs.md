# Design and specifications

## Variant, role and placement

Docked toolbars span the available width and suit stable/global actions within an app flow. Floating toolbars sit above content and suit page/contextual actions. Floating can be horizontal or vertical. Both are Expressive variants; baseline bottom app bar remains supported but is no longer recommended.

Default docked guidance says bottom placement and straight corners, avoiding another bottom-aligned element such as a navigation bar. Later web/large-screen guidance explicitly permits rounded docked toolbars placed elsewhere in the page. Preserve this platform exception rather than turning bottom-only or square-only into a universal web rule. Name the chosen treatment and verify it fits the page context.

Do not display competing bottom toolbar/navigation bars. Floating local navigation is permitted in the guidance, but must fit the hierarchy without redundant navigation combinations. A toolbar cannot replace the plugin's bucket drawer merely because it can contain navigation controls.

## Slots and action hierarchy

The container has configurable slots for icon buttons, labeled buttons, text fields, images or custom components. Slots are design concepts, not proof of web component slot APIs. Each control retains its own interaction semantics; the container has no activation behavior by default.

Prefer consistent controls and essential visible actions. Overflow holds less frequent actions when space is insufficient. Do not overwhelm users or mix many unrelated control styles. A filled/tonal control, custom color emphasis, width change or paired FAB can emphasize one action; do not combine several competing primary treatments.

A FAB can sit beside a floating toolbar to emphasize the highest-priority action. Compose it separately on platforms without built-in pairing. Jetpack Compose support does not establish web behavior. Fully rounded floating surfaces should not contain square filled icon buttons; square buttons are permitted in docked designs. Use narrow/default controls in vertical floating designs, not wide buttons that cover content.

## Measurements

| Attribute | Supplied specification/guidance |
| --- | --- |
| Default toolbar height | 64dp |
| Default alignment | Centered |
| Docked leading/trailing padding | At least 16dp |
| Docked default item spacing | 32dp; configurable |
| Control targets | At least 48 by 48dp |
| Horizontal floating outer margin | At least 16dp |
| Vertical floating outer margin | At least 24dp |

Default equal spacing is not a requirement to force 32dp into a narrow layout. The source also illustrates 8dp item spacing for a configured centered docked toolbar. Preserve target areas when changing padding.

The inspected floating measurement diagram labels 64dp height, 8dp internal leading/trailing padding, 4dp inter-item spacing, an 8dp gap to a separately paired 56dp FAB. These are floating measurements; do not replace docked minimum 16dp edge padding with them. The margin diagram shows 16dp minimum horizontal edges and spacing above a system navigation region; its 40dp system-region annotation is not a universal web safe-area value.

Translate dp to CSS deliberately. Default 64dp height describes horizontal designs; for a vertical floating toolbar treat the layout as rotated/adapted rather than forcing its entire height to 64px. The web/large-screen exception allows reducing height and extra-small controls only when vertical space is limited; this does not waive target/accessibility evaluation.

## Color and elevation

Standard is lower emphasis and uses surface container. Its placed-control mappings include primary/on primary filled controls, secondary container/on secondary container tonal toggles and primary standard controls.

Vibrant emphasizes controls or a temporary edit mode through primary container. Its control mappings include primary/on primary filled controls, surface container/on surface tonal toggles and on primary container standard controls. Alternative role choices are allowed by the design but require actual contrast evaluation. Do not interpret slot color examples as guaranteed token names.

Floating toolbars have elevation by default; it can be removed over sufficiently distinct content. Historical overview M2/bottom-app-bar no-shadow statements do not override this floating-toolbar guidance. No exact elevation, opacity, typography, radius or motion inventory is available from the collapsed token panels. Preserve light/dark roles and distinct focus/pressed/selected feedback within the controls.

## Adaptation, navigation and motion

Docked fills the app surface; compact controls are evenly spaced, while larger layouts can center them or distribute edge groups around a key action. The supplied compact boundary is below 600dp and medium 600–839dp; adapt to actual plugin space rather than assuming the browser belongs to the plugin.

Floating should fit its controls without excessive empty space and retain edge margins. Cap width and use trailing overflow where appropriate; reveal more actions as space permits. Do not let the container exceed its pane edge. Larger screens may use several toolbars for distinct purposes, but compact screens should use one.

Vertical floating placement can balance an existing navigation rail on the opposite edge; guidance calls for a centered rail in that combination. This conditional example does not require introducing a rail into a drawer-based product.

Mirror meaningful directional icons and action order in RTL so Next remains trailing. Keep visual order and focus order aligned; do not reverse both CSS and DOM accidentally.

On scroll a docked toolbar may remain or exit. Floating may remain, exit or collapse to a key action. Collapse-to-FAB is explicitly described as available in Jetpack Compose, not a verified web API. Do not both collapse and transition offscreen. Never hide a focused toolbar out from under keyboard users. Provide continued access, account for content overlap, virtual keyboards and safe areas, and respect reduced motion.
