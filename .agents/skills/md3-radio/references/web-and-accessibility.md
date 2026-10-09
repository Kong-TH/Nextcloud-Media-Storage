# Web implementation and accessibility

## Material Web

Inspect the installed version before coding. Upstream md-radio groups by name, uses value for submission and checked for selection, and exposes disabled/required plus validity methods. Use unique IDs with external label-for association; the guide warns against wrapping md-radio inside a label because group counts can be misannounced. It also records a label-accessibility issue requiring aria-label even with a linked label: provide a matching translated accessible name and verify the installed version's tree. Do not assume that warning applies to native HTML radios. Named radiogroup containers are documented. Available tokens include --md-radio-icon-color, --md-radio-selected-icon-color and --md-radio-icon-size. User change events are documented; validate framework handling and form/reset behavior. [Material Web radio guide](https://github.com/material-components/material-web/blob/main/docs/components/radio.md)

Ensure independent groups do not accidentally share a name in the same form context. Use stable distinct values, not translated labels as persistence keys. Synchronize a single application value with checked properties; do not maintain independent booleans that can select multiple radios. In Vue inspect custom-element registration, property binding and event propagation; do not assume v-model or string-valued boolean attributes behave correctly.

Do not copy global :root theme examples into Nextcloud. Preserve targets outside the icon box. Native radios remain an alternative where appropriate; use native grouping/labels rather than rebuilding their behavior with generic divs. Do not add conflicting ARIA to components that already expose radio semantics.

## Keyboard and accessible tree

For ordinary groups, Tab/Shift+Tab enters and leaves the group; entry targets the checked item or an initial item if empty. Arrows move focus and selection with wrapping; Space selects without unchecking an already checked item. Native browsers can differ on reverse entry to empty groups. In toolbars, arrows navigate without necessarily changing selection; use the toolbar-specific model. Expose named radiogroup/radio semantics and checked state, with descriptions where needed. [WAI-ARIA radio pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)

The supplied Material Accessibility page specifically describes Shift+Tab entering on the last item when none is selected. Treat this as a documented native-style variation, not a reason to add competing keyboard handlers to the installed component. Do not give every radio a separate sequential tab stop or intercept Enter as a universal selection requirement.

Group names should match the visible category title; item names match their adjacent labels. Associate supporting/error text with the relevant group or item. Decorative icons must not create repeated labels. Verify that screen readers announce the name, role, selection and group context accurately.

Unavailable choices must not activate by icon, label or keyboard. Use the chosen component's disabled behavior, and explain unavailability where necessary. Do not copy the menu rule that disabled items must remain focusable onto radio groups. If an async refresh removes the focused option, restore meaningful focus and communicate the resulting value instead of leaving a hidden checked choice.

## Forms and async behavior

Distinguish required from optional groups; no selection must not silently submit the first value. Validate values on the server regardless of disabled/hidden UI. Check form association, submission, reset and initial persisted-value loading in the installed component. Present validation at the group, retain the draft and provide a clear recovery path.

Immediate writes need pending/error feedback and protection against stale responses when rapidly choosing A then B. Do not let an older A response overwrite the later B intent. Save/Cancel flows must preserve their explicit commit semantics. Selecting an option is not authorization to broaden data access.

## Verification

- Click/tap labels and icons; one selection per group, independent questions unchanged.
- Exercise empty/preselected groups, reselection, optional clearing and required validation.
- Test Tab/Shift+Tab entry/exit, wrapping arrows, Space, disabled options and any toolbar-specific behavior.
- Inspect screen-reader names, role, group context, selected state and error descriptions; test linked labels on the actual custom element.
- Submit/reset real forms; load saved values; test invalid/obsolete values and dynamic option removal.
- Exercise rapid selection, failed requests, pending state and Save/Cancel.
- Check 48px targets, zoom, long labels, RTL, both themes, visible focus and reduced motion inside Nextcloud.

Record actual results and remaining limits. No browser verification is established by writing this reference.
