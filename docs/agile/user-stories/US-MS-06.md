# US-MS-06: Temporary media access

Status: Complete on the local Nextcloud 34.0.4 / Snap MySQL target, 2026-10-10. Installed 0.5.1 passed 47 temporary-access HTTP checks and 130 existing Phase 3 HTTP checks; all dedicated accounts/originals were removed. Other deployment/database matrices remain release validation. Preparation and the diagnosed 0.5.0 HEAD limitation below are historical.

As an authenticated owner or authorized read integration, I can issue a short-lived, revocable URL for one virtual media reference without exposing a long-lived API credential or requiring the recipient to log in.

## Contract before implementation

- Use an opaque capability: random 128-bit selector plus 256-bit secret, storing only its SHA-256 verifier. The URL is returned once and is a reusable read credential until expiry/revocation. It is not a Nextcloud share or a physical path.
- Session issuance/list/revoke retains authentication and CSRF. Bearer issuance requires media:read and the current folder restriction; bearer revocation is limited to that same issuer and currently accessible node. Cookies never replace bearer authentication.
- Default TTL is 900 seconds, configured maximum defaults to 3600 and is clamped to 60–86400 seconds. Explicit TTL must be positive and within the maximum. Bearer-derived grants cannot outlive their issuer.
- Pin owner, node, virtual bucket root, physical file ID, storage identity and file ETag. Every delivery rechecks enabled owner, current node/binding/bucket, readability, storage/MIME and ETag. Renames within the bucket and physical moves within the same storage retain access; changed contents/binding or moving to another bucket denies access. Restoring the exact pinned original/context may restore access until expiry/revocation.
- Recheck the issuing token's validity, media:read permission and current folder boundary on every delivery. Token revocation/expiry, deleted boundaries and owner deletion/recreation fail closed. Copies do not inherit grants.
- Anonymous delivery accepts only the temporary credential, never an API token or owner parameter. Invalid, expired, revoked and unavailable capabilities return the same no-store 404. Open the official Files stream under the owner lock; never redirect to DAV or expose a local/physical path. Revocation blocks subsequent requests, not bytes already authorized and in flight.
- GET returns media bytes with no-store, nosniff and no-referrer. HEAD performs the same authorization without opening a stream. No conditional/cache bypass; Range/validators/rate limits are US-MS-07. Keep the existing image/video MIME allowlist; SVG/HTML remain excluded. Serve allowed media inline. No CORS relaxation.
- Management listing omits secrets/verifiers/physical identifiers. No URL or API credential is logged by app code or stored in browser persistence. Operators must redact delivery query credentials in proxy/access logs.
- This story implements session and external APIs, without adding a UI screen. Existing Copy virtual path keeps its exact metadata semantics.

## Acceptance

Test malformed/tampered/unknown credentials, resource substitution, owner isolation, TTL boundaries, expiry, idempotent revocation, issuer restrictions/revocation/expiry, deleted/moved references and boundaries, rebind/storage/content/readability changes, safe headers, HEAD, stream failure, owner lifecycle cleanup and populated migration/re-entry. Record strict-double/local results separately from installed HTTP evidence.

## Local result

63 temporary-access and 76 existing token checks pass using strict installed public-interface doubles. Populated SQLite upgrade/re-entry passes through 000500; MySQL/PostgreSQL SQL generation is not provider execution. Build and existing backend/frontend suites pass. The live harness is prepared but unexecuted pending 0.5.0 deployment; story acceptance is not complete.

Implementation uses the installed Nextcloud 34 StreamResponse/Files/route APIs; upstream guidance: [Nextcloud controllers and response handling](https://docs.nextcloud.com/server/stable/developer_manual/basics/controllers.html). Source inspection and documentation are not installed integration evidence.

## HEAD integration correction — 0.5.1 prepared

Installed 0.5.0 issued/read/revoked real capabilities. The full live suite failed HEAD because Nextcloud App::main replaces a regular empty Response Content-Length with zero; Apache omits that length on HEAD. Add HeadResponse implementing the public ICallbackResponse interface, preserving representation headers without opening/outputting a stream. A local regression asserts callback behavior. Current local capability count is 64.

A separate diagnostic run passed 46 HTTP checks on installed 0.5.0 with **HEAD explicitly excluded**; this is not full acceptance. It covers bearer boundaries/revocation, expiry, rebind, physical move/content changes, original preservation and UID recreation; dedicated accounts were cleaned. Wildcard conditional requests may return 304 after valid authorization in Apache; revoked credentials still return 404. Updated tests/access_http.py expects installed 0.5.1 and retains the mandatory HEAD check. Deploy 0.5.1 and rerun the full live suite before completing the story. No new schema beyond 000500.

## Installed 0.5.1 acceptance — 2026-10-10

The user deployed 0.5.1 without errors. `MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/access_http.py` passed **47 live checks** with mandatory HEAD enabled: status 200, zero response bytes, Content-Length 68 for the 68-byte fixture. Exact anonymous GET, expiry/revocation, conditional revoked denial, owner/issuer/folder restrictions, rebind/physical move/content changes and UID recreation passed. `MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PHASE=3 python3 tests/http_integration.py` passed **130 live regression checks**. Both harnesses exited 0 and cleaned their dedicated accounts/originals. US-MS-06 is complete on Nextcloud 34.0.4 / Snap MySQL. US-MS-07 Range/validators/rate/hotlink controls and the wider release matrix remain planned. No 0.5.1 browser suite is claimed; production UI behavior did not change.
