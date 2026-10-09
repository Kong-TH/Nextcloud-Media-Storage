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
