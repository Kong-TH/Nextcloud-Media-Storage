# Design rationale and rules

## Mental model

Buttons express discrete actions. Their prominence should communicate importance before the user reads every label. Navigation destinations belong to navigation; selection and filtering may be better served by chips or other selection controls. Related actions can share a row without becoming a specialized animated button-group component.

## What to do

- Use filled styling sparingly for the main or final action. Tonal styling provides intermediate emphasis; outlined styling supports an alternative; text styling minimizes distraction.
- Let width follow the label, with responsive stretching only where the layout benefits. Keep icon and text centered as a group when width grows.
- Use clear verbs: Upload, Create bucket, Save changes. For this app, distinguish Remove reference from Delete file; UI wording must match actual backend behavior.
- Use optional leading icons that clarify the action, mirrored to the logical leading side for RTL. Prefer familiar meanings over decorative icons.
- Align actions consistently within their context. Dialog actions generally sit at the trailing edge; adapt placement to space without changing reading or keyboard order.
- Retain consistent typography, theme roles, state feedback, and spacing across variants.

## What to avoid

- Do not fill a screen with equally prominent buttons or convert every minor action into a filled button.
- Do not force a fixed width narrower than its label, truncate with ellipses, or wrap labels in ordinary layouts. At enlarged text sizes, prioritize readable, operable controls over rigid one-line geometry.
- Do not separate icon and label onto opposite edges, stack them vertically, or add two icons to a normal labeled button. Specialized split buttons are a separate pattern.
- Do not uppercase every label or underline text buttons. Use a normal text link for hyperlinked prose.
- Avoid outlined and text buttons over busy media without checking legibility. Filled backgrounds may be more suitable.
- Avoid excessive shadows. Elevated styling solves separation from backgrounds; it is not the universal primary-action style.
- Avoid excessively long, nearly empty stretched buttons on wide screens. Constrain the action area or place actions beside related content.
- Do not rely on color alone for selected, busy, or error state.

## Baseline M3 versus Expressive

The saved specs describe five baseline color styles and the small, round default. XS/M/L/XL sizes, square shapes, selection toggles, and shape morphing are marked as Expressive features. They are design guidance, not proof of support in @material/web.

For a deliberately custom Expressive implementation, the saved corner table gives square resting corners of XS/S 12dp, M 16dp, L/XL 28dp; pressed corners XS/S 8dp, M 12dp, L/XL 16dp. Round resting corners are fully rounded. These are size-specific shape references, not a complete implementable size system. The saved interactive token tables contain no extracted numeric values for height, icon size, or padding across all sizes; verify authoritative tokens before claiming exact parity. Web CSS pixels can represent logical design dimensions but are not universally equivalent to physical Android dp.

The source marks 24dp small-button padding as baseline and recommends 16dp for Expressive. Do not silently change a baseline library to Expressive padding or invent an XS–XL size attribute.

## Toggles

Use persistent toggles for binary choices such as Favorite. Preserve similar label lengths between states to reduce layout jumps. The saved design guidance uses outlined/filled icon changes and opposite round/square resting shapes for selection. The text style has no toggle variant in those specs. Implement accessible pressed state with verified APIs or a native button wrapper, rather than attaching unsupported selected properties to common Material buttons.
