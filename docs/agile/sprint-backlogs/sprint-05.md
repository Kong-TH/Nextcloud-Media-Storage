# Sprint 05 — Release readiness

Status: US-MS-08 packaging slice in progress, 2026-10-10. US-MS-07 installed acceptance remains open in Sprint 04. No release publication is authorized by this work.

## Implemented and locally verified

`npm run package` builds frontend assets/notices and records source/output hashes, then emits an unsigned deterministic 0.6.0 archive and checksum. The artifact has one `mediastorage/` root, 52 runtime/manifest files and no development/private directories. `python3 tests/package_release.py` passes 66 checks: every manifest digest, archive checksum, normalized safe members, runtime input inclusion, repeat-build identity, version/source/asset mismatch rejection before output creation and file/directory symlink rejection. Metadata template is synchronized to 0.6.0 so rerunning identity configuration does not revert the version. Composer test commands now include streaming/protection tests.

This establishes local archive generation and validation only. It does not establish installation from the exact archive, app-store signature, vulnerability certification, compatibility beyond the recorded target, database restore or proxy behavior.

## Open acceptance gates

| Gate | Evidence/status |
| --- | --- |
| US-MS-07 installed HTTP / player / parallel stream / policy acceptance | 0.6.0 observed on authenticated app page after user rebuild; installed acceptance suites still pending |
| Install exact archive, upgrade populated data and compare installed bytes | Pending on a disposable target; workspace Snap deploy is a different path |
| Database/version matrix | Actual target: Nextcloud 34.0.4 / PHP 8.4.26 / Snap MySQL through 0.5.1; local populated SQLite schema upgrade and PostgreSQL SQL generation do not establish full deployments |
| Authorization and lifecycle security review | Existing automated tests cover owner/scope/revocation/virtual-only behavior; wider concurrency races and independent release review remain open |
| Proxy, logging and large-file behavior | Query-secret redaction, trusted proxy IPs, memory/load and stalled client/storage timeouts need actual deployment evidence |
| Backup/restore consistency | Database and files must restore together; rollback by copying older code is unsupported; exercise on disposable backup before release |
| Manual UI checks | Physical mobile/keyboard, real browser zoom and all-state contrast remain; screen-reader gate excluded by user |
| Publishing | Not performed; no app-store signing/upload or Git push |
