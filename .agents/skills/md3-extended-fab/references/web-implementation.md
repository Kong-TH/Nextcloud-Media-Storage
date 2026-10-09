# Web API cross-check

Official implementation reference: https://material-web.dev/components/fab/ (checked 2026-10-09). Verify the installed version before relying on these APIs.

```js
import '@material/web/fab/fab.js';
```

```html
<md-fab label="Upload" variant="primary">
  <svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M11 16h2V7l3 3 1.4-1.4L12 3.2 6.6 8.6 8 10l3-3zM5 18v3h14v-3h-2v1H7v-1z"/>
  </svg>
</md-fab>
```

The label extends md-fab; no separate md-extended-fab element is needed. Connect a real handler before calling the UI functional. Labeled form can omit the icon. Icon-only form requires aria-label.

The baseline API exposes size small/medium/large, variant surface/primary/secondary/tertiary, and lowered elevation. These do not establish Expressive extended-size parity. Import only used modules.

Customize through documented tokens such as --md-fab-container-color, --md-fab-container-shape, and --md-fab-label-text-font. Scope them to the plugin. Do not manipulate private shadow internals. Host layout, focus-preserving responsive transitions, collision handling, and request lifecycle remain application responsibilities. Test those in the actual Nextcloud viewport; documentation validation does not prove rendered behavior.
