# US-MS-08 — Release readiness

Status: In progress. Packaging is implemented; 66 archive checks passed for prepared 0.8.0. User accepted deployed UI-16 after the 0.8.0 deployment request. Exact-archive installation, upgrade and the remaining gates below are unverified; workspace Snap deployment is a different installation path. US-MS-07 implementation is committed in bfd532c, with installed streaming/protection acceptance still pending.

## Packaging contract

Provide a local build-and-package command that produces `mediastorage-VERSION.tar.gz` with a single `mediastorage/` application root. Include only deployable PHP/metadata, templates, images/font licences, built JS/CSS, Composer metadata, README and licence. Exclude credentials, repository history, test fixtures, node_modules, development skills and source maps. Reject symlinks and inconsistent release versions. Require a successful frontend build whose source fingerprint matches current frontend inputs; stale/missing assets must fail before archive creation.

The archive records a SHA-256 manifest of every packaged file and a separate archive checksum. Sort paths and normalize archive ownership, timestamps and modes so identical inputs produce identical archives. This is an unsigned development artifact; a checksum is not an app-store signature or security certification. Do not publish or upload automatically.

## Remaining acceptance

Verify archive structure, file hashes, reproducibility and stale-build rejection locally. Install the exact archive on a disposable Nextcloud target and run migrations/HTTP/browser checks before claiming package installation acceptance. Review authorization, original-file preservation, secret handling, proxy logging, upload/rate policy and rollback/backup procedures. Record actual database/version testing separately from SQL generation. Current declared target remains Nextcloud 34; PostgreSQL and a full live SQLite installation are not established by schema unit tests.

Physical mobile/keyboard, actual browser zoom and visual-state contrast remain manual release checks. Actual screen-reader testing is excluded at the user's request. Public release remains pending until outstanding US-MS-07 and compatibility/security gates have evidence; do not mark this story complete based on packaging alone.
