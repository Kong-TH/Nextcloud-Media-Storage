# Web implementation and verification

## Supported common buttons

Import only the component modules in use:

```js
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/text-button.js';
import '@material/web/button/elevated-button.js';
```

This list maps available variants; do not import all five when only one is needed. Inspect the installed package and official docs for supported attributes and tokens. Material Web is in maintenance mode; do not assume current Expressive design features are implemented.

```html
<md-filled-button type="button">Upload</md-filled-button>
<md-outlined-button type="button">Create folder</md-outlined-button>
<md-text-button type="button">Cancel</md-text-button>
```

These illustrate appearance and semantics only; connect real handlers before presenting a functional UI. For a form's primary action use explicit type="submit" and handle submission once. For navigation use supported href behavior or a proper link; do not add href to a command just for styling. A link follows link keyboard conventions, including Enter; a command button supports Space and Enter.

Optional icons use slot="icon" with an SVG or imported md-icon. Hide redundant decorative SVGs from assistive technology. Leading placement is the default design choice; the library also exposes trailing-icon for intentional cases, so distinguish API capability from design recommendation.

## Theme and token boundaries

Use --md-sys-color-* roles and verified --md-<variant>-button-* overrides on the app subtree. Filled pairs primary/on-primary; tonal pairs secondary-container/on-secondary-container; text uses primary. The live web docs use primary labels and outline strokes for baseline outlined buttons, and surface/on-surface defaults for elevated buttons. The saved newer design table uses different roles for some styles. Preserve the library's baseline defaults unless deliberately defining a coherent custom scheme; do not describe these sources as identical.

Do not style undocumented shadow DOM internals or assume shape tokens exist on unrelated components. Do not apply a document-wide reset or root theme in an embedded Nextcloud app. Keep fonts/icons local where required by the host's CSP.

## Accessibility

- Use native/custom-component button behavior rather than clickable divs. Keep Tab order logical and focus visible; command buttons activate with Space and Enter.
- Accessible names should include the visible label, adding context only when useful. Do not replace visible Upload with an unrelated aria-label.
- The saved Material accessibility page asks for 3:1 component contrast against the background, measured using the filled container or the outlined/text label. This does not replace web text-contrast requirements: aim for at least 4.5:1 for normal label text, 3:1 for qualifying large text, and 3:1 for necessary non-text visual boundaries/state indicators.
- Use comfortably sized targets; 48×48 logical pixels is a useful Material touch-target target, especially for compact controls. A visual button can be smaller than its hit region, but neighboring hit regions must not overlap.
- Test 200% text scaling, translated labels, and narrow viewports. The saved two-line enlarged-label allowance is specifically Android guidance; do not mistake it for an unconditional web rule.
- Disabled commands must not activate. Actual disabled components normally leave the Tab order. Use soft-disabled only when the installed API supports it and discoverability warrants remaining focusable; verify it suppresses action.
- For a custom toggle, expose aria-pressed and maintain state. Do not label a momentary action as pressed.
- For pending actions, expose understandable progress/status and avoid duplicate requests. UI state does not substitute for backend validation.
- Respect reduced-motion preferences for custom animations. Avoid stacking animations on rapid clicks, and do not disable useful focus feedback to eliminate motion.

## Practical checks

Verify real behavior in the host app: submit once, Cancel does not submit, disabled does not fire, focus remains usable after errors, and navigation goes to the intended destination. Check both themes, zoom/text scaling, overflow, and screen-reader names. If Expressive features are customized, identify them as custom and test their state behavior separately. Do not claim rendered verification from documentation validation alone.
