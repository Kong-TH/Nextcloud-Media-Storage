# Design, specs, and decisions

## Basic dialog

The supplied measurements describe a dynamic-height container, width 280–560dp, 28dp corners, 24dp outer padding, 24dp icon, 1dp divider, 8dp between buttons, 16dp title/body and icon/title gaps, and 24dp body/actions spacing. With an icon, the heading region is centered; without one it is start-aligned. Do not infer that all body content must be centered.

Map container to surface-container-high, title to on-surface, supporting text to on-surface-variant, icon to secondary, action emphasis to primary, and backdrop to scrim. Verify exact component tokens before overriding; saved interactive token tables do not expose full numeric values or scrim opacity. Use named logical CSS tokens for measurements without claiming physical equivalence between CSS pixels and Android dp.

Constrain sizing to the available viewport. A narrow viewport or enlarged text must not be forced to honor a 280px minimum if that causes clipping. Prefer short content, but allow body scrolling when necessary while keeping title/actions visible. Background content must not scroll together with the dialog.

## Full-screen task

The captured specs give square corners, a 56dp header, 24dp close icon, 1dp divider, a 56dp bottom action bar where used, 24dp top/side padding, and 8dp between elements. They also list “Container width; Max 560dp,” while Guidelines describe filling a compact screen. Treat this as a source-context constraint needing verification, not a reason to stretch a mobile full-screen pattern across desktop. The source provides no full-screen web API.

Use full-screen adaptation for complex compact-window tasks; medium and larger windows use a basic dialog per the supplied guideline. The close X is the task's navigation affordance, while Save/Create is a distinct confirmation. Longer translated headings may belong in content rather than a truncated app bar. Preserve task state when adapting layout.

## Action hierarchy and ordering

Use a maximum of two footer decision actions by default. One action is an acknowledgement; two are confirmation plus dismissal. Inputs, selections, and inline help are task content, not additional footer decisions. Prefer specific verbs over Done/OK for consequential operations.

Place actions at the logical trailing edge, with confirmation nearest the edge. In LTR, Cancel precedes Confirm horizontally; mirror for RTL. If labels require stacking, the captured guideline places confirmation above dismissal. Preserve intelligible visual and DOM order; do not use positive tabindex to fix layout.

Do not add a Learn more footer action that leaves the task unresolved. Put necessary information before entering, or reveal it inline. Avoid vague headlines, alarmist wording, and unnecessary apologies. Although the saved text permits title truncation, do not hide the essential consequence; shorten the title or move detail into the body.

## Validation and async decisions

The supplied basic-dialog guidance allows confirmation to be disabled until a required choice is made, but keeps dismissal enabled. Its full-screen guidance says not to disable confirmation: instead validate on submit and show all relevant field errors inline. Preserve this distinction rather than inventing one universal disabling rule.

Prevent unintended duplicate async work through an explicit pending guard. This is separate from validity-based disabling. Keep a dismissive path; if a request cannot be aborted, closing means leaving the view, not promising cancellation of server work. Decide how completion is communicated after dismissal. Never treat returnValue alone as successful persistence.

Field errors belong inline. A general network/save error may justify a basic dialog over a full-screen task according to the supplied guidance; avoid piling another basic modal on an already-basic dialog. Keep the original data and offer a clear retry path.

Confirm discarding genuinely unsaved changes when leaving a full-screen task. Do not prompt for discard on an unchanged form. Returning from the discard confirmation should restore focus and state. Do not add a second confirmation after the user has already deliberately confirmed Save/Create.

## Placement and motion

Basic dialogs center by default; larger windows may use ergonomic custom positioning without edge collisions. The desktop example describes a 56dp edge margin; do not apply it rigidly to compact windows. A dialog must remain visible and unobscured.

Use restrained enter/exit transitions and respect reduced motion. Container transforms are a design option, not proof of library support; no exact animation timing is available from the saved text. Nested overlays are exceptional, not a general dialog navigation system.
