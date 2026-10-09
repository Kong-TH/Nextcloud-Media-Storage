# Web implementation and accessibility

## Verified API surface

Reference: https://material-web.dev/components/list/ (checked 2026-10-09). Inspect the installed version.

```js
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
```

```html
<md-list aria-label="Folders">
  <md-list-item type="button">
    <div slot="headline">Artwork</div>
    <div slot="supporting-text">Project images</div>
  </md-list-item>
</md-list>
```

This structure needs a real handler. The documented types are text, button, and link; links use href. Slots include headline, supporting-text, trailing-supporting-text, start, and end. List exposes activateNextItem()/activatePreviousItem(); items expose disabled and request-activation. Verify actual keyboard behavior rather than assuming methods implement the full interaction model.

Documented styling includes --md-list-container-color, --md-list-item-container-shape, and label/supporting-text tokens. Do not infer selected, expanded, swipe, or Expressive attributes from the design spec. Scope theme overrides to the plugin.

## Semantics by mode

For simple reading content, prefer semantic ul/li when the custom component's focus model adds no benefit. For navigation use real links and normal Enter activation. Commands use button semantics and Enter/Space. Do not add role=listbox merely to obtain a highlighted navigation item.

For a true selection listbox, supply an accessible group label, option semantics, synchronized aria-selected, and aria-multiselectable when appropriate. Implement the relevant keyboard selection pattern, not just CSS. Options should not contain independently focusable checkboxes, links, or menu buttons. A visual selection mark may mirror state without becoming a second interactive control.

Alternatively, implement an explicitly labeled group of native radios or checkboxes when form-control semantics better fit the task. Identify this as that web pattern, not an automatic implementation of the captured listbox spec. Do not apply option and checkbox/radio semantics to the same control or create duplicate focus stops for one selection.

For multi-action rows, use a non-interactive row containing sibling primary and secondary controls. Do not nest a menu button inside a button/link surface or rely only on stopPropagation to correct invalid semantics. If the library cannot represent the required structure safely, use custom semantic HTML/CSS rather than forcing slotted actions into an unsuitable interactive host.

## Focus and keyboard

The saved Material guidance describes entry at the first eligible item, or selected item where applicable; arrows move through items and wrap at boundaries. Multi-action guidance describes arrows traversing individual actions and adjacent rows, with Tab entering/exiting the list. Treat this as a chosen composite keyboard pattern requiring explicit implementation and tests, not a property guaranteed by slots.

Keep an intentional focus model: roving tabindex with one composite entry point where appropriate, or normal native Tab order for a simpler list of links/controls. Do not combine half of each pattern or trap Tab indefinitely. Do not hijack arrows inside text fields or other controls that need them. Preserve native link Enter behavior rather than forcing Space to activate every anchor.

Test Shift+Tab, entry from both directions, disabled-item handling, boundary wrapping, secondary-control traversal, and focus recovery after deletion/filtering. Focused, activated, checked, and selected states must remain distinct. Do not select automatically on focus unless the chosen selection pattern deliberately requires it.

## Names, states, and checks

Use primary text and useful supporting context in accessible names; avoid excessive repetition from decorative thumbnails/icons. Name repeated secondary actions with item context, such as More actions for Artwork. Controls must remain reachable by keyboard and touch, not only on hover.

Use more than color for selection and keep programmatic state synchronized. Check contrast, visible focus, comfortable targets, 200% text scaling, RTL, long names, media failure, empty/error/loading states, and responsive detail navigation. Provide explicit accessible alternatives for any custom swipe/reorder action. Do not copy platform-specific gestures as the sole web access path.

Exercise primary and secondary actions independently so selecting never accidentally opens, opens never silently select, and one click never toggles twice through bubbled handlers. Document validation alone does not establish working keyboard behavior or screen-reader output.
