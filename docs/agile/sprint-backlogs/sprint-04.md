# Sprint 04: Temporary delivery and protection

Status: US-MS-06 complete on installed 0.5.1; US-MS-07 implementation prepared for installed acceptance, 2026-10-10. User authorized US-MS-06 after accepting the installed explorer. UI-10 retains physical mobile/keyboard, browser zoom and all-state contrast acceptance; screen-reader testing is excluded at the user's request.

## Selected work

1. US-MS-06: per-resource opaque temporary read capabilities, session/scoped bearer issuance and revocation, owner lifecycle cleanup and real delivery without API secrets in URLs.
2. US-MS-07 in progress: external streaming ranges/validators, throttling, hotlink policy and cache isolation.

Read [US-MS-06](../user-stories/US-MS-06.md) for the documentation-first contract. Release 0.5.0 requires migration 000500 and privileged deployment before installed acceptance. Preserve the existing 0.4.1 baseline and all virtual-only mutation semantics. Do not claim Phase 4 protection complete from basic GET/HEAD delivery.

## Local verification — 2026-10-10

63 temporary access checks and the existing 76 token/scope checks passed with strict Nextcloud public-interface doubles. Baseline/bucket/upload checks (69/62/46), populated SQLite migration through 000500/re-entry, MySQL/PostgreSQL SQL generation only, three frontend suites and production build passed. Generated routes are parsed by the installed Nextcloud RouteParser, including distinct GET/HEAD names.

Prepared `tests/access_http.py` covers anonymous exact bytes, HEAD, URL tampering/expiry/revocation, session CSRF and owner isolation, bearer restrictions/revocation, original moves/deletion preservation and UID recreation. It has not run against 0.5.0; root deployment is required. No production UI changes.

## HEAD integration correction — 0.5.1 prepared

Installed 0.5.0 issued/read/revoked real capabilities. The full live suite failed HEAD because Nextcloud App::main replaces a regular empty Response Content-Length with zero; Apache omits that length on HEAD. Add HeadResponse implementing the public ICallbackResponse interface, preserving representation headers without opening/outputting a stream. A local regression asserts callback behavior. Current local capability count is 64.

A separate diagnostic run passed 46 HTTP checks on installed 0.5.0 with **HEAD explicitly excluded**; this is not full acceptance. It covers bearer boundaries/revocation, expiry, rebind, physical move/content changes, original preservation and UID recreation; dedicated accounts were cleaned. Wildcard conditional requests may return 304 after valid authorization in Apache; revoked credentials still return 404. Updated tests/access_http.py expects installed 0.5.1 and retains the mandatory HEAD check. Deploy 0.5.1 and rerun the full live suite before completing the story. No new schema beyond 000500.

## Installed 0.5.1 acceptance — 2026-10-10

The user deployed 0.5.1 without errors. `MEDIASTORAGE_TEST_DISPOSABLE=yes python3 tests/access_http.py` passed **47 live checks** with mandatory HEAD enabled: status 200, zero response bytes, Content-Length 68 for the 68-byte fixture. Exact anonymous GET, expiry/revocation, conditional revoked denial, owner/issuer/folder restrictions, rebind/physical move/content changes and UID recreation passed. `MEDIASTORAGE_TEST_DISPOSABLE=yes MEDIASTORAGE_TEST_PHASE=3 python3 tests/http_integration.py` passed **130 live regression checks**. Both harnesses exited 0 and cleaned their dedicated accounts/originals. US-MS-06 is complete on Nextcloud 34.0.4 / Snap MySQL. US-MS-07 Range/validators/rate/hotlink controls and the wider release matrix remain planned. No 0.5.1 browser suite is claimed; production UI behavior did not change.

## US-MS-07 started — 2026-10-10

User requested commit and continuation. Commit b5ac69e contains verified US-MS-06 and the UI-10 acceptance slice, without push. Implement the [streaming/protection contract](../user-stories/US-MS-07.md), then record local and installed results separately. Version 0.6.0 is planned; installed baseline remains 0.5.1.

## US-MS-07 local verification — 0.6.0 prepared

61 streaming/protection checks pass: range parsing/overflow/conditions, actual controller seek and exact chunks, authorization before metadata, stream closure/deadline/skipped callback, native limiter 429 mapping, IP/identity separation, concurrency rollback/idempotence, disabled protection and optional advisory domains. Existing access/token suites pass 64/76; baseline/bucket/upload pass 69/62/46; schema checks and three frontend suites/build pass. No new database migration. Live harness now requires 0.6.0 and covers partial responses, validators and the default native grant quota. Installed verification and native-player/parallel-stream acceptance remain pending.

## Packaging follow-up — 2026-10-10

The user authorized committing US-MS-07 and continuing. Commit bfd532c records the 0.6.0 implementation/local evidence; no push. An authenticated installed-page check still reports 0.5.1. Continue the independent [US-MS-08 packaging slice](../user-stories/US-MS-08.md) while retaining US-MS-07 installed acceptance as open. This is not permission to publish or a claim that either story is complete.

## Installed version observed — 2026-10-10

After the user reported rebuilding, an authenticated app-page probe returned data-version 0.6.0. This confirms the displayed installed version only. The 0.6.0 HTTP/player/concurrency/policy acceptance suites have not yet run; US-MS-07 remains open.
