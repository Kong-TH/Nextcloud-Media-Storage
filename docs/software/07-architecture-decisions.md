# Architecture Decisions

## ADR-001: Native app and platform ownership

Accepted design, 2026-10-09. Use Nextcloud public APIs, app-owned metadata tables and existing authentication. No direct data-directory access, external database/ORM, or core changes. Consequence: target release API verification is required before implementation.

## ADR-002: Virtual references preserve physical files

Accepted design. Parent-child node identity is independent of physical storage and path. Reference deletion and virtual movement never mutate physical files. Explicit rebind handles recovery. Consequence: broken bindings are visible errors and virtual renames can break published path URLs.

## ADR-003: Verify support before declaring it

Accepted workflow. Installed release and test environment are unknown. Compatibility and test outcomes remain explicitly unverified. Phase 1 implementation follows target identification; documentation setup is complete first.
