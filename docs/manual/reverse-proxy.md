# Reverse Proxy Guidance

A minimal local HTTP Nginx forwarding and access-log fixture is now tested against the exact 0.8.0 archive. Production TLS, trusted-IP, load and error/tracing-log configurations remain deployment-specific gates. See the [release report](../release/0.8.0-readiness.md#proxy-and-log-verification).

The app must function with standard Nextcloud routes. A future clean `/media/` location may internally route to `/index.php/apps/mediastorage/delivery/v1/` while preserving path encoding, query parameters and authentication. Final Nginx examples require verified routes and the actual deployment's front-controller rules; an untested copy-paste rewrite is intentionally not provided.

Configure proxy request-body limits together with PHP and app upload limits. Use deployment-specific Nginx `limit_req_zone`/`limit_req` and `limit_conn_zone`/`limit_conn` for per-client traffic and concurrent downloads. Verify real client IP handling only through trusted proxies, account for NAT, and return 429 for enforced throttling. Optional WAF controls supplement application authorization.

Never share-cache authenticated or signed private media by default. Redact credential-bearing query strings and Authorization headers in access logs. Preserve HEAD, Range, If-Range and conditional request behavior. Domain filtering is advisory and must not replace credentials. Any future example must document its scope, trusted proxy assumptions, and validation commands.

## Temporary capability logging — 0.5.0

The actual route is `/index.php/apps/mediastorage/delivery/v1/{selector}?key=...` (installation prefix may vary). Redact the `key` value and credential-bearing request/referrer fields from access/error/tracing logs, including upstream proxies. Management POST responses contain a one-time secret URL and must not be body-logged. The app does not log these values. Keep delivery responses private/no-store and do not add public caching. Basic GET/HEAD is implemented in prepared source; Range/conditional/rate policy remains US-MS-07.

## Prepared streaming policy — 0.6.0

Source now implements single Range/If-Range and conditional requests with private/no-store headers, native IP/grant/issuer quotas and concurrent stream slots. Preserve 206/304/412/416/429/503 and Retry-After without converting them into cached success pages. Disable response body buffering where needed for streaming, and bound upstream/client timeouts; application chunk/deadline checks cannot interrupt every blocked transport or storage read. The optional domain policy is advisory and headerless authorized backends remain supported. No reverse-proxy configuration or public deployment has been verified by local unit tests.

## Verified local fixture — 0.8.0

The isolated release harness verifies exact 206 bytes, HEAD length/no body, 304/412/416/404, private/no-store and no CORS relaxation through Nginx. It disables request/response buffering and shared caching, preserves Host, and replaces incoming forwarding headers. Access logs use query-free `$uri`; Apache uses query-free `%U` and omits Referer/cookies/Authorization. Known secrets are absent from the tested access-log output. Do not use default `$request`/`$request_uri` or Apache `%r`/`%q` for credential-bearing delivery URLs. Error/debug/tracing logs require separate verification; the fixture's Nginx error threshold is `crit`. No actual Snap logging configuration was changed.
