# Architecture Decisions

## ADR-001: Native app and platform ownership

Accepted design, 2026-10-09. Use Nextcloud public APIs, app-owned metadata tables and existing authentication. No direct data-directory access, external database/ORM, or core changes. Consequence: target release API verification is required before implementation.

## ADR-002: Virtual references preserve physical files

Accepted design. Parent-child node identity is independent of physical storage and path. Reference deletion and virtual movement never mutate physical files. Explicit rebind handles recovery. Consequence: broken bindings are visible errors and virtual renames can break published path URLs.

## ADR-003: Verify support before declaring it

Accepted workflow. Verify the concrete target and record actual evidence before declaring support. The initial environment is now tested at Nextcloud 34.0.4 / PHP 8.4.26 / Snap MySQL; other deployment providers and release versions remain unverified.

## ADR-004: App-scoped Material UI

Accepted user direction, 2026-10-09. Use Material Design 3 within the plugin area and preserve Nextcloud's outer UI. Use target-compatible Vue and evaluate @material/web APIs against the installed package. Prefer the provided navigation drawer skill for bucket destinations. Scope tokens/CSS to the app, bundle assets locally, and verify CSP/accessibility and real modal behavior. Component skills are design guidance, not proof of tested frontend integration.

## ADR-005: Bucket separation

Requirement accepted; architecture pending, 2026-10-09. The user requires buckets in addition to virtual folders. Virtual namespaces versus real S3/MinIO buckets remains unanswered. Do not infer a storage-engine change. Resolve semantics and document populated upgrade, API/token boundaries, paths, and virtual-only deletion before persistence implementation. See the agent handoff.


## ADR-006: Responsive explorer composition

Proposed design, 2026-10-09, based on the user's MinIO-like layout and Material styling direction. Measure available plugin width, retain drawer-based navigation, adapt column metadata to compact rows, and use a nonmodal detail view/pane. Begin with the existing owner-root Library when bucket semantics remain unresolved. See [responsive design](../design/responsive-plugin.md) and [UI tasks](../agile/ui-tasks.md). The standalone study verifies sample interactions only; production component, CSP and host modal behavior require real integration checks. No schema, storage or API contract changes are made by this proposal.


## ADR-007: Reference-only clipboard and contextual actions

Accepted user semantics, 2026-10-09: Move/Rename/Copy/Paste/Remove operate on plugin virtual nodes and links only, preserving Nextcloud file names, placement and bytes. Multiple independently named references may bind the same original. Existing move/rename/remove and multiple binding support align with this requirement; dedicated copy/paste behavior is not implemented. Backend clone API/transaction/token details remain pending. UI will use a creation FAB, contextual toolbar and tooltips with separate overlay ownership; see [action requirements](../design/reference-actions.md). The user confirmed md3-extended-fab as the intended skill. This is a documentation-first record; production implementation remains pending.


## ADR-008: Approved virtual bucket and production frontend direction

Accepted 2026-10-09. The user explicitly confirmed virtual buckets, superseding ADR-005 pending semantics. Preserve the existing root as default Library; additional bucket roots are separate virtual trees. Implement session-backed Vue/Material explorer with locally bundled assets, no storage engine changes. See 08-production-explorer.md for populated upgrade, token/path and reference-copy contracts.
