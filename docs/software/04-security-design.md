# Security Design

All controls below are requirements, not implemented guarantees.

Authorize every operation against an explicit owner. A File ID is never an authorization credential. Check underlying filesystem permissions for bind/read/upload/replace. Reference deletion cannot delete physical files; physical deletion requires a separate explicit operation and is outside Phase 1.

Retain Nextcloud session authentication and CSRF protections for management. Future server-to-server tokens need at least 256 bits of random entropy, secure verifiers, constant-time comparison where appropriate, one-time secret display, expiry, revocation, rotation and last-used metadata. Enforce media:read, media:upload, media:manage, media:delete and token:manage independently. Folder scopes apply to every affected source and destination, including moves.

Temporary URLs must authorize one resource and read-only use, have bounded expiry, and define revocation semantics. They may be copied and reused until invalidated. Domain allowlists, Referer and Fetch Metadata checks provide only best-effort browser hotlink filtering. Missing browser metadata must not invalidate otherwise authorized backend requests. CORS is not hotlink authentication.

Validate upload size, server-detected MIME, supported media types and permissions; do not trust filenames or client Content-Type. Reject traversal and SQL injection through validation and parameterized query APIs. Return safe errors and redact Authorization, URL credentials and signed query values from app and proxy logs.

Phase 4 must address per-IP/per-token limits, 429 responses, bounded uploads and concurrency where practical. Proxy/WAF protection is necessary for large floods. Private media must not enter shared caches. No DRM or restriction on saving authorized images is intended.
