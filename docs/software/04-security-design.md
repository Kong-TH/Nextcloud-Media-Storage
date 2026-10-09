# Security Design

The sections below define requirements. Current implementation and test evidence are recorded separately; later-phase controls are not claimed as functional.

Authorize every operation against an explicit owner. A File ID is never an authorization credential. Check underlying filesystem permissions for bind/read/upload/replace. Reference deletion cannot delete physical files; physical deletion requires a separate explicit operation and is outside Phase 1.

Retain Nextcloud session authentication and CSRF protections for management. Future server-to-server tokens need at least 256 bits of random entropy, secure verifiers, constant-time comparison where appropriate, one-time secret display, expiry, revocation, rotation and last-used metadata. Enforce media:read, media:upload, media:manage, media:delete and token:manage independently. Folder scopes apply to every affected source and destination, including moves.

Temporary URLs must authorize one resource and read-only use, have bounded expiry, and define revocation semantics. They may be copied and reused until invalidated. Domain allowlists, Referer and Fetch Metadata checks provide only best-effort browser hotlink filtering. Missing browser metadata must not invalidate otherwise authorized backend requests. CORS is not hotlink authentication.

Validate upload size, server-detected MIME, supported media types and permissions; do not trust filenames or client Content-Type. Reject traversal and SQL injection through validation and parameterized query APIs. Return safe errors and redact Authorization, URL credentials and signed query values from app and proxy logs.

Phase 4 must address per-IP/per-token limits, 429 responses, bounded uploads and concurrency where practical. Proxy/WAF protection is necessary for large floods. Private media must not enter shared caches. No DRM or restriction on saving authorized images is intended.

## Phase 2 implementation status

Source now implements token verifiers, 256-bit random secrets, explicit expiry/scopes, one-time issue, revocation/rotation, last use, folder restrictions and user lifecycle listeners. 61 local checks passed. The live upgrade and 70 HTTP checks passed on the local Snap instance; this does not replace production security review.

Session token issuance/rotation retain default CSRF and authentication. External bearer routes alone have PublicPage/NoCSRFRequired attributes, paired with explicit verifier/expiry/owner/scope authorization under the same transaction lock as hierarchy/token mutations. There is no cookie fallback. Credentials travel only in Authorization; no query tokens, wildcard CORS or client-side main secrets. Metadata uses no-store headers. Use HTTPS for non-loopback deployment.

Token issuance accepts a configurable maximum lifetime: Nextcloud app key `max_token_lifetime` in seconds, default 31536000, clamped to 60–31536000. Every token must expire. This is a maximum bound, not a minimum token lifespan. Folder-limited tokens cannot gain token-management rights or import arbitrary File IDs. Upload scope currently reserves future functionality. Token manager credentials cannot issue wider descendants because bearer issuance is not exposed at all. Rotation overlaps old/new credentials until explicit revocation.

Lifecycle cleanup handles both deleted and newly created UIDs, including accounts recreated after deletion while an older app version was installed. Historical orphan metadata is not bulk-deleted. Live recreation isolation passed; arbitrary in-flight account deletion races remain untested. Large-flood throttling is not yet implemented; this foundation remains unsuitable for public production deployment until later security gates are met.

## Live Phase 2 security evidence

70 HTTP checks passed against the deployed app, including missing-token/session-fallback rejection, retained session CSRF, independent scopes, expiry/revocation, rotation overlap, no-store headers, restricted source/destination operations, restricted File ID import denial and real filesystem binding authorization. Deleted/recreated test UIDs inherited neither virtual nodes nor credentials, and another owner's data remained accessible. The suite does not cover general public production abuse, all external storage backends or every lifecycle race.
