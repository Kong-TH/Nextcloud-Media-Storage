---
name: md3-radio
description: Design, implement, or review Material Design 3 radio buttons and single-choice groups on the web with @material/web. Cover labels, default/empty selection, sizing, keyboard and screen-reader access, form behavior and async updates. Use checkboxes for multiple choices, switches for independent on/off settings, and menu guidance for popup choices.
---

# Material Design 3 radio buttons

Use a radio group for mutually exclusive choices that should remain visible. Prefer five or fewer options in a vertical list. Every radio needs an adjacent descriptive label and the group needs a meaningful title.

## Workflow

Determine the choice, available values, initial value, whether an unanswered state is meaningful, and whether selection applies immediately or only on Save. Read [design-and-specs.md](references/design-and-specs.md) for requirements and prohibitions. Read [web-and-accessibility.md](references/web-and-accessibility.md) for implementation, keyboard, naming and verification. [sources.md](references/sources.md) records duplicated captures, conflicting initial-state guidance and missing token details. No original Downloads files are required to use this skill.

## Essential rules

- Only one option in a group can be selected. Different questions must remain independent groups.
- Do not nest radio groups or use radios for multiple selection. Use checkboxes for independent multiple choices and switches for an independent on/off setting.
- Prefer a vertical list; avoid horizontal layouts. Consider a selection dropdown when space or option count warrants it, accounting for the extra interaction cost.
- Make both label and icon select the option. Do not use icon-only radios or replace visible labels with tooltips.
- Prefer a meaningful safe default for ordinary settings. An unanswered form may start empty when choosing on the user's behalf would misrepresent intent. Document that exception rather than silently contradicting the default-selection guidance.
- Clicking an already selected radio does not clear it. If opting out is meaningful, provide an explicit None/Not applicable choice or a separate clear action with deliberate validation.
- Preserve the 48px target by default; the 20dp icon and 40dp state layer are not the full target.
- Focus, selection and disabled state are separate. Disabled UI must not be used as authorization.

## Project boundary

Keep styling and tokens inside plugin-owned content; preserve the Nextcloud shell. Inspect installed Vue/custom-element conventions and bundle locally under CSP. Use session/CSRF-aware calls; server-side validation must accept only supported values. Radio state must not imply that upload, delivery, policy or bucket functionality exists before its backend does.

For immediate settings, distinguish pending selection from confirmed saved state. Handle request failures and out-of-order responses without silently losing the user's choice or claiming success. For Save/Cancel tasks, hold a draft and persist only through the task's commit action. Do not trigger destructive work merely by navigating radio choices with arrow keys.

Record browser/package versions and actual keyboard, screen-reader, form, pointer/touch, zoom, RTL, theme and failure-path checks. Skill validation alone does not verify frontend rendering.
