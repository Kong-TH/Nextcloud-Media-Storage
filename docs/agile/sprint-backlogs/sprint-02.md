# Sprint 02: Secure API Foundation

Status: Token/API/lifecycle scope verified on the local Nextcloud 34.0.4 / Snap MySQL instance. Explorer/upload and delivery remain later-phase work. Phase 1 commit: `81a917e`.

## Scope

1. Remove app metadata when a Nextcloud account is deleted; clean stale metadata before a recreated account begins use.
2. Store only verifiers for 256-bit random API secrets. Support names, expiry, explicit scopes, one-time issue, list, revoke, last use, and rotation with an overlap window.
3. Add session/CSRF-protected token management and narrowly isolated bearer-only server endpoints. A browser session cannot authorize the external controller.
4. Enforce owner, scope and optional virtual-folder restrictions on every source and destination. Use the existing owner transaction lock to keep authorization and hierarchy mutations together.
5. Test invalid/expired/revoked credentials, scope boundaries, owner deletion and token lifecycle. Prepare the live upgrade suite and document actual outcomes separately.

No signed URL, streaming or public media delivery in this sprint. Upload transport/UI remains Phase 3; the `media:upload` scope reserves that permission but must not grant management access today. External `token:manage` permits owner-wide list/revoke only and cannot be combined with a folder restriction. Token creation/rotation remains an authenticated dashboard-session operation to avoid credential delegation escalation.

## Deployment gate

Bump app to 0.2.0 and add an incremental migration. Complete local verification before the user runs the prepared root deployment script. The installed 0.1.0 instance cannot exercise new routes/listeners until upgraded. No commit/push is implied by the previous completed commit request.

## Completed in source

Added ms_tokens incremental migration, TokenStore, ApiTokenService, ScopedApiService, session TokenController and bearer-only ExternalController. UserCreatedEvent/UserDeletedEvent listeners purge only app-owned rows for the exact owner, using a transaction and owner-root lock; no filesystem deletion is performed. Recreated IDs trigger cleanup even if an earlier deletion happened before the listener was installed. Old orphan metadata for accounts that are never recreated is not automatically bulk-collected.

App version is 0.2.0. The user upgraded the deployed app from 0.1.0 to 0.2.0 successfully. The script now disables only this app before copying and re-enables it to run pending migrations; app:enable on an already enabled app would otherwise skip installation. Failed deployment leaves the app disabled for investigation rather than re-enabling mixed code.

## Local evidence

- `sh scripts/php-snap.sh tests/run.php`: 69 checks passed.
- `sh scripts/php-snap.sh tests/tokens.php`: 61 checks passed.
- `sh scripts/php-snap.sh tests/schema.php`: passed, including populated 0.1-to-0.2 schema upgrade in SQLite and migration re-entry.
- PHP syntax: 26 files passed; Python HTTP harness, Composer JSON and shell deployment syntax passed.

These are not live token/authentication or MySQL upgrade claims.

## Live acceptance — passed

Run after deploying 0.2.0:

```bash
MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PHASE=2 python3 tests/http_integration.py
```

The extended suite retains Phase 1 checks and adds session-protected issue/list/revoke/rotation, bearer-without-browser-headers, malformed/expired/revoked token denial, scope/folder boundaries, physical-file-ID restrictions, owner-wide real binding, cache headers, last use, token management and user-ID recreation isolation. It uses disposable accounts and never prints secrets. Executed successfully against 0.2.0; 70 live HTTP checks passed.

## Limitations

No media bytes are served; authenticated resolution returns metadata only. File uploads remain the next explorer/storage phase. `media:upload` is reserved and grants no current endpoint. Bearer APIs have no CORS opt-in, token issuance or token rotation; these are session-only. Folder-limited tokens cannot bind/rebind guessed physical IDs or alter their boundary. Restricted search is within the selected parent, not a recursive owner-wide search. Domain protection, rate limits, signed URLs and streaming remain Phase 4. Tokens must be used over HTTPS outside this disposable loopback test environment.

## Deployment attempt

`sudo -n sh scripts/deploy-snap.sh` returned `sudo: a password is required`. No 0.2.0 deployment occurred. Current sudoers permissions cover inspection only; the prepared root script must be run interactively on the host before live acceptance can continue.

## Live deployment and verification result

User deployment output: `mediastorage 0.1.0 disabled`, then `mediastorage 0.2.0 enabled`. The incremental migration completed through the supported app installation workflow.

Executed `MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PHASE=2 python3 tests/http_integration.py`: **70 checks passed**, exit 0. This includes the prior 33 Phase 1 checks and 37 additional checks: bearer-only requests without browser metadata, malformed/missing/expired/revoked credentials, cache headers, last use, session/CSRF retention, explicit scope boundaries, restricted folder reads/moves/deletes/File ID import, owner-wide actual file binding and physical preservation, rotation overlap, owner-only token revocation, token-management scope and deletion/recreation isolation.

The suite deleted/recreated only its own random test UID. Recreated sessions had no prior virtual nodes or token metadata; old secrets remained invalid; another test owner's folder survived. Cleanup removed test accounts, virtual references and physical fixtures. The test verifies the combined deletion/creation lifecycle guarantee through HTTP, not a direct SQL row-count inspection of deletion alone.

Actual database deployment: Snap-configured MySQL. Exact MySQL version and other database deployments remain unverified. SQLite schema tests separately verify preservation of populated Phase 1 rows during schema upgrade. No UI explorer, upload transport, streaming, signed URLs or abuse-rate limiting is claimed.
