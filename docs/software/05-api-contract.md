# API Contract

Phase 1 session routes are deployed and exercised by 33 live HTTP checks on the local Nextcloud 34.0.4 Snap instance. Later-phase routes remain proposals. Prefix through Nextcloud routing: `/index.php/apps/mediastorage`. Generate actual URLs with Nextcloud's URL generator; do not hardcode the installation base path.

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

## Implemented Phase 1 contract

All JSON endpoints require the authenticated Nextcloud session and the platform request token (`requesttoken` header). There is no bearer-token authentication yet. The controller never accepts an owner parameter.

- `GET /api/v1/nodes`: optional `parent_id`, `search`, `limit` (1–100), `offset` (nonnegative). Returns `root_id`, `parent_id`, `nodes`, `limit`, `offset`. Search without parent spans only the owner’s hierarchy.
- `GET /api/v1/nodes/{id}`: node, derived `virtual_path`, and `binding_status` (`available`/`needs_rebind`) for media. Available binding metadata is revalidated using Filesystem APIs.
- `GET /api/v1/resolve?path=/friends/image.png`: resolve the already-decoded virtual path within the authenticated owner.
- `POST /api/v1/folders`: JSON `name`, optional `parent_id`; 201 node. Create nested folders by using a returned parent ID in the next call.
- `PATCH /api/v1/nodes/{id}`: `name` and/or destination `parent_id`; 200 node; identity preserved.
- `DELETE /api/v1/nodes/{id}`: 204, deletes virtual subtree/bindings only. Root cannot be deleted.
- `POST /api/v1/bindings`: `name`, positive integer `file_id`, optional `parent_id`; 201 media node. The file must resolve unambiguously within the user’s accessible filesystem.
- `PATCH /api/v1/bindings/{id}`: `file_id`; here `{id}` is the **virtual media node ID**, not a separate binding ID. Revalidates and replaces binding explicitly.

Errors from domain validation return `{ "error": "safe message" }`. Names are UTF-8, at most 255 bytes, without leading/trailing whitespace, slash/backslash, dot segments or controls. Exact UTF-8 bytes define sibling name equality; case and Unicode-normalization variants are distinct. Paths are derived and change on virtual rename/move. No delivery URL is advertised before the delivery phase. Root plus descendants is limited to 128 levels; deleting/moving a subtree larger than 1000 nodes is rejected transactionally.
