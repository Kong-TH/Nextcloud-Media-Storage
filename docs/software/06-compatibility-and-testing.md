# Compatibility and Testing

## Compatibility evidence

Installed Nextcloud: unknown. PHP and Composer: unavailable in current shell. Vue and Nextcloud Vue versions: not selected. Supported database matrix: none verified. No test results exist.

The [official developer manual](https://docs.nextcloud.com/server/stable/developer_manual/) was inspected on 2026-10-09. Its stable URL currently serves a version-labelled manual; this is not evidence of the user's installed release. Use version-pinned documentation and actual public interface source after the target is known.

## Required target inspection

On the authorized test instance, record `php occ status`, PHP version and app environment without exporting secrets. Inspect public Node API signatures, bootstrap/DI conventions, routes, security middleware, migration API and compatible frontend packages for that exact release. Then declare a narrow tested compatibility range in app metadata.

## Test plan

Unit tests: hierarchy/name validation, root uniqueness, move cycles, paths, owner isolation, reference-only deletion and missing/ambiguous bindings. Phase 2 adds token expiry/revocation/scopes, cross-user and folder-scope boundaries. Phase 4 adds signed URL tampering/expiry, domain advisory behavior, rate limits, HEAD, conditional requests, single ranges, unsatisfiable ranges and private caching.

Integration tests must install/upgrade migrations and exercise actual Filesystem APIs on a disposable Nextcloud instance. Include concurrent duplicate creates and moves, file deletion/recreation, cross-storage movement and explicit rebind. Run each claimed database backend separately, including SQLite if supported. Test efficient streaming on large media without full-file buffering and measure memory.

Record exact test commands once a runnable harness exists. Deferred integration tests must have executable fixtures and setup instructions; a test plan alone is not a test implementation. Release validation includes app enablement, Vue build, permission checks and installed package smoke tests.
