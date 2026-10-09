# Web implementation and accessibility

## Material Web APIs

Inspect the installed version. Upstream documents md-switch with selected (not checked), icons and show-only-selected-icon. It exposes name/value, disabled/required and form validity methods. Off state does not submit the selected value; required means it must be on, not merely answered. Both wrapping labels and external label-for associations are shown, but the guide warns that an aria-label is still needed because automatic label naming has an issue. Match the translated visible label and verify the installed accessible tree. Tokens include --md-switch-track-color and --md-switch-selected-track-color. The event table contradicts itself about bubbling/composition; inspect source and runtime propagation before relying on delegated handlers. [Material Web switch guide](https://github.com/material-components/material-web/blob/main/docs/components/switch.md)

Do not import the radio skill's no-wrapping-label caveat as a universal switch rule. Use unique IDs when associating external labels. Inspect custom-element registration and boolean property binding in Vue; string selected=false can still behave as a present boolean attribute. Do not assume ordinary v-model handles the custom element. Keep one authoritative application value and avoid duplicate row/click/change handlers.

Use local bundled dependencies and app-scoped tokens; do not copy global :root theme examples into Nextcloud. Inspect installed import paths and token support before using them. Preserve the host's focus and event conventions.

## Semantics and keyboard

A switch is binary, with a stable accessible name and on/off state. Custom controls expose role=switch and aria-checked=true/false; native checkbox-based switches use checked state. Space toggles; Enter support is optional in APG. Related switches can use a named group or fieldset/legend, with descriptions linked appropriately. [WAI-ARIA switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)

The supplied Material capture describes Space or Enter toggling and Tab focusing the handle. Treat the whole switch as the semantic focus target rather than trying to focus a private shadow-DOM handle. Verify both keys in the installed implementation; do not add a second Space/click toggle on top of existing behavior. Keep normal Tab/Shift+Tab traversal among controls. No radio-style arrow navigation is required for independent switches.

Ensure assistive technology receives name, role, on/off and disabled state. Keep the visible name stable; optional visible On/Off text is state feedback, not a replacement name. Use supporting text for scope and link errors to the affected setting. Decorative check/cross icons must not become repeated speech or separate focus targets.

If using a native or existing component, do not overlay incompatible ARIA or implement a second state machine. A CSS shape alone is not a semantic switch. Avoid hiding the real control in a way that removes keyboard access.

## Forms, persistence and pending states

For JSON settings, send an explicit boolean under a defined contract. Do not interpret an absent HTML form field as false unless the server contract deliberately specifies that behavior. Confirm form association, off/disabled submission, required validation and reset with the installed component; user-selection state and default/reset state can differ.

Keep initial loaded value, displayed pending intent and confirmed server value distinguishable. Announce meaningful saving/error outcomes without replacing the stable label. On request failure preserve useful recovery and focus. Ignore obsolete responses or serialize writes. A successful local toggle is not evidence of server persistence.

Browser operations retain session authentication and CSRF. Validate server values and permissions; toggling a disabled control through developer tools must not bypass checks. Do not add persistent settings or backend configuration merely because a switch example suggests them.

## Verification scenarios

Record actual runtime/package/browser and observed outcomes:

- Tap/click the control and linked label; one action per input and no overlapping targets.
- Use Tab/Shift+Tab, Space and supported Enter; focus remains visible and each activation toggles once.
- Check the accessible name stays constant while on/off changes; inspect role, state, descriptions, disabled behavior and decorative icons with a screen reader.
- Test both states, icon configurations and interaction states in light/dark themes, RTL, zoom, long labels and reduced motion.
- Check target area and explicit density/revert paths; do not require dragging.
- Test loading unknown values, failures/retry, rapid on/off writes and stale responses.
- Verify form off/disabled submission, required-on behavior, reset and explicit Save/Cancel where applicable.
- Confirm CSS stays within the plugin and server/CSRF authorization holds.

No browser, screen-reader or Nextcloud frontend integration is verified by creating this skill.
