---
name: md3-dialog
description: Design, implement, or review Material Design 3 dialogs on the web with @material/web. Use for important confirmations, focused modal tasks, basic/full-screen adaptation, unsaved-change flows, and accessible dialog focus and dismissal. Routine notifications, dropdown menus, and persistent side panels are separate patterns.
---

# Material Design 3 dialogs

A dialog deliberately interrupts a flow to complete one task or obtain an important decision. Use it sparingly. Routine status belongs in an inline message or snackbar; a menu is better for ordinary choices that do not warrant blocking the task.

## Choose the task and variant

Basic dialogs suit short confirmations, alerts, and quick selections. Full-screen designs suit compact-window tasks with multiple inputs or unsaved work; adapt to a basic dialog at larger widths. Do not turn every form or failure into a modal.

State the actual consequence in the title and action: Remove reference, Revoke token, or Discard changes. Avoid vague “Are you sure?” titles and generic confirmation labels when a specific verb is clearer. One acknowledgement or a confirm/dismiss pair is the default; do not add a third action that takes the user away mid-task.

Read [design-and-specs.md](references/design-and-specs.md) for sizing, actions, adaptive behavior, and do/don't rules. Read [web-and-accessibility.md](references/web-and-accessibility.md) when implementing focus, form handling, or async work. [sources.md](references/sources.md) records the supplied file mismatch and missing Accessibility capture.

## Essential workflow

- Identify what the user must decide and whether blocking interaction is justified.
- Inspect the installed @material/web version and existing host dialog/request conventions before choosing APIs.
- Define confirmation, cancellation, Escape, scrim click, dirty state, pending state, and failure behavior before wiring handlers. Cancellation must not execute the confirm action.
- Build the appropriate variant with a readable title, concise content, and reachable actions. Make error recovery part of the same task.
- Test the actual opening, submission, dismissal, focus return, keyboard operation, viewport adaptation, and error paths. Report any untested behaviors explicitly.

## Do

- Explain the specific scope and consequences before confirmation.
- Keep title and actions reachable when the body scrolls.
- Keep a clear dismissive path; distinguish leaving a task from undoing a request already sent.
- Show field errors next to their fields and preserve entered data after failures.
- Preserve a useful accessible name, visible focus, trapped modal focus, and sensible focus restoration.

## Don't

- Do not use dialogs for routine success messages or low-priority information.
- Do not disable Cancel merely because a required field is invalid.
- Do not close immediately on async submit and imply success before the server responds.
- Do not stack ordinary basic dialogs. The supplied design permits a basic confirmation/error dialog over a full-screen task; keep nesting exceptional and restore focus correctly.
- Do not assume native HTMLDialogElement APIs, framework event forwarding, or full-screen variants exist unchanged on md-dialog.

## Nextcloud boundary

Apply Material styling to plugin-owned content, not the surrounding Nextcloud shell. A true web modal may render in the browser top layer and block the document including the shell; do not claim scoped CSS confines its modality or scrim to the plugin. Verify host behavior. If the requirement is to keep Nextcloud navigation interactive, choose a non-modal inline/task panel rather than weakening modal semantics.

Use existing session/CSRF-aware calls. A confirmation is not authorization. Removing a virtual reference must not be labeled Delete physical file; bucket and token consequences must match the implemented backend. This skill does not authorize new destructive behavior.
