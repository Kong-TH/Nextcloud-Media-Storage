# Web composition and accessibility

## Semantics

The [WAI-ARIA APG tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) is marked work in progress without task-force consensus. It describes a nonfocusable role=tooltip container referenced by the trigger's aria-describedby. Focus stays on the trigger; Escape dismisses. Hover remains active over either trigger or tooltip. Focusable popup content instead needs a nonmodal dialog pattern. Do not apply tooltip semantics to interactive rich content simply because Material calls it a tooltip.

Name icon controls using their supported label API or aria-label/aria-labelledby. A tooltip description supplements that name; it must not be the only available name. Avoid redundant spoken name/description pairs when text is identical. Preserve existing description IDs and test whether the chosen custom control forwards them. Do not add aria-haspopup=menu or aria-expanded to a plain tooltip as though it were an action menu. Avoid using title as the sole help or accessible naming mechanism.

For rich content with links/buttons, use an explicitly activated, appropriately named nonmodal popup. Select semantics according to its actual content; a nonmodal dialog can fit a coherent interactive task. Associate the trigger with the popup and expose open state using the selected pattern. Keep controls in a logical reading/tab order after the trigger; visual portals must not strand them at the document end. Enter/Space activate native controls. Keep ordinary forward/backward traversal available; no focus trap or aria-modal=true. If interaction deliberately moves focus inside, return it to the trigger on close when still available. A noninteractive rich explanation can retain tooltip semantics.

## Hover, focus and timing

[WCAG 2.2 SC 1.4.13 guidance](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) explains dismissible, hoverable and persistent additional content. Users must be able to move the pointer onto hover content. Keep it until relevant hover/focus ends, explicit dismissal, or invalidation; do not expire it while being read. Dismissal without moving hover/focus is required when it obscures meaningful content, subject to the criterion's exceptions. Escape is a useful mechanism. The Understanding document is informative guidance.

Track pointer and focus independently: pointer exit must not hide a focus-triggered message, and blur must not hide content still hovered. A safe travel corridor or exit delay must cover the gap between trigger and popup. Do not use pointer-events:none on hoverable content. After Escape, suppress immediate reopening from the same still-active trigger until a fresh interaction. Coordinate one active tooltip across repeated rows without assigning duplicate IDs.

Native disabled buttons cannot normally receive keyboard focus. Put essential unavailability reasons in visible text or an accessible alternative rather than relying on their hover. Avoid adding arbitrary focusable wrappers to every disabled button. Long press is supplementary; optional rich help can use an explicitly labeled information control for touch and keyboard.

## Implementation and review

Use locally bundled supported controls and app-owned overlay behavior; no assumed Material Web tooltip API. Keep positioning synchronized with scrolling, resizing, RTL, zoom and anchor removal. Honor reduced motion, retain readable contrast in both themes, and avoid external scripts under Nextcloud CSP. Async rerenders must not leave stale descriptions or focus on removed nodes.

Verify real outcomes: icon name without opening the popup; announcement of supplementary text; focus open/blur; Escape without focus movement and without instant reopen; pointer travel and long reading; rich link/button traversal and close/return; touch primary action; disabled explanations; overflow/clipping near all edges; localization, zoom, both themes and host shell isolation. Do not claim screen-reader/browser checks from static markup review.
