# Compatibility and Testing

Current result: deployed app 0.2.0 on Nextcloud 34.0.4 / PHP 8.4.26 / Snap MySQL; 130 local checks, schema tests and 70 live HTTP checks passed. Earlier sections retain chronological inspection evidence.

## Compatibility evidence

Installed package: Nextcloud 34.0.4, stable, Snap revision 54326, confirmed from `/snap/nextcloud/current/htdocs/version.php` on 2026-10-09. This establishes the initial development target as Nextcloud 34; it does not verify app compatibility or instance initialization. PHP and Composer are unavailable on the host PATH. Snap includes PHP, but invoking its binary outside Snap failed with missing `libldap_r-2.4.so.2`; use the supported Snap execution environment rather than treating that as a broken installation. Vue dependencies are not selected. No database backend or app test has been verified.

The [official developer manual](https://docs.nextcloud.com/server/stable/developer_manual/) was inspected on 2026-10-09. Its stable URL currently serves a version-labelled manual; this is not evidence of the user's installed release. Use version-pinned documentation and actual public interface source after the target is known.

## Required target inspection

On the authorized test instance, record `php occ status`, PHP version and app environment without exporting secrets. Inspect public Node API signatures, bootstrap/DI conventions, routes, security middleware, migration API and compatible frontend packages for that exact release. Then declare a narrow tested compatibility range in app metadata.

## Test plan

Unit tests: hierarchy/name validation, root uniqueness, move cycles, paths, owner isolation, reference-only deletion and missing/ambiguous bindings. Phase 2 adds token expiry/revocation/scopes, cross-user and folder-scope boundaries. Phase 4 adds signed URL tampering/expiry, domain advisory behavior, rate limits, HEAD, conditional requests, single ranges, unsatisfiable ranges and private caching.

Integration tests must install/upgrade migrations and exercise actual Filesystem APIs on a disposable Nextcloud instance. Include concurrent duplicate creates and moves, file deletion/recreation, cross-storage movement and explicit rebind. Run each claimed database backend separately, including SQLite if supported. Test efficient streaming on large media without full-file buffering and measure memory.

Record exact test commands once a runnable harness exists. Deferred integration tests must have executable fixtures and setup instructions; a test plan alone is not a test implementation. Release validation includes app enablement, Vue build, permission checks and installed package smoke tests.

## Local test host inspection — 2026-10-09

Host: openSUSE Tumbleweed 20261007. SELinux `/sys/fs/selinux/enforce` is `1` (enforcing). AppArmor module parameter `enabled` is `N`. No security policy was changed.

A localhost HTTP probe to port 80 failed to connect. This does not establish whether Nextcloud is stopped, uses another port, or is still initializing. `sudo -n nextcloud.occ status` could not run because sudo requires a password. Initialization, configured ports, service health, database and runtime PHP version remain unverified.

## Public interfaces inspected in installed source

- `OCP\Files\IRootFolder::getUserFolder($userId)` provides the owner-context entry point.
- `OCP\Files\Folder::getById($id)` returns an array; its documentation explicitly warns that mounts/shares can produce multiple entries with different permissions. Reject ambiguous bindings rather than choosing the first match.
- `Folder::newFile($path, $content = null)` exists for filesystem-mediated creation.
- `Node::getStorage()`, `getId()`, `isReadable()`, `isUpdateable()` and `isDeletable()` exist. Authorization checks remain necessary at each operation.
- `IBootstrap::register(IRegistrationContext)` and `boot(IBootContext)` exist.
- Migration interface includes pre-schema, schema and post-schema hooks. Use the installed release's `SimpleMigrationStep` and verify signatures when implementing.

Source inspection is API evidence, not an integration test. No supported version range should be advertised until app enablement and tests pass.

## Phase 1 evidence update

2026-10-09: Successfully executed bundled PHP **8.4.26** using the matching core20 loader and library paths; the host lacks a PHP command. `scripts/php-snap.sh` reproduces this for local checks without changing host libraries or Snap security.

The authenticated setup workflow initialized the disposable local Nextcloud instance using Snap's existing MySQL autoconfig. Both HTTP status and authorized `occ status` now confirm `installed: true`, Nextcloud 34.0.4, no maintenance and no required DB upgrade. Services are active; HTTP/HTTPS settings are 80/443. The earlier localhost failure occurred inside the sandbox; an authorized outside-sandbox probe succeeded. Test credentials are in `/tmp/mediastorage-nextcloud-admin.json`, mode 0600, outside the repository; passwords were not printed.

Executed: 69 service/controller checks, migration schema tests with in-memory SQLite, and app metadata template validation against the installed schema. See [test instructions](../../tests/README.md) for scope and commands. Actual app enablement, migration runner, HTTP API integration and concurrent database mutations remain unverified. MySQL autoconfig identifies the test backend; app queries have not run against it. PostgreSQL/MySQL SQL generation is not provider support verification.

Nextcloud's metadata schema requires licence and author values. The app metadata remains a template until the owner supplies these values; a configurator performs schema validation before generating installable metadata.

## Metadata completion

Author Kongphai Wutthichaiya and AGPL-3.0-or-later are confirmed by the owner. The complete licence text is included in LICENSE. Generated appinfo/info.xml validates against the installed Nextcloud schema. The earlier missing-metadata gate is resolved; live deployment/integration remains outstanding.

## Live app result — 2026-10-09

App version 0.1.0 was successfully enabled through the root deployment script, including fresh migration installation. The Python live HTTP suite passed **33 checks**, with actual Nextcloud session/CSRF middleware, app persistence and Filesystem API resolution through uploaded DAV fixtures. Separate user sessions exercised concurrent duplicate creates and conflicting moves; outcomes were respectively one 201 plus three 409 responses, and one 200 plus one 409 response.

The verified deployment is Nextcloud 34.0.4 with the Snap-configured MySQL backend and PHP 8.4.26. This is not a PostgreSQL/SQLite deployment claim or a guarantee for other Nextcloud versions. Previous-version migration upgrades are not tested. Owner deletion event cleanup is not implemented; app-owned roots and metadata can outlive account deletion, so this remains a release security/lifecycle gate.

The HTTP suite creates disposable non-admin users, removes virtual references before account cleanup, and deletes its own user accounts/physical fixtures. Empty owner roots remain by app design; early exploratory runs may have retained additional virtual fixture metadata. Do not use this harness on a production instance. See [test instructions](../../tests/README.md).

## Phase 2 local evidence

Source version 0.2.0: 69 existing checks and 61 token/scope/lifecycle checks passed on PHP 8.4.26. SQLite schema test executed the incremental token-table upgrade while preserving existing Phase 1 rows. 26 PHP files and Python/shell/JSON syntax passed. New listener/controller declarations were checked against installed Nextcloud 34 public source.

Installed app remains 0.1.0; no 0.2.0 live test or actual MySQL migration upgrade has run yet. The extended HTTP suite is opt-in with MEDIASTORAGE_TEST_PHASE=2 and covers token scopes/lifecycle plus user-ID recreation. It must run after root redeployment.

## Phase 2 live evidence

The user executed the updated deployment script: 0.1.0 disabled, 0.2.0 enabled. The incremental token migration completed and real node/token/binding queries succeeded. Ran `MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PHASE=2 python3 tests/http_integration.py`: **70 live checks passed**, exit 0.

Verified actual session/CSRF and bearer-only boundaries; expiry/revocation/rotation; last use/cache headers; owner and optional folder scope; real owner-wide binding; physical-file preservation; concurrent duplicate/move safety; and deletion/recreation isolation without affecting the other owner. No credential values were logged by the test harness.

This establishes local Nextcloud 34.0.4 / Snap MySQL behavior only. MySQL version, other Nextcloud versions, PostgreSQL/full Nextcloud SQLite deployments, all shared/mounted contexts, and arbitrary in-flight lifecycle races remain unverified. Populated-schema preservation is separately checked in in-memory SQLite; direct MySQL row preservation across the upgrade was not instrumented.
