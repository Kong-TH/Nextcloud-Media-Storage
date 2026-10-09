# Project Requirements

Baseline: local `.chat/prompt1.md`, read 2026-10-09. All requirements remain planned unless implementation and validation evidence explicitly say otherwise.

## Functional requirements

R01 Native app ID `mediastorage`, compatible with the installed Nextcloud release, using public App Framework/DI APIs.
R02 Owner-scoped stable virtual nodes, parent-child hierarchy, create/nested create/list/search/resolve/rename/move/delete, duplicate/cycle/traversal prevention.
R03 Node API storage integration, upload and existing-file binding, metadata, replacement, permission checks, missing-binding recovery and multiple references per file. Virtual mutations preserve physical files.
R04 Reuse Nextcloud database/migrations; own tables, portable queries, transactions and constraints; no media blobs or plaintext token secrets.
R05 Generated virtual-path URLs through supported routing, optional clean proxy URLs, documented rename/move consequences and future alias extension.
R06 Versioned APIs with secure server-to-server tokens, at least 256-bit entropy, scopes, optional folder restrictions, expiry/revocation/rotation and one-time display.
R07 Browser proxy or resource-specific expiring read URLs; bounded lifetime, tamper protection and documented reuse/revocation behavior.
R08 Advisory domain/Fetch Metadata filtering plus real authorization; per-token/IP throttling, bounded requests, practical concurrency limits and redacted logs.
R09 Efficient streaming with correct MIME/length, GET/HEAD, ETag/Last-Modified, conditional requests, ranges/206/416 and authorization-aware private caching.
R10 Nextcloud-integrated responsive Vue explorer, breadcrumbs, folder actions, upload/bind/rebind, metadata, media previews, URL copying, search and access status.
R11 Token and policy interfaces for expiry/scopes/revocation, domains, signed URL settings, throttling and API restrictions.
R12 Explicit authorization, CSRF, path/name/upload/MIME validation, safe errors, SQL safety, owner isolation and no unrestricted physical deletion.
R13 Automated unit/security/integration/migration tests with actual database and Nextcloud evidence; do not equate hotlink heuristics with authorization.
R14 Public distribution docs, installation/configuration/development/API/security/troubleshooting/test guidance, proxy examples, contribution/security policies and license guidance; no invented authors or untested support claims.

## Traceability

R01–R04: Sprint 01, US-MS-01–03 and architecture/schema/system design. R05–R06: Phases 2–3 and API/security design. R07–R09: Phase 4 and proxy/testing design. R10–R11: Phase 3–4 and user guide. R12–R14: All phases, with release verification in Phase 5.
