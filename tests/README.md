# Test Instructions

## Executed checks

```bash
sh scripts/php-snap.sh tests/run.php
sh scripts/php-snap.sh tests/schema.php
```

On 2026-10-09, PHP 8.4.26 from Snap revision 54326 passed 69 service/controller checks. Strict doubles implement installed Nextcloud 34 public interfaces. They cover validation, hierarchy, duplicates, cycles, depth, owner isolation, missing/ambiguous/changed storage bindings, explicit recovery, reference-only deletion, session-derived owner and security attributes. Attribute checks do not replace live middleware tests.

Schema checks invoke the actual migration with a schema-wrapper double and bundled Doctrine schema objects; install generated SQL into in-memory SQLite; check sibling uniqueness, independent owner roots, exact-case name keys and rollback. Migration re-entry is checked. MySQL/PostgreSQL SQL generation is checked, not execution. App metadata template is schema-validated in memory with fixture identity values; no project author/licence is inferred.

## Live integration test — not yet executed

Use a disposable initialized Nextcloud 34 instance, enable this app using its real metadata, and create a dedicated test user. Invoke `tests/integration.php` with the same PHP runtime/configuration and filesystem access used by that Nextcloud installation:

```bash
MEDIASTORAGE_TEST_DISPOSABLE=yes \
NEXTCLOUD_SOURCE=/path/to/nextcloud \
MEDIASTORAGE_TEST_USER=dedicated-test-user \
php /path/to/mediastorage/tests/integration.php
```

For Snap, the bare host PHP or direct bundled binary is insufficient for live bootstrap. Run inside the Snap PHP environment or use a standard disposable Nextcloud development environment. The local `php-snap.sh` helper alone is for unit/schema checks; it does not supply Snap service environment/configuration or root access.

The integration test creates uniquely named physical and virtual fixtures, exercises the actual app persistence and Filesystem APIs, checks duplicate/cycle rejection, deletes its own physical fixture to simulate a missing binding, explicitly rebinds, and verifies virtual deletion preserves the replacement. Finally it deletes only its own fixture directory. The logical owner root remains as normal app metadata.

Remaining required evidence: actual app enablement/migration runner install and upgrade, HTTP session/CSRF enforcement, parallel conflicting mutations, cross-owner/shared-mount permissions, and each claimed database provider. Tokens and delivery tests belong to later phases.

## Live HTTP suite — executed

```bash
MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/http_integration.py
```

This stdlib Python suite reads the test admin credential file `/tmp/mediastorage-nextcloud-admin.json` (or `MEDIASTORAGE_TEST_CREDENTIALS`), without printing credentials. It creates two unique disposable non-admin users using the provisioning API, logs in through the real session flow with Origin/CSRF checks, and calls the installed app. It does not require root. Localhost requests may require the Codex command approval to run outside the sandbox.

**2026-10-09: 33 checks passed**, including live hierarchy operations, owner isolation, middleware enforcement, concurrent duplicates/cycle prevention with independent sessions, DAV uploads/file IDs, bindings, missing-file recovery and physical-file preservation. Actual backend: Snap MySQL; exact database version not independently queried. Fresh app installation passed; prior-version migration upgrade did not run.

Cleanup removes this run's virtual references and users/physical fixtures. Empty app-owned roots may remain. Initial exploratory runs removed accounts before virtual cleanup and may have retained app metadata. No app user-deletion listener exists yet; implement lifecycle cleanup before release, including user-ID recreation isolation tests. The separate PHP CLI harness above remains unexecuted.

## Phase 2 checks and prepared live suite

```bash
sh scripts/php-snap.sh tests/tokens.php
sh scripts/php-snap.sh tests/schema.php
```

61 new local checks passed using strict public-interface doubles: token entropy/format/verifier secrecy, invalid/expired/revoked/disabled/deleted authentication, explicit scope boundaries, folder containment/source/destination, File ID restrictions, rotation overlap, one-time secret/listing redaction, lifecycle registration/delegation, session CSRF attributes and configured response headers. SQLite schema checks execute a populated 0.1-to-0.2 upgrade. Response-header unit checks inspect configured headers directly; actual Nextcloud header merging is a live test.

After deployment of 0.2.0:

```bash
MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PHASE=2 python3 tests/http_integration.py
```

The opt-in suite adds actual token issuance/read/revocation/rotation, raw bearer requests without browser metadata, missing/invalid/expired credentials, scope/folder/File ID boundaries, real owner-wide file bindings, no-store headers, token last use and deletion/recreation isolation. It deletes/recreates only its own random fixture UID and checks another test owner survives. Neither test passwords nor API secrets are printed. This extended suite ran successfully against 0.2.0: 70 HTTP checks passed, exit 0.

## Executed 0.2.0 acceptance result

Following the user's successful 0.1-to-0.2 deployment, ran the opt-in Phase 2 command above: **70 live HTTP checks passed**. Combined lifecycle checks verified that deleting/recreating the same fixture UID cannot recover old virtual nodes or token metadata and that old credentials stay invalid; another test owner survived. The suite exercised the actual token table/middleware and Filesystem API through HTTP. It did not directly inspect SQL rows after deletion or instrument all in-flight deletion races. Test users/references/physical fixtures were cleaned up.

The initial PHP CLI integration harness remains unexecuted; live evidence comes from the Python HTTP suite. Other database deployments remain unverified.
