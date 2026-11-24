# Read media by virtual path

Prepared in 0.10.0. Callers no longer need to discover a virtual node ID. These routes use Nextcloud routing and the existing owner-isolated virtual hierarchy, not physical filesystem paths. Existing ID-based APIs and previously issued temporary links remain supported.

## Direct URL, as requested by the owner

```text
https://kohtnas.com/index.php/apps/mediastorage/delivery/v1/10.10.2563%200443%20KiTKAT%20400/000013.JPG?key=YOUR_API_TOKEN
```

Replace YOUR_API_TOKEN with the complete `ms_selector.secret` API credential, URL-encoded as a query value. No file ID or physical Nextcloud path is required. The example refers to a virtual reference already present in the app; it does not expose arbitrary Nextcloud files. Scope `media:read` is required.

The user explicitly requested query credentials. Such URLs grant the credential's permissions to anyone receiving them. Do not log the query string, paste the full URL into diagnostics, or expose a broad management token in a public page. Use a read-only, restricted, expiring token. Browser history, intermediary logs and link sharing can retain a URL; no-store/no-referrer response headers cannot erase those copies. Review production access/error/tracing logs before public use. Never embed a real token in repository examples. A disclosed test token should be revoked and replaced.

## Path and bucket rules

- In 0.11.0, use the full virtual path from the bucket root for delivery, header-authenticated reads and temporary-link issuance. A file at `/Album/photo.jpg` always uses `Album/photo.jpg`. Use **Object details → Copy virtual path** to obtain this path.
- Choose one bucket (including Library) or account-wide access when creating a token. A bucket token selects that bucket automatically. Previously issued folder tokens retain their existing permissions and require the full bucket-relative path. They cannot be rotated into new folder tokens. Replace them explicitly if needed.
- Scoped node listings remain relative to their access boundary. For legacy folder tokens, use the full path shown in the session UI instead of the shortened listing path when opening a file.
- The virtual hierarchy is managed independently of the original file's Nextcloud Files path. To keep a source folder as a virtual folder, select the folder in **Add from Nextcloud** and choose **Keep folder**. For existing references at the bucket root, create a virtual folder and move the references into it. This leaves the original files in place.
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

## Cloudflare challenges

If an API request receives a `Just a moment...` HTML page, inspect the `cf-mitigated` response header and look up the request's Ray ID in Cloudflare Security Events. Use the event to identify which rule or product to exempt for these reads. [Cloudflare challenge detection](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/detect-response/) · [Ray ID lookup](https://developers.cloudflare.com/fundamentals/reference/cloudflare-ray-id/)

This example matches the two GET routes used to list references and open media. Replace `kohtnas.com` with your hostname and adapt the path if Nextcloud is installed under a subdirectory. Use it as the filter for the applicable Cloudflare exception. The expression matches the path without the query string. Keep Media Storage token authorization enabled and omit tokens from Cloudflare expressions. [Cloudflare Skip configuration](https://developers.cloudflare.com/waf/custom-rules/skip/)

```text
(http.host eq "kohtnas.com" and http.request.method eq "GET" and http.request.uri.path eq "/index.php/apps/mediastorage/external/v1/nodes") or (http.host eq "kohtnas.com" and http.request.method eq "GET" and starts_with(http.request.uri.path, "/index.php/apps/mediastorage/delivery/v1/"))
```

After saving, repeat `GET /external/v1/nodes` with a `media:read` bearer token. A JSON response with `nodes: []` confirms that the API handled the request and found no matching children. For a scoped token, omit `search` to inspect that boundary's immediate children. To search within a child folder, send its `id` as `parent_id` to the listing endpoint. For a bucket token, use the returned `virtual_path` for delivery.

On 2026-11-24 the project owner confirmed that this expression let the listing request through Cloudflare. The listing returned JSON with an empty search result. Delivery of the reported production image remains unverified.

## Deployment

The path routes first shipped in 0.10.0. Install 0.11.0 for full bucket-relative paths with existing folder tokens and bucket-only restrictions on new tokens. Update previously shortened delivery URLs to include the full folder path. Hosting under a subdirectory requires that subdirectory in the base URL. Internal Nextcloud integrity signing remains a separate release concern.

## Validation

See [the 0.10.0 validation report](../release/0.10.0-path-api.md): 41 live path checks and 76 legacy temporary-access HTTP checks passed on an isolated Nextcloud 35.0.2 / PHP 8.4.27 / SQLite instance. No production call or deployment to kohtnas.com was performed.
