# Sprint 01: App Foundation

Goal: Install a native `mediastorage` app on the confirmed target and provide tested virtual nodes and owner-context file bindings.

Status: Documentation baseline complete; Backend foundation installed and enabled; 69 unit checks, schema tests and 33 live HTTP checks passed on Nextcloud 34.0.4 / Snap MySQL. Extended acceptance remains pending.

| Task | Status |
| --- | --- |
| Read specification and reference docs | Done |
| Establish documentation before code | Done |
| Determine installed Nextcloud and PHP versions | Verified package/runtime: 34.0.4 / 8.4.26 |
| Verify target public APIs and select dependencies | Backend interfaces inspected; frontend dependencies deferred to Phase 3 |
| Bootstrap app, routes, DI and authenticated page | Verified: mediastorage 0.1.0 enabled; authenticated page/API passed |
| Create portable schema/migrations | Fresh installation and live MySQL app queries passed; SQLite schema checks passed; upgrade/provider matrix pending |
| Implement owner-scoped hierarchy operations | Implemented; unit and live HTTP checks passed |
| Implement file bindings and explicit rebind recovery | Implemented; unit and live Filesystem/DAV checks passed |
| Run unit and actual integration tests | 69 unit checks, schema suite and 33 live HTTP checks passed; CLI harness remains unexecuted |

## Acceptance gate

Enable app without core changes. Install and upgrade migrations on actual test databases. Test root/nested creation, duplicates, invalid names, cycle-safe moves, path resolution, owner isolation, search, missing bindings, ambiguous file IDs, replacement, and reference deletion without physical deletion. Verify underlying read permissions and unchanged physical locations.

## Environment evidence

2026-10-09: `php -v` and `composer --version` returned command not found. `docker ps` could not access the Docker socket. No runtime or integration tests ran. Do not infer an installed Nextcloud version from the moving stable documentation URL.

## Snap test environment attempt

2026-10-09: Host identified as openSUSE Tumbleweed 20261007; `/usr/bin/snap` exists. Authorized `sudo snap install nextcloud` could not start because sudo requires an interactive password. No Nextcloud installation or version verification completed. SELinux state has not been verified. Installation must be performed in the user's terminal before target inspection and implementation can proceed. Do not send sudo passwords through chat.

## Installed package inspection

2026-10-09: Confirmed Nextcloud 34.0.4 stable, Snap revision 54326, from installed version.php. Inspected public filesystem, bootstrap and migration interfaces. SELinux is enforcing; AppArmor module is disabled. Localhost port 80 was unreachable; occ status requires interactive sudo. No runtime/integration tests passed or ran.

## Implementation evidence

Added native app bootstrap, session-protected management routes, safe error responses, hierarchy/persistence services, Filesystem API binding/recovery, migrations and a foundation page. All management operations retain default authentication/CSRF middleware. Added deterministic per-owner roots, database-enforced hash-based exact-name sibling uniqueness and transactional owner-root write serialization. Depth and subtree mutation limits bound work. Physical file deletion/upload and browser delivery are not exposed.

Nextcloud instance initialized successfully through its local setup workflow. `occ status` confirms installed true. Test admin credentials are outside the repo in a mode-0600 file. No app has been enabled yet.

Executed `sh scripts/php-snap.sh tests/run.php` (69 checks) and `sh scripts/php-snap.sh tests/schema.php` (passed). Live integration script exists in `tests/integration.php`. App metadata template is validated with fixture values only; real author/licence are still required. Root Snap deployment script is prepared but not executed. Do not mark Sprint 01 complete until app enablement and live integration gates pass.

## Licensing and metadata

Owner confirmed author Kongphai Wutthichaiya and chose AGPL-3.0-or-later to align with Nextcloud. Added LICENSE, SPDX notices, Composer licence and generated schema-valid appinfo/info.xml. Root deployment and live integration remain pending.

Deployment attempt: `sudo -n sh scripts/deploy-snap.sh` returned `sudo: a password is required`. Current passwordless sudo permissions cover inspection commands only. No app files were deployed and no app migrations ran. Run the reviewed deployment script interactively in the host terminal to complete this step.

## Live HTTP verification — 2026-10-09

User-provided deployment output confirms app 0.1.0 enabled. Ran `MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/http_integration.py` with authorized localhost access. **33 checks passed**, exit 0. Dedicated non-admin users exercised management page, root/list/create/nested/resolve/search/rename/move/delete, duplicate names, traversal rejection, cross-owner operations, actual CSRF and anonymous denial, concurrent duplicate creation with independent sessions, and conflicting concurrent moves that cannot create a cycle. DAV uploaded real PNG fixtures; bindings, metadata, multiple references, missing file detection, explicit rebind and physical-file preservation passed.

Fresh migration installation is evidenced by successful app enablement and live queries against the app tables. This does not establish migration upgrade from an earlier version. The PHP CLI integration harness was not executed; the Python HTTP harness exercised the deployed app instead. MySQL version was not independently queried.

Remaining gates: earlier-version migration upgrade, PostgreSQL and full Nextcloud SQLite deployments, mounted/shared ambiguity in a live instance, owner deletion lifecycle cleanup, and wider release/security review. The test suite removes references and users, but app owner-root metadata can remain; initial exploratory runs may also have retained virtual fixture metadata after account deletion. Use only this disposable instance.
