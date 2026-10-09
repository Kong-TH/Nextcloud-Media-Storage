# Web API and modal accessibility

## Official API cross-check

Source: https://material-web.dev/components/dialog/ (checked 2026-10-09). Inspect the installed version.

```js
import '@material/web/dialog/dialog.js';
import '@material/web/button/text-button.js';
```

md-dialog has headline/content/actions slots. Use open or asynchronous show()/close(); do not assume showModal(). method="dialog" forms can close it, and button values identify returnValue. These are UI outcomes, not server success. Bind events directly when the framework does not forward custom-element events.

The API documents open/opened, close/closed, and cancel events; cancel covers scrim and Escape. Verify event cancellation and actual behavior in the installed version before guarding dirty exits. Focus trapping is enabled by default; avoid no-focus-trap. A headline labels the dialog; otherwise supply aria-label. Use type="alert" only for an important message requiring response. Documented theme overrides include --md-dialog-container-color and --md-dialog-supporting-text-color. Size/position use CSS. Full-screen layout still needs application work.

## Async form pattern

Use unique form/control IDs when needed. For async saves, handle submit explicitly, prevent default auto-close, validate, guard repeated submissions, then await the API. Close only after confirmed success; preserve the dialog and data on failure. Cancel must be type="button" when it must bypass validation, or explicitly bypass validation in a verified dialog-form pattern. A required invalid field must not trap someone behind an inoperable Cancel.

Reset per-opening outcome state. Escape/scrim must not accidentally reuse an old confirmation returnValue. Do not perform mutations in every close handler; only the deliberate confirm flow initiates the authorized request. Handle component animation promises and host unmounting without reopening a dismissed task or updating a stale view.

## Supplemental web accessibility guidance

The user's supposed Accessibility file is actually Divider Specs. The following checks are web implementation guidance, not a claim about that saved page:

- Give the dialog a meaningful accessible name and use descriptions appropriately. Avoid flattening a long structured form into one enormous aria-describedby announcement.
- Move focus inside on opening. Prefer a sensible starting control or focusable heading for long content; use the safe dismissive choice for irreversible decisions when appropriate. Do not automatically focus a destructive action.
- Keep Tab and Shift+Tab inside the active modal, make background content inert to interaction, and restore focus to the trigger or a logical successor if it was removed.
- Test Escape and scrim separately. Dirty-task guards must cover all close routes while retaining an explicit path to leave. Do not add a competing custom focus trap on top of the library without evidence it is needed.
- Command buttons activate with Enter/Space; text areas should retain normal Enter behavior rather than submitting accidentally.
- Name the close icon. Use normal text contrast, visible focus, operable touch targets, 200% text scaling, translated content, and narrow viewports. Keep validation messages associated with their fields and announce general errors without repeated announcements.
- If an allowed confirmation appears over a full-screen task, focus and input belong to the top dialog only; restore to the underlying task when closing it.
- Test document scrolling, software keyboards, plugin root scoping, and actual browser top-layer behavior. Do not disable a real modal's semantics just to keep the host header clickable.

## Meaningful verification

Exercise open → edit → invalid submit → corrected submit → success, plus network failure/retry, double submit, unchanged dismissal, dirty Escape/scrim dismissal, and focus return. Verify Cancel with invalid fields. Check both themes and breakpoint adaptation without losing input. Skill validation proves structure only, not browser behavior.
