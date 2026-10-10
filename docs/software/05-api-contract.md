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


## Historical Copy/Paste request — superseded by Phase 3

The user clarified that virtual Move/Rename/Copy/Paste/Remove must preserve physical Nextcloud files. Multiple virtual names/paths can reference the same original. Existing PATCH/DELETE node and binding routes retain their documented semantics. No copy, paste, physical file mutation or batch endpoint is added by this requirement. A source-reference clone contract must be designed before production Copy/Paste, including source/destination authorization, stable binding revalidation, conflict handling, subtree bounds and scoped-token behavior. File-ID binding must not be advertised as an already implemented general clone API. See [reference action design](../design/reference-actions.md).


## Phase 3 session explorer — implementation contract

GET /api/v1/buckets accepts nonnegative offset and returns {buckets:[{id,name,is_default}],has_more,offset}; pages include up to 100 additional buckets, with default Library prepended only at offset zero. POST /api/v1/buckets accepts name and returns 201 bucket. Default Library preserves the existing owner-root ID. POST /api/v1/nodes/{id}/copy accepts parent_id and optional name, clones bounded virtual metadata transactionally and revalidates bindings. No physical file is copied. These new routes require session authentication/CSRF and provide no external bearer exception. See 08-production-explorer.md for compatibility and deferred bucket rename/removal.

## Plugin virtual-path copying (frontend only)

Details exposes Copy virtual path for media references using the existing server-derived `virtual_path` returned by GET /nodes/{id}. The exact path is relative to the displayed bucket and follows virtual rename/move independently of the physical file. This command adds no API or delivery route. Paths do not grant access and are not currently browser-openable media URLs. No Nextcloud native viewer link is copied.


### Token-list lifetime policy (0.3.5)

`GET /api/v1/tokens?limit=100&offset=0` retains `tokens` and adds `policy: {server_time: <Unix seconds>, max_lifetime_seconds: <integer>}`. The lifetime is the existing `max_token_lifetime` configuration clamped to 60–31536000 seconds. Session authentication, CSRF middleware and no-store headers remain. The UI refreshes policy before creation; callers must still handle server rejection if policy changes. This is additive metadata, with no schema or bearer API change.


### Session bucket removal (0.3.6)

`DELETE /api/v1/buckets/{id}` removes an owned additional virtual bucket and its nested virtual nodes/bindings; returns 204. Requires session authentication and CSRF. Default Library/root returns 403; missing/cross-owner/non-bucket IDs return 404; a subtree over 1000 nodes returns 409 without partial removal. Original Nextcloud files and references elsewhere are preserved. Token boundary IDs are retained and do not widen access. Owner-root locking serializes with create/bind/move/copy/token issuance. Ordinary node routes still reject root/bucket deletion. No bearer bucket-management endpoint or schema change.


### Session bucket management (0.3.7)

`PATCH /api/v1/buckets/{id}` with `{name}` returns `{id,name,is_default}`; applies to additional buckets and the default root. Names must satisfy NodeRules and be unique for the owner including the default display name. Library is reserved for the default. Invalid name: 400; duplicate: 409; missing/cross-owner/non-bucket: 404.

`POST /api/v1/buckets/{id}/clear` returns 204 and removes virtual descendants and bindings while preserving bucket/root identity, name, physical files and other buckets. The traversal limit includes the retained root, as for deletion. Session/CSRF and owner-root locking apply to both commands. Default DELETE remains 403 even after renaming; no bearer management routes.

### UI-03 location restoration (0.3.9)

No endpoint changes. The frontend uses existing session GET buckets, GET node (parent_id/name/type) and paginated GET nodes with explicit parent_id/search/limit/offset to restore #ms: locations. Folder ancestry and optional detail parent must match the selected bucket/current folder. The fragment is UI metadata, not a media-delivery URL or authorization token. Server owner/session/CSRF enforcement remains authoritative.

## UI-09 implemented session contract — 0.4.0 (verified in installed 0.4.1)

| Method | Relative route | Contract |
| --- | --- | --- |
| GET | /api/v1/uploads/policy | Session and requesttoken; max_bytes, mime_types, storage_pattern, date_basis |
| POST | /api/v1/uploads | Session/CSRF multipart fields file, request_id (32 lowercase hex), name (virtual alias), parent_id (owned virtual folder) |
| GET | /api/v1/uploads/{id} | Session and requesttoken; owner-scoped reconciliation status |
| GET | /api/v1/nodes/{id}/preview?size=small or size=large | Authenticated safe GET, no CSRF header needed for img; fixed 96×96 or 1280×960 preview presets |
| GET | /api/v1/nodes/{id}/content | Authenticated safe GET; revalidate binding then 303 to current same-installation DAV file URL |

Upload returns HTTP 200 `{state:"complete",node:{...}}` for both initial completion and an identical retry. The server determines MIME and size from the uploaded temporary file, not multipart type/name/size. A request ID reused for a different parent/alias/content is 409; retry after the committed reference was removed is 410. Invalid IDs/names/empty/partial uploads are 400, inaccessible destinations 403/404, oversized files 413, unsupported content 415, locks 423 and insufficient quota 507. An unexpected failure is logged server-side and returns recovery guidance without private exception details. A failed response may follow a completed write; reconcile before claiming cancellation. Status is not_received, pending, complete (with node), or removed. IDs do not grant access independently of the session.

Physical storage is `Media Storage/YYYY-MM-DD/<server-random-id>.<mime-extension>` inside the account's home. Date uses core/timezone or UTC fallback, captured once for retry. Default max_upload_bytes is 104857600, capped at 1 GiB and clamped to worker PHP upload_max_filesize/post_max_size (64 KiB multipart allowance). Actual policy is authoritative. Partial/orphan originals are retained for manual recovery. No upload DELETE/physical rename/move API exists. Preview failures return explicit unavailable errors; previews use private no-store/nosniff/same-origin resource headers. Public/signed and external-token media delivery remain deferred; no external upload route is enabled by this change.

## Upload success presentation — 0.4.1

No schema or response contract changes. After a complete upload or reconciliation result, the frontend reads GET /api/v1/nodes/{id} for binding.last_known_path. It reports successful storage independently of this optional lookup. When available, Open folder in Nextcloud navigates to the standard Files route with the containing dir and view=files, encoded by URLSearchParams. No fileid/openfile or binary preview parameter is supplied. Paths remain session/owner-authorized; no public access or token is added.

## US-MS-06 — 0.5.0 temporary access contract

- POST /api/v1/nodes/{id}/signed-urls: session/CSRF, optional integer ttl_seconds (default 900, capped by policy); 201 {access, url}. access includes id, node_id, created_at, expires_at, revoked_at and status. The absolute generated plugin delivery URL contains only a temporary credential, returned once.
- GET /api/v1/nodes/{id}/signed-urls: session/CSRF; {access: [...], policy: {server_time, default_ttl_seconds, max_ttl_seconds}}, pagination limit 1–100/offset nonnegative, metadata only.
- DELETE /api/v1/access/{id}: session/CSRF; owner-only idempotent revocation, 204.
- POST /external/v1/nodes/{id}/signed-urls: same body/result, bearer media:read/current folder containment; expiry also capped at issuer expiry.
- DELETE /external/v1/access/{id}: bearer media:read; same issuer and current node containment required, 204.
- GET/HEAD /delivery/v1/{id}?key=<temporary-secret>: credential-only public read of exactly the pinned resource. Uniform no-store 404 for invalid/unavailable grants; 200 for authorized bytes/HEAD, 503 if an authorized stream cannot open. No API bearer/session fallback. HEAD never opens a stream. Range/conditional support remains US-MS-07; current responses advertise Accept-Ranges: none.

The legacy proposed virtual-path delivery route above is superseded by stable grant selectors. Exact binding/content/bucket and current issuer checks prevent resource substitution. Copy virtual path remains metadata-only. See [US-MS-06](../agile/user-stories/US-MS-06.md) for TTL, revocation and in-flight semantics.

Nextcloud/Apache may evaluate wildcard conditional headers on an already-authorized successful response. The app emits no validators in US-MS-06, and invalid/revoked requests must still return 404 even with conditional headers. Full validator/Range behavior remains US-MS-07.

Management `status` describes the grant's own active/expired/revoked lifecycle. It is not a guarantee that current owner/issuer/resource prerequisites still permit delivery; those are rechecked on every GET/HEAD.

## US-MS-07 — streaming/protection contract before implementation

Existing temporary delivery routes gain ETag, Last-Modified and Accept-Ranges: bytes. GET supports one bytes range with 206 and exact Content-Range/Length; HEAD ignores Range. If-Match/If-Unmodified-Since precede If-None-Match/If-Modified-Since; If-Range controls GET range fallback. Authorized empty responses use 304/412/416 as appropriate, with no credential/cache bypass. 416 includes Content-Range: bytes */size. Response cache policy remains private/no-store at every status. Rate/concurrency denial returns 429/Retry-After; unavailable protections/seek failure return sanitized 503. External bearer APIs also gain IP/token limits, with unchanged session/token scope semantics. No new public route or schema. Operator settings and precise malformed/multiple-range/origin behavior are in [US-MS-07](../agile/user-stories/US-MS-07.md). Earlier Accept-Ranges: none/basic-GET limits are superseded only after implementation and installed acceptance.

## Revision-validated explorer pages — 0.6.1 prepared

Session `GET /api/v1/nodes` adds opt-in `paged=true`, `sort=name|type`, `limit` 1–25 (UI uses 25), `offset` and nullable `revision`. Subsequent nonzero offsets require the revision returned by page one. Parent and search keep direct-child owner-scoped semantics; omitted parent is the default owner root. Response adds `total`, `has_more`, `next_offset`, `revision`, `limit`, `offset`, with globally database-ordered nodes and ID tie-breaking. Media rows include cached MIME metadata for type ordering; current binding details are hydrated only for each requested UI batch.

Invalid inputs return 400; foreign/missing parents remain 404; a changed owner-root lock_version before/after the page/count query returns 409 with reload guidance. This conservative revision can change for other owner metadata operations too. No persistent snapshot, full-collection materialization, schema or external API change. Legacy requests without paged retain the original 1–100 offset/hash ordering contract. Clients must keep initial/append errors distinct and must not append stale responses after navigation. UI-14 uses this revision-validated API to resolve a selection descriptor in bounded batches at command time; see the following contract.

## All-matching selection — 0.6.2 prepared

UI-14 captures parent/search/revision/total and excluded IDs in ephemeral UI state. Activation fetches no further rows. Command preparation lists the same scope in batches of 25 with the captured revision, validates total/ordering/unique IDs and performs a final limit=1 revision check before changing clipboard or submitting any mutation. Errors preserve the selection and require explicit reload on 409. The UI blocks competing navigation/submission during preparation and shows official linear progress. Existing per-object mutation/copy routes reauthorize each ID; a prepared selection is not an authorization grant or atomic multi-object transaction. Partial completion reports saved count and retains remaining IDs. No durable snapshot, extra route, schema or bearer contract is added.

## UI-15 implementation contract — 2026-10-10

Authorized after checkpoint d9f2d18. Prepare 0.7.0. The existing authenticated WebDAV Depth:1 enumeration remains complete per browsed folder (no picker paging); reject listings above 1000 entries or 2 MiB instead of silently selecting a truncated subset. Select all includes eligible direct children only, excluding unsupported MIME types and missing IDs. Selection is keyed by source ID and retained across navigation; folder navigation and row checkboxes are independent. One selected file keeps its optional display name; multiple selections use source names. Selected ancestors cover selected descendants once, with an explicit covered count.

Folder import defaults to preserving structure for UI-15; per-root flatten/keep choices remain UI-16. Before writes enumerate a bounded plan (1000 entries, 128 levels), report unsupported descendants, reject repeated/cyclic source IDs and duplicate top-level destination names. Existing destination name conflicts stop without overwriting. Sequential per-entry writes recheck authenticated source and destination access. A session-only POST /api/v1/imports/entries accepts request_id (UUID), file_id, folder flag, parent_id and name. Derive node ID from authenticated owner, request UUID and source ID; owner-locked retries return the existing identical node, rejecting changed parent/name/type/binding. This makes lost-response retries safe while that node exists, without a new schema or durable job promise. Deleting the created metadata removes this retry identity; the task is memory-only and is not resumed after reload.

Use official linear progress: indeterminate enumeration, determinate completed/total writes. Retain the prepared plan and completed mapping on failure, and retry the same request UUID. Cancellation stops future entries, waits for any in-flight write, and reports already created references; no rollback or original file operation. Disable source edits once a plan is prepared; Close discards the local task, not saved metadata. UI-16 will extend review choices and large-operation lifecycle separately. APIs have no external/bearer route and retain session/CSRF middleware. Source creation, moves and deletes remain unavailable.

## UI-16 implementation contract — 2026-10-10

Authorized after checkpoint 7fe4612. Extend the existing picker in the same dialog: review effective selected roots, choose Keep folder (default) or Import contents here independently, prepare a bounded destination preview, then confirm writes. An ancestor owns selected descendants; covered descendant choices are not offered, so overlapping selections cannot prescribe contradictory layouts. Flatten removes only the selected root wrapper; direct child folders and all deeper structure remain. Empty flattened roots produce zero references, reported explicitly. Root wrappers omitted from writes still count toward the 1000 scanned-source bound.

Keep the existing 1000-source / 128-level / 2 MiB listing limits, sequential entry writes, session-only source authorization and deterministic owner/request/source identities. Review renders at most 25 roots/preview rows initially with incremental disclosure. Build the full bounded plan through asynchronous per-folder Depth:1 requests; reject duplicate destination sibling names throughout the planned tree before writing. Preflight existing destination children in revision-validated 25-row pages, bounded to 10000 examined destination entries; fail explicitly beyond that bound. Recheck destination conflicts before the first write after confirmation. Concurrent changes can still fail at the existing atomic per-entry API; no overwrite, transactional whole-tree or snapshot promise.

Keep prepared choices and completed entry mapping locked after writes begin; Retry uses the same UUID and remaining entries. Stop waits for an in-flight write and stops future work. Before any saved references, Edit choices/Back may discard the prepared plan; after writes begin only Retry or Close is offered, with confirmed counts. Reload/Close loses the in-memory operation; deterministic retry identities survive only as created metadata, not a durable job or reload-resume API. This limitation is visible in review. No schema or endpoint changes are needed. Unsupported descendants are counted/skipped; inaccessible or mutated listings fail preparation with zero writes; write-time permission loss preserves/report confirmed partial work. Originals are never moved, renamed or deleted.
