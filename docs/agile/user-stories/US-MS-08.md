# US-MS-08 — Release readiness

Status: Automated exact-archive acceptance verified on 2026-10-10; release gates remain open. The 0.8.0 artifact passed 66 packaging checks and 197 isolated install/upgrade/paired-restore/proxy checks. Child suites passed 76 access HTTP, 31 streaming/policy HTTP and 19 native-player browser checks on the restored exact archive. Actual container target: Nextcloud 34.0.4 / PHP 8.5.11 / SQLite. US-MS-07 is complete on installed Snap 0.8.0 and committed in 938bd57. See the [release report](../../release/0.8.0-readiness.md) for the exact artifact, security review, environment and remaining gates.

## Packaging contract

Provide a local build-and-package command that produces `mediastorage-VERSION.tar.gz` with a single `mediastorage/` application root. Include only deployable PHP/metadata, templates, images/font licences, built JS/CSS, Composer metadata, README and licence. Exclude credentials, repository history, test fixtures, node_modules, development skills and source maps. Reject symlinks and inconsistent release versions. Require a successful frontend build whose source fingerprint matches current frontend inputs; stale/missing assets must fail before archive creation.

The archive records a SHA-256 manifest of every packaged file and a separate archive checksum. Sort paths and normalize archive ownership, timestamps and modes so identical inputs produce identical archives. This is an unsigned development artifact; a checksum is not an app-store signature or security certification. Do not publish or upload automatically.

## Remaining acceptance

Exact-archive fresh installation, populated 0.2.0-to-0.8.0 upgrade, quiesced paired SQLite backup/restore, exact installed/served bytes and local Nginx forwarding/access-log redaction are verified. This does not establish the actual production proxy/TLS/trusted-IP/logging configuration, load/memory/stalled-storage/crash behavior or MySQL backup/restore. PostgreSQL and other version/database combinations remain unclaimed; SQL generation is separate evidence.

Physical mobile/keyboard, actual browser zoom and visual-state contrast remain manual release checks. Actual screen-reader testing is excluded at the user's request. Public release/signing remains pending the [open release gates](../../release/0.8.0-readiness.md#open-release-gates); do not mark the entire story complete from automated acceptance alone.
