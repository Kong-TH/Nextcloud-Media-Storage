# Sprint 03: Buckets and Material Explorer

Status: Planned; responsive design study prepared, no bucket or production frontend implementation yet. Phase 2 is verified on the local Nextcloud 34.0.4 / Snap MySQL environment. See [agent handoff](../../agent-handoff.md) for current decisions and execution context.

## Scope and dependency

The user added bucket separation and app-scoped Material UI. Virtual bucket versus real S3/MinIO semantics remain unanswered. Resolve that storage-model question before persistence/migration code; independent frontend setup may proceed. The proposed virtual owner/bucket/folder/reference hierarchy is not accepted yet.

## Work packages

1. US-MS-09: define and implement approved buckets, owner isolation, migration of existing roots/data, API/token compatibility and regression checks.
2. US-MS-05: Vue/Material build; app-scoped theme; bucket drawer; breadcrumb/object list; folder operations; binding/rebind; upload; previews; token dashboard.
3. Update architecture/schema/API/security and operations docs before dependent changes, then record actual checks as each slice completes.

## Acceptance gates

- Populated 0.2 upgrade preserves nodes, bindings, physical files and intended token access; invalid cross-owner/cross-bucket access is denied under concurrent changes.
- Real session/CSRF-backed operations work without manually entering full paths; primary/secondary/selection actions do not conflict.
- Drawer, dialogs, focus return, keyboard, RTL, narrow layouts, both themes and reduced motion are checked in the actual Nextcloud host.
- No CSS/theme changes spill into the Nextcloud shell. True browser-modal behavior and scrim scope are verified, not inferred from scoped CSS.
- Upload validates permission, MIME and size using supported APIs. Missing bindings have an explicit recovery path.
- Token issue shows secrets once; no long-lived external token in browser persistence/logs.
- URL copying never advertises nonexistent delivery/security guarantees; signed access and streaming remain Phase 4.

No deadline, implementation owner, new app version, or tested dependency version is assigned by this document. Keep deployment and test claims tied to recorded execution.

## Design preparation

2026-10-09: Added [md3-menu](../../../.agents/skills/md3-menu/SKILL.md) with design/specification, web/accessibility and source references after studying the supplied Overview, Specs, Guidelines and Accessibility captures. Baseline versus Expressive web limits and keyboard-guidance conflicts are explicit. No UI implementation or browser verification is included.

2026-10-09: Added [md3-radio](../../../.agents/skills/md3-radio/SKILL.md) after studying the supplied radio captures and checking Material Web/WAI-ARIA. References cover sizing, labels, do/don't, default versus unanswered states, density, form and async behavior, and source limitations (duplicate Specs, missing Overview). Skill validation passed; UI implementation and browser checks remain pending.

2026-10-09: Added [md3-search](../../../.agents/skills/md3-search/SKILL.md) after studying all four supplied Search pages and checking Material Web/WAI-ARIA. References distinguish design from unavailable web implementation, document ambiguous measurements, and cover async queries, accessible suggestions/results and the existing server search contract. Skill validation passed; UI and browser checks remain pending.

2026-10-09: Added [md3-switch](../../../.agents/skills/md3-switch/SKILL.md) after studying supplied Overview, Specs and duplicate Accessibility captures and checking Material Web/WAI-ARIA. References cover binary settings, stable naming, size/state rules, form and async persistence, and label/event documentation caveats. Missing Guidelines content is explicit. Skill validation passed; UI/browser checks remain pending.

2026-10-09: Added [md3-text-field](../../../.agents/skills/md3-text-field/SKILL.md) after studying all four supplied pages and checking Material Web/WAI. References cover variant consistency, measurements, labels, required/error feedback, textareas, affixes, readonly behavior, form validation and actual UTF-8 byte limits. Source/API caveats are explicit. Skill validation passed; UI/browser checks remain pending.

2026-10-09: Added [md3-toolbar](../../../.agents/skills/md3-toolbar/SKILL.md) after studying all four supplied pages, inspecting specification images and checking Material Web/WAI-ARIA. References cover docked/floating geometry, emphasis, overflow, FAB pairing, responsive behavior and composite keyboard focus. Web placement exceptions, conflicting keyboard guidance and unavailable web implementation are explicit. Skill validation passed; UI/browser checks remain pending.

2026-10-09: Added [md3-tooltip](../../../.agents/skills/md3-tooltip/SKILL.md) after studying all four supplied pages, both measurement images and Material Web/WAI guidance. References cover plain/rich variants, placement, timing, accessible names, hover/focus persistence and interactive popup semantics. Missing web implementation and Material/APG differences are explicit. Skill validation passed; UI/browser checks remain pending.


2026-10-09: Prepared the [responsive plugin design](../../design/responsive-plugin.md), standalone interactive prototype and [UI task backlog](../ui-tasks.md). Mobile uses a compact drawer and supporting-text object rows; desktop retains a standard drawer and optional details pane. Standalone Chrome checks passed at 320–1440px viewports; see [validation](../../design/validation.md). Production Vue/API integration and bucket semantics remain pending.


2026-10-09: Refined the UI study after user feedback: Add from Nextcloud label explains reference creation; local licensed Google Material Symbols replace placeholder glyphs; Sort by width/padding and search-arrow spacing were increased. Standalone Chrome checks and snapshots refreshed; production UI remains pending.


2026-10-09: Documented the user's reference-only Move/Rename/Copy/Paste/Remove semantics, creation FAB, contextual toolbar, tooltip/menu regression requirements and desktop small-text increase **before code changes**. See [reference actions](../../design/reference-actions.md). The user corrected the skill name and confirmed md3-extended-fab before prototype work. Copy/Paste backend contract remains pending; no new UI/server test evidence is claimed.


2026-10-09: Completed the standalone action prototype using confirmed md3-extended-fab plus menu/toolbar/tooltip guidance. Add FAB combines creation entries; contextual toolbar/clipboard models reference-only Copy/Paste/Rename/Move/Remove; desktop small text increased and scroll clearance prevents FAB/list overlap. Sample model checks and 71 Chrome checks passed, including tooltip/menu ownership, keyboard/focus and narrow toolbar fit. See [evidence](../../design/validation.md). No production frontend/backend Copy/Paste implementation or server tests are claimed.


2026-10-09: Refined the standalone layout after annotated screenshot feedback. One local title/search navbar replaces repeated heading layers; breadcrumbs appear only inside folders. Symmetric scrollbar gutters balance horizontal padding, a bottom-aligned footer replaces fixed bottom padding, and desktop FAB inset increases to 29px while compact remains 24px. Requirements were documented before code. 165 Chrome checks passed, including the supplied image dimensions and short-height states; see [validation](../../design/validation.md). No production deployment or backend change.


2026-10-09: Applied the user's bottom-toolbar correction after documenting it. Contextual actions now float in the existing bottom FAB band; selection/clipboard counts move beside the object count. Selection preserves the list's height and first-row position. 201 standalone Chrome checks passed, including short-height selection, last-row clearance, reduced motion and existing menu/tooltip/reference regressions. Desktop and compact screenshots were visually reviewed. Production integration remains pending.


2026-10-09: Applied the user's compact FAB/toolbar pairing correction after documenting it. Below 1200px, toolbar floats above an icon-only Add FAB; expand-more opens overflow. FAB menu overlays toolbar while preserving context until an Add entry is invoked. Both Add entries clear selection/clipboard; task cancellation keeps it cleared. 252 standalone Chrome checks passed, including menu hit testing, Escape/outside preservation, stack/scroll/focus clearance, resize/RTL and existing regressions. Updated paired-action/menu snapshots; production integration remains pending.


2026-10-09: Applied the user's separate-cancel correction after documenting it. Rounded toolbar now contains reference commands only; a separate trailing 56px tonal X surface with 8px gap replaces inline Clear selection and all Clear clipboard duplicates. It clears selection/clipboard together, hides contextual actions and restores Add focus, including clipboard-only state. 292 Chrome checks passed, including three context modes at desktop/compact/short sizes, geometry, unchanged references, Tab/Enter/Space and RTL; snapshots refreshed and inspected. Production integration remains pending.


2026-10-09: Documented and implemented compact action-group width matching FAB insets and the missing + Add bucket entry. Bucket creation is sample-only with empty/duplicate validation, selected empty destination and compact task/drawer focus restoration. 304 Chrome checks passed; desktop, compact toolbar and bucket dialog snapshots were visually inspected. Production bucket semantics/persistence remain unresolved; no backend changes.


2026-10-09: Replaced fixed toolbar action hiding with measured adaptive packing after documenting the requirement. Five icon commands fit at 390px; narrower sizes reserve overflow for exactly hidden commands, retaining 48px targets. Resize/font/group updates preserve focus and stable menus, with labels restored when space permits. 333 Chrome checks passed, including a continuous compact sweep, long labels and focus/menu resize regressions. Updated mobile snapshot visually inspected; production integration remains pending.


2026-10-09: Latest user correction makes FAB/toolbar mutually exclusive at every width, superseding compact stacking. Toolbar returns to the existing bottom band with full mobile width/adaptive packing; X clears context and restores Add. 332 Chrome checks passed including clipboard-only exclusion, resize/RTL and both Add entries after cancellation. Snapshots refreshed; mobile visually inspected. No backend changes or production integration.


2026-10-09: Documented and corrected desktop creation-menu alignment. Intrinsic width removes position-dependent sizing; the menu aligns with FAB trailing edge, including RTL, while compact layout and narrow viewport clamping remain intact. 365 Chrome checks passed, including initial/repeated open and live resize. Desktop/mobile menu snapshots visually inspected; standalone study only.


2026-10-09: Documented and implemented full-row primary hit area and hover/press/focus feedback, replacing the name-only pill. Checkbox/info remain independent native controls. 383 Chrome checks passed including desktop/mobile whitespace activation, selection/info isolation, keyboard focus and RTL/dark theme. Mobile screenshot inspected; standalone study only.
