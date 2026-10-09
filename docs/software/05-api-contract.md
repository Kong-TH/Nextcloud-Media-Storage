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

## Phase 2 contract — verified on local Nextcloud 34.0.4

All routes use the same Nextcloud app prefix. Session routes `/api/v1/tokens` (GET/POST), `/api/v1/tokens/{id}` (DELETE) and `/api/v1/tokens/{id}/rotate` (POST) retain authentication and CSRF. Issue JSON: `name`, unique nonempty `scopes` array, required integer Unix `expires_at`, optional owner-accessible folder/root `folder_id`. Success 201 includes `token` metadata and one-time `secret`. List returns `{ "tokens": [...] }` without secrets/verifiers, with limit/offset pagination and active/expired/revoked status. Delete is idempotent revocation (204). Rotation creates a fresh credential with identical permissions/folder/expiration; the old one remains usable until explicitly revoked. No long-lived secret may be embedded in a browser/backend-free client.

Bearer-only namespace: `/external/v1`. The controller deliberately has narrow public/CSRF exceptions and verifies `Authorization: Bearer ms_<selector>.<secret>` on every method. Session cookies never replace bearer authentication. No Origin/Referer/Fetch Metadata headers are required. No query-string credential is accepted. Unauthorized credentials produce 401 and WWW-Authenticate; insufficient scope 403. All token/bearer JSON responses set Cache-Control no-store.

| Method | External route | Required scope |
| --- | --- | --- |
| GET | /nodes | media:read |
| GET | /nodes/{id} | media:read |
| POST | /folders | media:manage |
| PATCH | /nodes/{id} | media:manage |
| DELETE | /nodes/{id} | media:delete |
| POST | /bindings | media:manage, owner-wide token only |
| PATCH | /bindings/{id} | media:manage, owner-wide token only |
| GET | /tokens | token:manage |
| DELETE | /tokens/{id} | token:manage |

Node/binding fields match the corresponding session routes. Metadata resolution includes virtual node and binding_status; available media has MIME and size under `media`, without physical path/storage identifiers. No bytes, generated public URL, upload or physical-delete endpoint exists. `media:upload` is an accepted reserved scope but gives no current permission. `token:manage` must be owner-wide and allows owner token list/revocation only; issuance/rotation requires a session. Permissions do not imply one another.

Folder restrictions follow the current hierarchy. Default parent/root is the restricted folder. Both move source and destination must be descendants; the boundary itself cannot be renamed, moved or deleted. Output paths are relative to the boundary and omit its parent ID. Restricted search stays within the selected parent. File-ID bind/rebind are prohibited for restricted tokens to prevent importing other owner files by guessing IDs. The dashboard or an owner-wide management token can prepare bindings. Renaming/moving a boundary using a session preserves its ID; deleting it makes scoped access fail closed.


## Requested reference Copy/Paste — not implemented

The user clarified that virtual Move/Rename/Copy/Paste/Remove must preserve physical Nextcloud files. Multiple virtual names/paths can reference the same original. Existing PATCH/DELETE node and binding routes retain their documented semantics. No copy, paste, physical file mutation or batch endpoint is added by this requirement. A source-reference clone contract must be designed before production Copy/Paste, including source/destination authorization, stable binding revalidation, conflict handling, subtree bounds and scoped-token behavior. File-ID binding must not be advertised as an already implemented general clone API. See [reference action design](../design/reference-actions.md).
