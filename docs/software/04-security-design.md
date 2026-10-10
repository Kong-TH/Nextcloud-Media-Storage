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

## 0.3.0 explorer and buckets

Bucket list/create and reference Copy are session-only with normal CSRF requirements; owner IDs come from the current session. Bucket roots are immutable through ordinary node operations. Existing owner-root transaction locking protects new root/copy mutations. Copy revalidates bindings against current owner-accessible storage, preserves original files and rolls back duplicate/invalid subtrees. Folder-scoped tokens follow their stable boundaries and cannot cross separate bucket roots; owner-wide permissions keep their original scope. Owner cleanup includes bucket metadata.

The browser uses session/requesttoken helpers and same-origin DAV, with local assets and plugin-scoped CSS. No bearer credential is retained in browser persistence. Token secrets exist in memory until dialog close. Native modal tasks intentionally block the host document while open; the compact navigation scrim stays inside the plugin container. Live 0.3.0 HTTP coverage passed 91 checks; candidate host browser coverage passed 46, including token operations and physical-byte preservation. Final installed layout verification passed 46 browser checks with cache disabled and no asset interception. This does not establish public-production abuse resistance or full assistive-technology coverage.

2026-10-10: Copy virtual path copies plugin metadata only. The path is relative to the displayed bucket and contains no credential or physical filesystem path. It grants no access and is not currently an openable media URL. Clipboard rejection exposes a manual-copy text field and failure feedback. Native modal dialogs remain browser top-layer modals while explicitly restoring centering against the host reset. Material system colors are scoped to the plugin.

2026-10-10 user clarification supersedes the native file-link feature: Copy means the plugin's exact bucket-relative virtual_path, including virtual alias/folders. Replace Copy Nextcloud link with Copy virtual path, retain manual-copy fallback and show bucket context. This is metadata only; plugin browser media delivery is still deferred. Dialog and green interaction-state fixes remain. User redeployed the correction; 96 browser checks passed against installed assets with cache disabled and no interception.

## UI-09 upload/preview boundary

All new uploads derive the owner from the current Nextcloud session and require framework CSRF checks. Never accept a local file path from the client: the controller uses IRequest::getUploadedFile and is_uploaded_file. Server content detection, actual size, PHP limits, allowlisted MIME-derived extensions, owned virtual parent/name/depth, folder ownership, create permissions and quota precede reference creation. Account-local storage is independent of virtual buckets. Reservations and retries are owner-scoped, payload-fingerprinted and serialized by the owner root; a completed/deleted reference cannot be resurrected by retry. No recovery routine deletes or overwrites an original.

Preview/content routes waive CSRF only for safe authenticated GET embedding, never authentication or owner checks. Resolve file IDs only inside the authenticated user's accessible filesystem and revalidate readability, MIME and expected storage before calling Nextcloud preview/DAV. Fixed size presets bound preview requests. No bearer credentials, one-time token secrets, upload payloads or local temporary paths are placed in URLs or client persistence. External/public/signed delivery is not enabled.

## US-MS-06 temporary capabilities

See [temporary access contract](../agile/user-stories/US-MS-06.md). Anonymous bytes require a bounded, independently revocable capability pinned to one owner/node/bucket/file/storage/content version. Revalidate parent bearer scope/expiry/revocation and folder containment when applicable. Management retains CSRF or explicit bearer authentication. Uniform no-store 404 errors conceal capability/resource existence. No credentials in app logs or persistent browser state; delivery query keys require access-log redaction. In-flight authorized streams cannot be recalled. Ranges, rate limits and hotlink policy remain US-MS-07.

## US-MS-07 protection contract

Require current capability/bearer authorization before validators or range metadata. Count invalid attempts by trusted Nextcloud IP, aggregate valid grants/issuers across IPs, return no-store 429 with Retry-After, and bound concurrent streams by public provider locks. Core rate/file locking must be enabled; unavailable protection fails closed. Advisory exact-host filtering is optional and never replaces credentials; headerless authorized backends remain supported. No app-side X-Forwarded-For parsing. Native rate windows are best-effort under concurrency; proxy/WAF/timeouts remain needed. See [US-MS-07](../agile/user-stories/US-MS-07.md) for limits, stream cleanup and policy semantics.
