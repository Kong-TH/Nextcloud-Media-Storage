# Web implementation and accessible lifecycle

## Component availability

Inspect the installed @material/web package before implementing. The checked progress documentation provides circular and linear progress, not proof of an Expressive seven-shape loading component. Do not invent a package path or element name. Two honest choices are custom Expressive-inspired animation with documented fidelity limits, or a baseline progress fallback clearly described as such.

Official fallback reference: https://material-web.dev/components/progress/ (checked 2026-10-09).

```js
import '@material/web/progress/circular-progress.js';
```

```html
<md-circular-progress indeterminate aria-label="Loading files"></md-circular-progress>
```

This is a progress ring, not the Expressive shape-morph indicator. The API supports indeterminate or value/max progress; default max is 1. Name the process descriptively. Import only needed modules, and use supported tokens rather than private shadow internals.

## Custom accessible status

For a custom decorative animation, keep the visual aria-hidden and provide one understandable status message. For example, a persistent role="status" region can announce Loading files when work starts and an appropriate completion/error message afterward. Do not use role=progressbar with a fake aria-valuenow for unknown progress, and do not announce every shape change or animation frame.

Use aria-busy on the affected content region where useful, clearing it on all exit paths. Keep the status region outside that busy subtree if announcements would otherwise be deferred. Avoid a custom live status duplicating announcements from an already named component. Verify the accessibility tree and actual announcement behavior rather than relying solely on attribute presence.

The supplied Accessibility capture is empty. These recommendations are supplementary web implementation guidance, not claims from that saved page.

## Async state ownership

Track idle/loading/success/error and cancellation as appropriate. Scope feedback to the current operation; a stale request must not replace new folder content or clear its loading state. Clear reveal timers and animation work on completion, failure, abort, unmount, or navigation. A finally block must only modify state if its request still owns that state.

Keep existing content and unrelated controls usable when loading more. Prevent duplicate mutations without unnecessarily locking the entire application. Preserve a useful accessible button label while busy. Do not steal focus to a decorative loading visual. Show an error and retry path rather than leaving the animation running after failure.

If real progress becomes available and that was expected, use indeterminate progress then determinate progress from the beginning. Report genuine measurements; do not make a smooth fake percentage timer. Unexpected slowness should produce useful context, not imply success or promise a completion time.

## Motion and verification

Use prefers-reduced-motion to replace morphing/spinning with a stable visual plus textual status when appropriate. Keep pending state understandable without animation. Avoid flashing or cycling live announcements. Do not invent exact easing/duration tokens from empty captured tables.

Test completion before reveal, normal pending, failure/retry, cancellation, repeated clicks, navigation away, and out-of-order response completion. Check scoped placement, retained content during pagination, layout stability, both themes, 200% text scaling, reduced motion, and focus. Document validation is not browser or assistive-technology validation.
