# UI-10 integrated acceptance

## Scope — 2026-10-10

The user accepted installed 0.4.1 without observed errors and requested the remaining tasks. Complete the remaining UI-09 video checks and extend UI-10 integrated acceptance before starting Phase 4 temporary/public delivery. Tests use disposable accounts, session/CSRF endpoints and the installed Nextcloud shell. They must not mutate real users' data.

Automate real video metadata/playback/seek and authorized DAV Range behavior with generated short media fixtures. Exercise plugin accessibility-tree names, native modal focus containment, reduced motion, compact touch emulation, reflow and enlarged text in light/dark/RTL layouts. Check measured text color contrast against known opaque plugin surface roles. Record exactly which scenarios run; these checks are not a WCAG certification.

A desktop viewport narrowed to the CSS width corresponding to 200%/400% zoom tests reflow equivalence, not the browser's zoom setting. Touch emulation does not establish physical touchscreen or virtual-keyboard behavior. Keep the in-scope manual checks explicitly pending where hardware/software is unavailable.

No original-file delete/move/rename functionality is added. Upload fixtures may create originals only in the disposable account; test cleanup deletes that account. Session DAV playback is distinct from Phase 4 external/signed streaming and abuse controls. Any discovered UI correction must use project Material skills, retain the host shell and receive its own regression and versioned deployment.

## Acceptance scope decision — 2026-10-10

At the user's request, actual screen-reader testing is out of scope for UI-10 and is not a release gate. This supersedes historical notes listing it as pending; it does not record a passed test. Retain accessible names, keyboard/focus behavior and existing accessibility-tree assertions. Physical mobile/keyboard testing, actual browser zoom and contrast across all visual states remain required.

## Executed checks

- Installed 0.4.1 Phase 3 HTTP suite: **130 checks passed**, including bucket clear/rename/remove, concurrent create/remove and token/lifecycle boundaries. Both disposable accounts and their originals were cleaned up.
- Focused installed browser acceptance: **49 checks passed** with actual MP4/H.264 and WebM/VP9 upload, metadata, native playback, seek and session DAV byte-range behavior. This count includes the harness version assertion. Synthetic clips have no audio; audio/more codecs are not covered.
- Accessibility-tree names and modal background exclusion passed. Chromium returns BODY as a noninteractive focus sentinel while tabbing; no underlying control is allowed to take focus. Escape is tested from inside the modal, and focus return waits for the native close event.
- Measured opaque theme text pairs pass 4.5:1 in both themes. Reflow equivalents at 640x450 and 320x600, compact RTL, enlarged upload body/heading/action/input text and reduced-motion toolbar behavior pass. Emulated touch opens Add and initiates upload.
- No production correction was needed. Source/runtime version remains 0.4.1; this slice adds tests and documentation.

## Manual acceptance still pending

| Environment | Checks | Evidence required |
| --- | --- | --- |
| Physical mobile device | Drawer/menu gestures, row and independent checkbox/info targets, file chooser/upload, native player and scrolling | Device/browser and results; emulated touch is insufficient |
| Physical keyboard and mobile virtual keyboard | Check Tab/Shift+Tab, Enter/Space, Escape and focus return with a physical keyboard; focus mobile form inputs, rotate, keep active field and Cancel/Save reachable, close the virtual keyboard without losing draft | Device/browser, keyboard and viewport observations |
| Real browser zoom/text settings | 200% and 400% zoom, enlarged default fonts, long labels, all forms and token rows | Actual zoom settings and screenshots without credentials/secrets |
| Complete visual-state contrast | Hover, pressed, focus outlines, invalid/disabled states, preview overlays and every background | Measured final composited color pairs, not only theme token ratios |

No physical mobile/keyboard acceptance was performed. Do not mark these rows passed based on the automated suite. Phase 4 temporary access/streaming protections remain separate planned stories.

Final combined acceptance: **305 actual-Nextcloud browser checks passed**, using installed 0.4.1 assets, cache enabled, no asset interception, including the new UI-10/video checks. The dedicated account and generated originals were removed. No production change/deployment was needed. Phase 3 HTTP acceptance separately passed 130 checks.
