# Source mapping and limits

Read the user's /home/kong/Downloads/knowlages/list HTML on 2026-10-09. This skill contains focused paraphrases and original web integration guidance. It neither executes saved scripts nor depends on Downloads at runtime.

| Saved HTML | Actual captured page | Coverage |
|---|---|---|
| Lists – Material Design 3.html | https://m3.material.io/components/lists/specs | Baseline/Expressive configuration, anatomy, tokens, measurement table |
| Lists – Material Design 3-2.html | https://m3.material.io/components/lists/specs | Duplicate Specs coverage, not Overview |
| Lists – Material Design 3-3.html | https://m3.material.io/components/lists/guidelines | Scanning, control placement, modes, responsive layout, behavior |
| Lists – Material Design 3-4.html | https://m3.material.io/components/lists/accessibility | Selection cues, keyboard/focus, mode-specific web and native-platform roles |

There is no separately captured Overview page. Interactive tables and measurement figures do not expose all numeric sizes in extracted text; verify original figures/current official tokens for exact-fidelity work.

Implementation cross-check: https://material-web.dev/components/list/. Baseline APIs are distinct from newer design guidance. Design-kit slots are not literal component slot names. Single-action, multi-action, and selection patterns have different semantics; avoid assuming the library supplies complete keyboard and selection behavior for all of them.

The source distinguishes web listbox/option selection roles from Android checkbox/radio roles and limits swipe-to-reveal to Android Views. Supplemental native form-control alternatives and HTML nesting advice are web implementation guidance, not claims of Expressive API support.
