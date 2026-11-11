# Read media by virtual path

Prepared in 0.10.0. Callers no longer need to discover a virtual node ID. These routes use Nextcloud routing and the existing owner-isolated virtual hierarchy, not physical filesystem paths. Existing ID-based APIs and previously issued temporary links remain supported.

## Direct URL, as requested by the owner

```text
https://kohtnas.com/index.php/apps/mediastorage/delivery/v1/10.10.2563%200443%20KiTKAT%20400/000013.JPG?key=YOUR_API_TOKEN
```

Replace YOUR_API_TOKEN with the complete `ms_selector.secret` API credential, URL-encoded as a query value. No file ID or physical Nextcloud path is required. The example refers to a virtual reference already present in the app; it does not expose arbitrary Nextcloud files. Scope `media:read` is required.

The user explicitly requested query credentials. Such URLs grant the credential's permissions to anyone receiving them. Do not log the query string, paste the full URL into diagnostics, or expose a broad management token in a public page. Use a read-only, restricted, expiring token. Browser history, intermediary logs and link sharing can retain a URL; no-store/no-referrer response headers cannot erase those copies. Review production access/error/tracing logs before public use. Never embed a real token in repository examples. A disclosed test token should be revoked and replaced.

## Path and bucket rules

- A token restricted to a bucket/folder resolves paths relative to that exact boundary, matching existing scoped API paths. It never falls back to the owner's root and cannot override its boundary with `bucket`.
- An unrestricted token resolves paths relative to Library by default. Use `?bucket=URL_ENCODED_BUCKET_NAME&key=TOKEN` to select another bucket by exact display name, without any ID. Unknown names return 404 rather than falling back. The renamed Library display name is also accepted.
- Names and paths are case-sensitive. Encode each segment once, preserving `/` separators. Spaces become `%20`; encode literal `%`, `?`, `#`, Unicode, and query values appropriately. No extra URL decoding occurs inside the service.
- Virtual rename/move changes the path; the old path returns 404. Rebinding a reference makes a direct path resolve its current authorized binding. Temporary URLs retain their existing pinned-content semantics.
- Missing/invalid/revoked/expired API credentials, wrong owner, insufficient scope, traversal, inaccessible bindings and folder paths do not return media. A path is an address, not authorization.

## Header-authenticated server requests

For backend integrations, keep the main API credential out of the URL:

```bash
MS_BASE="https://kohtnas.com/index.php/apps/mediastorage"
read -rsp 'API token: ' MS_TOKEN
echo
curl --fail-with-body \
  -H "Authorization: Bearer $MS_TOKEN" \
  "$MS_BASE/external/v1/media/10.10.2563%200443%20KiTKAT%20400/000013.JPG" \
  --output 000013.JPG
```

GET and HEAD support the same range, conditional, MIME, private-cache and bounded streaming rules as temporary delivery. Every request authenticates before lookup and conditional handling. Token owner lock covers authentication recheck, path/bucket lookup, binding permission checks and stream preparation. Existing token/IP/resource/issuer limits and stream leases apply. ETags are isolated by token and resource.

## Issue a browser URL from a path

```bash
curl --fail-with-body \
  -X POST \
  -H "Authorization: Bearer $MS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path":"/10.10.2563 0443 KiTKAT 400/000013.JPG","ttl_seconds":900}' \
  "$MS_BASE/external/v1/signed-urls"
```

Optional `bucket` is an exact bucket name for unrestricted tokens. Result: `url` and Unix `expires_at`, without a node ID or physical metadata. The returned URL is an opaque temporary capability; use it as returned rather than constructing it or substituting a filename. Its lifetime cannot exceed issuer expiry or server policy. Issuer revocation continues to invalidate derived links. Ordinary `<img>`/`<video>` elements can use this URL without exposing the long-lived API credential.

## Deployment

0.10.0 source must be installed on the server before these new path routes work. No production installation, App Store upload, commit or push has been performed by implementing this feature. Existing 0.9.x installations do not gain it merely because documentation changes. Hosting under a subdirectory requires that subdirectory in the base URL. Internal Nextcloud integrity signing remains a separate release concern.

## Validation

See [the 0.10.0 validation report](../release/0.10.0-path-api.md): 41 live path checks and 76 legacy temporary-access HTTP checks passed on an isolated Nextcloud 35.0.2 / PHP 8.4.27 / SQLite instance. No production call or deployment to kohtnas.com was performed.
