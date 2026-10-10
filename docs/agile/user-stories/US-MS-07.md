# US-MS-07: Streaming and abuse controls

Status: Complete for the recorded installed 0.8.0 target on 2026-10-10. Installed acceptance passed 76 access HTTP, 31 streaming/policy HTTP and 19 browser checks; 61 local streaming/protection checks also pass. Wider release gates remain US-MS-08. The contract below was recorded before implementation.

## Delivery behavior

Keep US-MS-06 per-resource credentials and current owner/issuer/binding authorization. Authorization precedes every conditional/range response. Add per-grant opaque strong ETag and Last-Modified, conditional GET/HEAD (If-Match/If-Unmodified-Since, then If-None-Match/If-Modified-Since), and GET single byte ranges with 206/Content-Range. HEAD ignores Range and describes the full representation. If-Range requires a matching strong tag or matching HTTP date; mismatch/weak tag falls back to full 200. Valid unsatisfiable, zero suffix and multiple ranges return empty 416 with bytes */size; malformed/unknown units are ignored. Bound header parsing and reject excessive header size. Handle huge decimal values without integer overflow. Successful and error responses remain private/no-store, no CORS relaxation; invalid/revoked credentials can never get 304/206/416 metadata.

Stream only the requested bytes in at most 64 KiB chunks; seek directly rather than read/discard large prefixes. Non-seekable storage that cannot fulfill an offset returns safe 503. Close streams and release concurrency slots after normal completion, callback exceptions, early destruction and client cancellation. No whole-file buffering/materialization. A time ceiling bounds each stream; truncation requires the client to retry via Range while its grant remains valid. Already-authorized bytes cannot be recalled.

## Protection and configuration

Use public Nextcloud ILimiter, IRequest::getRemoteAddress and ILockingProvider APIs, not app-owned cache/locking tables or an in-process-only counter. No schema change. Require enabled Nextcloud rate limiting/file locking; unavailable protection fails closed (503). Limits are operator app settings, clamped to bounded positive values:

| App key | Default | Bound |
| --- | --- | --- |
| delivery_ip_limit | 600 / 60 seconds | 1–10000 |
| delivery_grant_limit | 120 / 60 seconds | 1–10000 |
| delivery_issuer_limit | 240 / 60 seconds | 1–10000 |
| external_ip_limit | 600 / 60 seconds | 1–10000 |
| external_token_limit | 120 / 60 seconds | 1–10000 |
| delivery_ip_concurrency | 16 | 1–32 |
| delivery_grant_concurrency | 4 | 1–32 |
| delivery_issuer_concurrency | 8 | 1–32 |
| delivery_max_seconds | 300 | 5–1800, below file-lock TTL |
| delivery_hotlink_protection | 0 | 0/1 |
| delivery_allowed_domains | [] | JSON array of at most 100 exact ASCII hostnames |

IP limits apply before capability/bearer authentication, including failed attempts; resource/token counters apply only after credential validation. Issuer limits aggregate across derived grants and client IPs. Use hashed opaque identities in limiter/lock identifiers, never secrets/URLs. Native limiter windows are best-effort under concurrent bursts, not a strict distributed bandwidth quota. Full stream slots use exclusive named locks per IP/grant/issuer; rejected acquisition releases any earlier slots and returns 429. HEAD/304/412/416 consume request quota but no stream slot. Retry-After is 60 seconds for rate limits and 1 second for full stream slots. File-lock TTL/crash recovery and PHP/proxy timeouts still apply; proxy/WAF limits are necessary against floods and stalled connections. Trust proxy headers only through Nextcloud trusted_proxies; app code never parses X-Forwarded-For.

Optional hotlink policy compares exact normalized hosts from valid HTTP(S) Origin/Referer to the allowlist or the current Nextcloud host. Explicit disallowed/invalid browser origins are denied, including opaque null origins. Cross-site Fetch Metadata without Origin/Referer is denied when protection is enabled. Requests without browser metadata remain allowed after real authorization. These headers are advisory/spoofable by backend clients; no website identity or DRM guarantee. Invalid enabled policy fails closed. No new UI screen; administration uses Nextcloud app settings. Signed URLs remain mandatory.

## Acceptance

Local tests must cover parsing/precedence, strong/weak tags, dates, suffix/open/clamped/invalid/huge ranges, exact output limits, stream closure/cleanup, trusted IP use, configured rate limits/Retry-After, concurrency rollback/release, advisory policy and disabled-protection failure. Installed HTTP checks must verify real image/video byte ranges and conditional responses, revoked/error cache isolation, native player seek, actual 429 and parallel stream limits. Do not claim unrun checks passed or proxy/load matrix support. US-MS-08 remains release packaging/security/compatibility work.

References: [HTTP semantics RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html), installed Nextcloud 34 public ILimiter/ILockingProvider/IOutput interfaces and [controller guidance](https://docs.nextcloud.com/server/stable/developer_manual/basics/controllers.html).

## US-MS-07 installed acceptance — 2026-10-10

US-MS-07 is verified on installed Media Storage 0.8.0 / Nextcloud 34.0.4 / PHP 8.4.26 / Snap MySQL. No production code, schema, API or asset changes were needed for this acceptance slice.

- `tests/access_http.py`: **76 live checks**, including exact ranges, conditional precedence, HEAD, revoked metadata denial and the default native grant quota (120 HEAD requests, then 429 with Retry-After).
- `tests/streaming_http.py`: **31 live checks**, including a 64 MiB source with exact distant bytes, actual TCP-backpressured concurrent streams, per-grant/IP/issuer limits, cancellation/rejection lock cleanup, per-grant ETag isolation, configured hotlink allow/deny, invalid-policy failure and owner/original preservation.
- `MEDIASTORAGE_TEST_STREAMING_ONLY=yes node tests/frontend/live.mjs`: **19 installed browser checks**, including the displayed/server version check and anonymous native MP4/WebM metadata, exact ranges, HEAD/304, playback and seek. The harness clears cookies and uses a neutral same-origin page, disposing of app session-expiry navigation; it does not substitute the session DAV bridge or intercept candidate assets.
- `sh scripts/php-snap.sh tests/streaming.php`: **61 local streaming/protection checks**, plus 64 access and 76 token checks.
- `MEDIASTORAGE_TEST_PHASE=3 python3 tests/http_integration.py`: **130 live regression checks**; dedicated account/original cleanup completed.

All live harnesses exited successfully and removed their dedicated accounts/originals. The policy suite restored all five changed app settings, including absence of previously unset keys. These results establish the recorded direct local target, not a proxy/CDN/load or database/version matrix, memory benchmark, crash-recovery certification or independent security review. Those remain US-MS-08 gates. UI-10 physical mobile/keyboard, actual browser zoom and full-state contrast remain open; screen-reader testing remains excluded by user decision.
