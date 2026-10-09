---
name: md3-text-field
description: Design, implement, or review Material Design 3 filled and outlined text fields on the web with @material/web. Use for labeled form inputs, textareas, supporting/error text, counters, prefixes/suffixes, read-only values and field actions. Cover validation, keyboard/screen-reader access and form integration; complete search experiences, selection popups and dialogs need their own pattern guidance.
---

# Material Design 3 text fields

Use a text field for text entry. Filled and outlined variants provide the same functionality; choose emphasis and fit with surrounding content. Keep one variant per coherent form region. A styled input does not implement autocomplete, a picker or a search experience by itself.

## Workflow

Identify the value, input type, label, required/optional status, valid format, length unit, commit boundary and server errors. Read [design-and-specs.md](references/design-and-specs.md) for variants, measurements and do/don't rules. Read [web-and-accessibility.md](references/web-and-accessibility.md) for installed APIs, validation, naming and verification. [sources.md](references/sources.md) records provenance, source conflicts and missing token values. Original Downloads files are not needed to use this skill.

## Essential constraints

- Every field needs a visible label, inside the field or adjacent. Keep internal labels short, untruncated and single-line. A disappearing placeholder is not a persistent label.
- Do not intermix filled and outlined fields next to one another in the same form region. Distinct sections may use different variants consistently.
- Use a single line for short values and a textarea for long web responses. Preserve caret, selection, native editing, IME and paste behavior.
- Indicate all required fields consistently and explain the asterisk. Programmatic required state must agree with the visible indicator.
- Replace supporting text with a concise actionable error instead of stacking another unplanned line. Allow wrapped errors with enough space; do not clip recovery instructions.
- Do not rely only on red. Provide error text and a secondary cue; a noninteractive error icon is not a button.
- Read-only and disabled are different states. Read-only values should remain understandable and available for appropriate copying.
- Do not apply density by default or shrink actionable icons below useful targets.
- Validate length using the backend's actual unit. A UI character counter cannot silently stand in for a UTF-8 byte limit.

## Nextcloud boundary

Scope Material tokens/CSS to plugin content and preserve the Nextcloud shell. Inspect Vue custom-element configuration, property binding and event handling; bundle locally under CSP. Use authenticated session/CSRF-aware calls and server authorization. Keep form drafts after recoverable failures and prevent stale async validation from overwriting newer input.

For one-time token secrets, do not persist or log them through form state, analytics or browser storage. Do not promise nonexistent bucket naming rules, upload/policy configuration or delivery URLs. Use only implemented contracts.

Verify actual package/browser versions, form behavior, keyboard/screen-reader access, localization, RTL, zoom, themes and failure recovery. Skill validation alone does not verify rendering or integration.
