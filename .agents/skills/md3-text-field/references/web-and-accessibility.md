# Web implementation and accessibility

## Material Web APIs

Verify the installed version. Upstream documents md-filled-text-field and md-outlined-text-field with label/value, supporting-text, error/error-text, prefix-text/suffix-text and leading-icon/trailing-icon slots. Supported types include text, email, number, password, search, tel, url and textarea. Textarea uses rows and CSS sizing/resizing. maxlength exposes a counter. Constraint validation offers checkValidity(), reportValidity() and setCustomValidity(); manual error state can override reported errors. The guide warns external labels need aria-label because aria-labelledby is unsupported there. Verify this on the installed version. Component tokens include --md-filled-text-field-container-color and --md-outlined-text-field-focus-outline-color. Use installed event/property signatures and do not assume every native input type is supported. [Material Web text field guide](https://github.com/material-components/material-web/blob/main/docs/components/text-field.md)

Keep value state stable in Vue. Inspect custom-element registration and boolean/property binding; do not assume native v-model forwarding. Avoid rerendering/replacing the field on every input, moving the caret, or coercing unfinished input into a final value. Preserve paste, composition and selection. For native controls use their native labels; the custom-element external-label warning is not a rule for all HTML inputs.

## Accessible naming and interaction

Use the visible label's meaning as the persistent accessible name; placeholders are not enough. If an adjacent label needs explicit aria-label on the installed custom element, keep it synchronized with translation and visible words. Do not concatenate every helper, unit and error into an ever-changing field name. Associate descriptions/errors with stable IDs using behavior verified across the component's shadow boundary.

Tab/Shift+Tab reaches enabled fields and actionable icons in a logical order. Native text entry works on focus; do not require an extra activation key. Preserve arrows, Home/End, selection shortcuts, paste and IME. Enter in a textarea inserts a line break; do not submit a dialog unexpectedly. Clear/reveal/picker buttons must not accidentally submit the form. Clearing should retain useful input focus; revealing a password preserves the value and caret where possible.

Name password reveal actions Show password/Hide password as their action changes. Unlike a switch setting's stable name, these are command labels. Keep passwords and token secrets out of logs, browser persistence and telemetry. Do not block password-manager or paste behavior without a concrete requirement.

Name interactive icons by function. The capture labels a noninteractive error icon Error; on web avoid duplicate speech if equivalent error text is already associated and announced. If the icon conveys unique information, expose it once; never make an error glyph a focusable fake button. Prefix/suffix meaning needs an associated description and stable ID, not a second textbox.

Readonly does not mean disabled: users may still need focus, selection and copying. Verify actual component behavior and submission semantics. Do not hide validation instructions in an inaccessible tooltip.

## Validation and notifications

On failure identify the affected field and correction in text. Link inline descriptions to controls; mark invalid state and expose new error feedback without relying on color. For a submitted form with multiple errors, a useful error summary can link to fields; preserve entered values and deliberate focus recovery. Live regions can announce dynamically inserted errors. [WAI form notifications](https://www.w3.org/WAI/tutorials/forms/notifications/)

The supplied Material Accessibility prose applies alert to error messages; do not blindly put role=alert on the textbox itself. Use an appropriate message/status region and avoid duplicate announcement from the component plus an external live region. Do not announce each keystroke as an error. Choose validation timing for the task, typically meaningful blur/submit or correction after an error, instead of reporting untouched empty fields as failed immediately.

Required indicators must agree with programmatic required state. Keep the captured asterisk convention and explain it, but do not assume screen readers announce the asterisk meaning without semantic required state. A counter should describe its unit and useful limit; avoid a noisy live announcement for every character.

Clear obsolete custom-validity messages when the condition is corrected. Keep manual visual errors, constraint validity and submission blocking coherent. Backend validation remains authoritative; a visual red border alone cannot enforce anything. Do not claim successful persistence from client-side validity alone.

Async availability checks need query/value generations or cancellation so stale responses cannot validate the wrong current text. Distinguish pending validation, invalid values and server/network failure. Preserve the draft after errors and prevent duplicate Save requests. Do not silently normalize case/Unicode or trim names if the server treats those bytes as meaningful or rejects them.

## Current project constraints

Source inspection, not new live verification:

- NodeRules::name requires valid UTF-8, 1–255 bytes, no leading/trailing whitespace, slash/backslash, controls, or dot segments. Exact UTF-8 bytes distinguish sibling names.
- ApiTokenService token names require valid UTF-8, nonempty trimmed text, at most 100 bytes and no controls.
- HTML maxlength/counters and JavaScript string length are not UTF-8 byte counts. For these contracts, count encoded bytes explicitly and label the limit as bytes; server validation remains final. Test Thai text and emoji.
- File IDs are validated positive integers by backend operations; do not substitute a filename/path hint as authority or use a numeric field that silently rounds large identifiers.
- Bucket naming rules remain unresolved. Do not copy folder rules and call them an approved bucket contract.

## Verification scenarios

Record actual browser/package and results:

- Empty/populated, focus/hover, error, disabled and readonly states in both variants.
- Names, required/invalid state, helper/error/unit/counter descriptions and external-label behavior with a screen reader.
- Tab, Shift+Tab, native editing, IME, paste, Enter/textarea and field icon actions without duplicate submit.
- Form submit/reset, manual versus constraint validation, async stale-response handling and failed Save recovery.
- Boundary lengths in the correct unit, Thai/emoji, whitespace, invalid names and server duplicate errors.
- Zoom, localized labels, wrapped errors, mobile keyboards, RTL, both themes, focus/outline contrast and touch targets.
- Scoped styling/CSP and unchanged Nextcloud controls; no secret leakage through persistence or logging.

No frontend build, rendering or assistive-technology test is established by writing this skill.
