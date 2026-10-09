# API Contract

Proposed routes, not available endpoints. Prefix through Nextcloud routing: `/index.php/apps/mediastorage`. Generate actual URLs with Nextcloud's URL generator; do not hardcode the installation base path.

Use separate management and delivery namespaces to prevent a media filename such as `metadata` colliding with a management route.

| Method | Relative route | Purpose / phase |
| --- | --- | --- |
| GET | / | Authenticated management page / 1 |
| GET | /api/v1/nodes | Paginated children/search / 1 session, 2 bearer |
| POST | /api/v1/folders | Create under explicit parent / 1 |
| PATCH | /api/v1/nodes/{id} | Rename or move / 1 |
| DELETE | /api/v1/nodes/{id} | Remove virtual reference/subtree / 1 |
| POST | /api/v1/bindings | Bind accessible Nextcloud file / 1 |
| PATCH | /api/v1/bindings/{id} | Explicit rebind / 1 |
| POST | /api/v1/uploads | Validated media upload / 2–3 |
| GET | /api/v1/nodes/{id}/metadata | Authorized metadata / 2 |
| POST | /api/v1/nodes/{id}/signed-urls | Issue temporary read URL / 4 |
| GET, HEAD | /delivery/v1/{virtualPath} | Authorized media bytes / 4 |

Owner identity comes from the session or verified token, never a caller-supplied owner field. Final DTOs, pagination limits, root representation and error codes are to be implemented and documented together.

Expected statuses: 201 create, 200 read/update, 204 delete, 400 malformed input, 401 absent/invalid credentials, 403 insufficient permissions, 404 missing/inaccessible resource without owner leakage, 409 duplicate/cycle conflict, 413 oversized upload, 415 unsupported media, 429 throttled. Delivery adds 206, 304 and 416 with valid HTTP headers and authorization before conditional responses.
