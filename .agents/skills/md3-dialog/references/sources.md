# Sources and gaps

Read the user-provided /home/kong/Downloads/knowlages/dialogs HTML on 2026-10-09. This skill paraphrases relevant guidance without executing saved scripts or depending on local Downloads files.

| Saved file | Actual captured page | Use |
|---|---|---|
| Dialogs – Material Design 3.html | https://m3.material.io/components/dialogs/overview | Purpose, variants, single-task focus, web availability |
| Dialogs – Material Design 3-2.html | https://m3.material.io/components/dialogs/specs | Anatomy, roles, basic and full-screen measurements |
| Dialogs – Material Design 3-3.html | https://m3.material.io/components/dialogs/guidelines | Usage, actions, validation distinctions, unsaved work, adaptive behavior, scrolling |
| Dialogs – Material Design 3-4.html | https://m3.material.io/components/divider/specs | Mislabeled unrelated capture; excluded from dialog guidance |

No Dialog Accessibility page was supplied. Supplementary modal checks are explicitly identified as web guidance. Official implementation documentation checked: https://material-web.dev/components/dialog/.

Interactive token tables expose headings without complete values. Do not invent missing opacity, elevation, or motion tokens. Full-screen width wording in Specs should be interpreted alongside compact-only Guidelines rather than applied indiscriminately. Validity-based confirmation disabling differs between basic and full-screen guidance; duplicate-submit prevention is a separate implementation concern.

The browser modal's scope and top layer are not controlled merely by nesting it under plugin CSS. Verify host integration rather than promising that a true modal blocks only the plugin.
